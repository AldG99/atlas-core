import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { PiPaperPlaneRightBold, PiBookOpenBold } from 'react-icons/pi';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { getRateLimitStatus, sendSupportMessage } from '../services/supportService';
import './Support.scss';

const MIN_MESSAGE_LENGTH = 20;
const MAX_MESSAGE_LENGTH = 500;
const MAX_SUBJECT_LENGTH = 80;
const DAILY_LIMIT = 1;
const COOLDOWN_SECONDS = 300; // 5 minutos
const MAX_LINE_BREAKS = 5;
const MAX_CONSECUTIVE_SPACES = 3;

const CONTENT_RULES: { regex: RegExp; message: string }[] = [
  { regex: /https?:\/\//i,                        message: 'El mensaje no puede contener enlaces.' },
  { regex: /www\.[a-z0-9-]+\.[a-z]{2,}/i,         message: 'El mensaje no puede contener enlaces.' },
  { regex: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i, message: 'El mensaje no puede contener correos electrónicos.' },
  { regex: /(.)\1{6,}/,                            message: 'El mensaje contiene repetición excesiva de caracteres.' },
  { regex: /[!?]{4,}/,                             message: 'El mensaje contiene demasiados signos de puntuación seguidos.' },
];

const validateMessage = (text: string): string | null => {
  for (const rule of CONTENT_RULES) {
    if (rule.regex.test(text)) return rule.message;
  }
  const breaks = (text.match(/\n/g) || []).length;
  if (breaks > MAX_LINE_BREAKS) {
    return `Máximo ${MAX_LINE_BREAKS} saltos de línea permitidos.`;
  }
  if (/  {3,}/.test(text)) {
    return `Máximo ${MAX_CONSECUTIVE_SPACES} espacios consecutivos permitidos.`;
  }
  return null;
};


const Support = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({ subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [messagesToday, setMessagesToday] = useState(0);

  const messageValid = formData.message.trim().length >= MIN_MESSAGE_LENGTH;
  const limited = messagesToday >= DAILY_LIMIT;
  const blocked = cooldownRemaining > 0 || limited;

  // Cargar estado de rate limit desde Firestore al montar
  const fetchRateLimit = useCallback(async () => {
    if (!user) return;
    const { messagesToday: count, cooldownEnds } = await getRateLimitStatus(user.uid);
    setMessagesToday(count);
    if (cooldownEnds) {
      const secsLeft = Math.ceil((cooldownEnds.getTime() - Date.now()) / 1000);
      setCooldownRemaining(Math.max(0, secsLeft));
    }
  }, [user]);

  useEffect(() => {
    fetchRateLimit();
  }, [fetchRateLimit]);

  // Contador de cooldown
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const timer = setTimeout(() => setCooldownRemaining(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldownRemaining]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.subject.trim() || !formData.message.trim()) {
      showToast(t('support.formIncomplete'), 'warning');
      return;
    }

    if (!messageValid) {
      showToast(t('support.errors.minLength', { min: MIN_MESSAGE_LENGTH }), 'warning');
      return;
    }

    const contentError = validateMessage(formData.message);
    if (contentError) {
      showToast(contentError, 'warning');
      return;
    }

    if (limited) {
      showToast(t('support.errors.dailyLimit', { limit: DAILY_LIMIT }), 'warning');
      return;
    }

    if (cooldownRemaining > 0) return;

    setSending(true);
    try {
      await sendSupportMessage(user!.uid, formData.subject, formData.message);
      showToast(t('support.sentSuccess'), 'success');
      setFormData({ subject: '', message: '' });
      setMessagesToday(c => c + 1);
      setCooldownRemaining(COOLDOWN_SECONDS);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'DAILY_LIMIT') {
        showToast(t('support.errors.dailyLimit', { limit: DAILY_LIMIT }), 'warning');
        setMessagesToday(DAILY_LIMIT);
      } else if (msg === 'COOLDOWN') {
        showToast(t('support.errors.cooldown'), 'warning');
      } else {
        showToast(t('support.sendError'), 'error');
      }
    } finally {
      setSending(false);
    }
  };

  const formatCooldown = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  return (
    <MainLayout>
      <div className="soporte">
        <div className="soporte__header">
          <h1>{t('support.title')}</h1>
          <p>{t('support.subtitle')}</p>
        </div>

        <div className="soporte__body">
          <section className="soporte__section">
            <div className="soporte__contact-card">
              <div className="soporte__contact-info">
                <PiBookOpenBold size={24} />
                <div>
                  <h3>{t('support.contactInfo')}</h3>
                  <p>{t('support.contactSubtitle')}</p>
                </div>
              </div>

              {limited ? (
                <p className="soporte__limite-msg">
                  {t('support.errors.dailyLimit', { limit: DAILY_LIMIT })}
                </p>
              ) : (
                <form className="soporte__form" onSubmit={handleSubmit}>
                  <div className="soporte__form-group">
                    <label htmlFor="asunto">{t('support.subject')}</label>
                    <input
                      type="text"
                      id="asunto"
                      className="input"
                      placeholder={t('support.subjectPlaceholder')}
                      value={formData.subject}
                      maxLength={MAX_SUBJECT_LENGTH}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      disabled={blocked}
                    />
                  </div>
                  <div className="soporte__form-group soporte__form-group--grow">
                    <label htmlFor="mensaje">
                      {t('support.message')}
                      <span className={`soporte__char-count ${messageValid ? 'soporte__char-count--ok' : ''} ${formData.message.length >= MAX_MESSAGE_LENGTH ? 'soporte__char-count--max' : ''}`}>
                        {formData.message.length}/{MAX_MESSAGE_LENGTH}
                      </span>
                    </label>
                    <textarea
                      id="mensaje"
                      className="input soporte__textarea"
                      placeholder={t('support.messagePlaceholder')}
                      value={formData.message}
                      maxLength={MAX_MESSAGE_LENGTH}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      disabled={blocked}
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn--primary"
                    disabled={sending || blocked || !messageValid}
                  >
                    {sending ? t('support.sending') : cooldownRemaining > 0 ? (
                      t('support.waitButton', { time: formatCooldown(cooldownRemaining) })
                    ) : (
                      <>
                        <PiPaperPlaneRightBold size={18} />
                        {t('support.send')}
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
};

export default Support;
