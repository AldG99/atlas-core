import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PiUsersThreeBold, PiXBold, PiWarningBold } from 'react-icons/pi';
import PhoneInput from '../clients/PhoneInput';
import type { MemberFormData } from '../../services/teamService';

interface CreateMemberModalProps {
  onClose: () => void;
  onSubmit: (form: MemberFormData) => Promise<void>;
}

const FORM_INITIAL: MemberFormData & { confirmPassword: string } = {
  firstName: '', lastName: '', birthDate: '',
  phone: '', phoneCountryCode: 'MX',
  password: '', confirmPassword: '',
};

const CreateMemberModal = ({ onClose, onSubmit }: CreateMemberModalProps) => {
  const { t } = useTranslation();
  const [form, setForm] = useState(FORM_INITIAL);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError(t('settings.team.createModal.passwordMismatch'));
      return;
    }
    if (!form.birthDate) {
      setError(t('settings.team.createModal.dobRequired'));
      return;
    }
    if (!form.phone || form.phone.length < 10) {
      setError(t('settings.team.createModal.phoneInvalid'));
      return;
    }

    setLoading(true);
    try {
      const data: MemberFormData = {
        firstName: form.firstName,
        lastName: form.lastName,
        birthDate: form.birthDate,
        phone: form.phone,
        phoneCountryCode: form.phoneCountryCode,
        password: form.password,
      };
      await onSubmit(data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('settings.team.createError'));
      setLoading(false);
    }
  };

  return (
    <div className="settings__modal-overlay" onClick={onClose}>
      <div className="settings__modal settings__modal--wide" onClick={e => e.stopPropagation()}>
        <div className="settings__modal-header">
          <PiUsersThreeBold size={20} className="settings__modal-icon" />
          <h3>{t('settings.team.createModal.title')}</h3>
          <button className="settings__modal-close" onClick={onClose}>
            <PiXBold size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="settings__modal-body">
            <div className="settings__modal-row">
              <div className="settings__modal-field">
                <label>{t('settings.team.createModal.firstName')}</label>
                <input
                  type="text"
                  className="input"
                  placeholder={t('auth.register.firstNamePlaceholder')}
                  value={form.firstName}
                  onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                  required
                  maxLength={40}
                />
              </div>
              <div className="settings__modal-field">
                <label>{t('settings.team.createModal.lastName')}</label>
                <input
                  type="text"
                  className="input"
                  placeholder={t('auth.register.lastNamePlaceholder')}
                  value={form.lastName}
                  onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                  required
                  maxLength={40}
                />
              </div>
            </div>
            <div className="settings__modal-field">
              <label>{t('settings.team.createModal.dob')}</label>
              <input
                type="date"
                className="input"
                value={form.birthDate}
                onChange={e => setForm(f => ({ ...f, birthDate: e.target.value }))}
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div className="settings__modal-field">
              <label>{t('settings.team.createModal.phone')}</label>
              <PhoneInput
                value={form.phone}
                countryCode={form.phoneCountryCode}
                onChange={(number, iso) => setForm(f => ({ ...f, phone: number, phoneCountryCode: iso }))}
                placeholder={t('auth.register.phonePlaceholder')}
              />
            </div>
            <div className="settings__modal-row">
              <div className="settings__modal-field">
                <label>{t('settings.team.createModal.password')}</label>
                <input
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  maxLength={32}
                />
              </div>
              <div className="settings__modal-field">
                <label>{t('settings.team.createModal.confirmPassword')}</label>
                <input
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  required
                  maxLength={32}
                />
              </div>
            </div>
            {error && (
              <div className="settings__file-error">
                <PiWarningBold size={14} />
                {error}
              </div>
            )}
          </div>
          <div className="settings__modal-actions">
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={onClose}
              disabled={loading}
            >
              {t('settings.team.createModal.cancel')}
            </button>
            <button type="submit" className="btn btn--primary btn--sm" disabled={loading}>
              {loading ? t('settings.team.createModal.submitting') : t('settings.team.createModal.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMemberModal;
