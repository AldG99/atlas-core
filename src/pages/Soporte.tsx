import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { PiCaretDownBold, PiPaperPlaneRightBold, PiBookOpenBold } from 'react-icons/pi';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { getRateLimitStatus, sendSupportMessage } from '../services/soporteService';
import './Soporte.scss';

const MIN_MENSAJE_LENGTH = 20;
const MAX_MENSAJE_LENGTH = 500;
const MAX_ASUNTO_LENGTH = 80;
const LIMITE_DIARIO = 1;
const COOLDOWN_SEGUNDOS = 300; // 5 minutos
const MAX_SALTOS_LINEA = 5;
const MAX_ESPACIOS_CONSECUTIVOS = 3;

const REGLAS_CONTENIDO: { regex: RegExp; mensaje: string }[] = [
  { regex: /https?:\/\//i,                        mensaje: 'El mensaje no puede contener enlaces.' },
  { regex: /www\.[a-z0-9-]+\.[a-z]{2,}/i,         mensaje: 'El mensaje no puede contener enlaces.' },
  { regex: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i, mensaje: 'El mensaje no puede contener correos electrónicos.' },
  { regex: /(.)\1{6,}/,                            mensaje: 'El mensaje contiene repetición excesiva de caracteres.' },
  { regex: /[!?]{4,}/,                             mensaje: 'El mensaje contiene demasiados signos de puntuación seguidos.' },
];

const validarMensaje = (texto: string): string | null => {
  for (const regla of REGLAS_CONTENIDO) {
    if (regla.regex.test(texto)) return regla.mensaje;
  }
  const saltos = (texto.match(/\n/g) || []).length;
  if (saltos > MAX_SALTOS_LINEA) {
    return `Máximo ${MAX_SALTOS_LINEA} saltos de línea permitidos.`;
  }
  if (/  {3,}/.test(texto)) {
    return `Máximo ${MAX_ESPACIOS_CONSECUTIVOS} espacios consecutivos permitidos.`;
  }
  return null;
};


const Soporte = () => {
  const { t } = useTranslation();
  const faqData = t('support.faq', { returnObjects: true }) as { question: string; answer: string }[];
  const { user } = useAuth();
  const { showToast } = useToast();
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [formData, setFormData] = useState({ asunto: '', mensaje: '' });
  const [sending, setSending] = useState(false);
  const [cooldownRestante, setCooldownRestante] = useState(0);
  const [mensajesHoy, setMensajesHoy] = useState(0);

  const mensajeValido = formData.mensaje.trim().length >= MIN_MENSAJE_LENGTH;
  const limitado = mensajesHoy >= LIMITE_DIARIO;
  const bloqueado = cooldownRestante > 0 || limitado;

  // Cargar estado de rate limit desde Firestore al montar
  const fetchRateLimit = useCallback(async () => {
    if (!user) return;
    const { mensajesHoy: count, cooldownEnds } = await getRateLimitStatus(user.uid);
    setMensajesHoy(count);
    if (cooldownEnds) {
      const secsLeft = Math.ceil((cooldownEnds.getTime() - Date.now()) / 1000);
      setCooldownRestante(Math.max(0, secsLeft));
    }
  }, [user]);

  useEffect(() => {
    fetchRateLimit();
  }, [fetchRateLimit]);

  // Contador de cooldown
  useEffect(() => {
    if (cooldownRestante <= 0) return;
    const timer = setTimeout(() => setCooldownRestante(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldownRestante]);

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.asunto.trim() || !formData.mensaje.trim()) {
      showToast(t('support.formIncomplete'), 'warning');
      return;
    }

    if (!mensajeValido) {
      showToast(t('support.errors.minLength', { min: MIN_MENSAJE_LENGTH }), 'warning');
      return;
    }

    const errorContenido = validarMensaje(formData.mensaje);
    if (errorContenido) {
      showToast(errorContenido, 'warning');
      return;
    }

    if (limitado) {
      showToast(t('support.errors.dailyLimit', { limit: LIMITE_DIARIO }), 'warning');
      return;
    }

    if (cooldownRestante > 0) return;

    setSending(true);
    try {
      await sendSupportMessage(user!.uid, formData.asunto, formData.mensaje);
      showToast(t('support.sentSuccess'), 'success');
      setFormData({ asunto: '', mensaje: '' });
      setMensajesHoy(c => c + 1);
      setCooldownRestante(COOLDOWN_SEGUNDOS);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'DAILY_LIMIT') {
        showToast(t('support.errors.dailyLimit', { limit: LIMITE_DIARIO }), 'warning');
        setMensajesHoy(LIMITE_DIARIO);
      } else if (msg === 'COOLDOWN') {
        showToast(t('support.errors.cooldown'), 'warning');
      } else {
        showToast(t('support.sendError'), 'error');
      }
    } finally {
      setSending(false);
    }
  };

  const formatCooldown = (seg: number) => {
    const m = Math.floor(seg / 60);
    const s = seg % 60;
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
          {/* FAQ */}
          <section className="soporte__section">
            <h2 className="soporte__section-title">{t('support.faqTitle')}</h2>
            <div className="soporte__faq">
              {faqData.map((item, index) => (
                <div
                  key={index}
                  className={`soporte__faq-item ${openFAQ === index ? 'soporte__faq-item--open' : ''}`}
                >
                  <button
                    className="soporte__faq-question"
                    onClick={() => toggleFAQ(index)}
                  >
                    <span>{item.question}</span>
                    <span className="soporte__faq-icon">
                      <PiCaretDownBold size={20} />
                    </span>
                  </button>
                  <div className="soporte__faq-answer">
                    <p>{item.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Formulario de Contacto */}
          <section className="soporte__section">
            <h2 className="soporte__section-title">{t('support.contactTitle')}</h2>
            <div className="soporte__contact-card">
              <div className="soporte__contact-info">
                <PiBookOpenBold size={24} />
                <div>
                  <h3>{t('support.contactInfo')}</h3>
                  <p>{t('support.contactSubtitle')}</p>
                </div>
              </div>

              {limitado ? (
                <p className="soporte__limite-msg">
                  {t('support.errors.dailyLimit', { limit: LIMITE_DIARIO })}
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
                      value={formData.asunto}
                      maxLength={MAX_ASUNTO_LENGTH}
                      onChange={(e) => setFormData({ ...formData, asunto: e.target.value })}
                      disabled={bloqueado}
                    />
                  </div>
                  <div className="soporte__form-group soporte__form-group--grow">
                    <label htmlFor="mensaje">
                      {t('support.message')}
                      <span className={`soporte__char-count ${mensajeValido ? 'soporte__char-count--ok' : ''} ${formData.mensaje.length >= MAX_MENSAJE_LENGTH ? 'soporte__char-count--max' : ''}`}>
                        {formData.mensaje.length}/{MAX_MENSAJE_LENGTH}
                      </span>
                    </label>
                    <textarea
                      id="mensaje"
                      className="input soporte__textarea"
                      placeholder={t('support.messagePlaceholder')}
                      value={formData.mensaje}
                      maxLength={MAX_MENSAJE_LENGTH}
                      onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                      disabled={bloqueado}
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn--primary"
                    disabled={sending || bloqueado || !mensajeValido}
                  >
                    {sending ? t('support.sending') : cooldownRestante > 0 ? (
                      t('support.waitButton', { time: formatCooldown(cooldownRestante) })
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

export default Soporte;
