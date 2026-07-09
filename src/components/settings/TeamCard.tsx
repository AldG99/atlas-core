import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PiUsersThreeBold, PiWarningBold } from 'react-icons/pi';
import { useTeam } from '../../hooks/useTeam';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import { getPlanLimits } from '../../constants/planLimits';
import PhoneInput from '../clients/PhoneInput';
import Avatar from '../ui/Avatar';
import './TeamCard.scss';

const TeamCard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { members, loading, createMember, remove } = useTeam();
  const { showToast } = useToast();
  const planLimits = getPlanLimits(user?.plan);
  const planAllowsMembers = planLimits.members > 0;

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', birthDate: '', phone: '', phoneCountryCode: 'MX', password: '', confirmPassword: ''
  });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (form.password !== form.confirmPassword) {
      setFormError(t('settings.team.createModal.passwordMismatch'));
      return;
    }
    if (!form.birthDate) {
      setFormError(t('settings.team.createModal.dobRequired'));
      return;
    }
    if (!form.phone || form.phone.length < 10) {
      setFormError(t('settings.team.createModal.phoneInvalid'));
      return;
    }
    setCreating(true);
    try {
      await createMember({
        firstName: form.firstName,
        lastName: form.lastName,
        birthDate: form.birthDate,
        phone: form.phone,
        phoneCountryCode: form.phoneCountryCode,
        password: form.password,
      });
      showToast(t('settings.team.created'), 'success');
      setForm({ firstName: '', lastName: '', birthDate: '', phone: '', phoneCountryCode: 'MX', password: '', confirmPassword: '' });
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('settings.team.createError'));
    } finally {
      setCreating(false);
    }
  };

  const handleRemove = async (uid: string, name: string) => {
    try {
      await remove(uid);
      showToast(t('settings.team.removed', { name }), 'success');
    } catch {
      showToast(t('settings.team.removeError'), 'error');
    }
  };

  return (
    <div className="configuracion__card configuracion__card--full team-card">
      <div className="configuracion__card-header">
        <div className="configuracion__card-icon configuracion__card-icon--equipo">
          <PiUsersThreeBold size={18} />
        </div>
        <h2 className="configuracion__card-title">{t('settings.groups.team')}</h2>
      </div>
      <p className="configuracion__card-desc">
        {t('settings.team.desc')}
      </p>

      {loading ? (
        <div className="team-card__loading">{t('settings.team.loading')}</div>
      ) : (
        <>
          {members.length > 0 && (
            <div className="team-card__section">
              <p className="team-card__section-title">{t('settings.team.members')}</p>
              <ul className="team-card__list">
                {members.map((m) => (
                  <li key={m.uid} className="team-card__item">
                    <div className="team-card__item-avatar">
                      <Avatar
                        src={m.profilePhoto}
                        initials={`${(m.firstName?.[0] ?? '').toUpperCase()}${(m.lastName?.[0] ?? '').toUpperCase()}`}
                        alt={m.firstName}
                      />
                    </div>
                    <div className="team-card__item-info">
                      <span className="team-card__item-name">
                        {m.firstName} {m.lastName}
                      </span>
                      <span className="team-card__item-email">
                        {m.username}{m.memberNumber ? ` · ${t('settings.team.memberNumber', { number: m.memberNumber })}` : ''}
                      </span>
                    </div>
                    <button
                      className="btn btn--ghost btn--sm team-card__remove-btn"
                      onClick={() => handleRemove(m.uid, `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim())}
                      title={t('settings.team.removeTitle')}
                    >
                      {t('settings.team.remove')}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {members.length === 0 && (
            <p className="team-card__empty">{t('settings.team.empty')}</p>
          )}
        </>
      )}

      {!showForm ? (
        <button
          className="btn btn--primary btn--sm team-card__add-btn"
          onClick={() => setShowForm(true)}
          disabled={!planAllowsMembers}
          title={!planAllowsMembers ? t('settings.team.upgradePlanToAdd') : undefined}
        >
          {t('settings.team.newMember')}
        </button>
      ) : (
        <form onSubmit={handleCreate} className="team-card__form">
          <p className="team-card__section-title">{t('settings.team.createModal.title')}</p>
          <div className="team-card__form-row">
            <div className="team-card__form-field">
              <label>{t('settings.team.createModal.firstName')}</label>
              <input className="input" value={form.firstName} onChange={e => setForm(p => ({...p, firstName: e.target.value}))} placeholder={t('settings.team.createModal.firstName')} maxLength={40} required />
            </div>
            <div className="team-card__form-field">
              <label>{t('settings.team.createModal.lastName')}</label>
              <input className="input" value={form.lastName} onChange={e => setForm(p => ({...p, lastName: e.target.value}))} placeholder={t('settings.team.createModal.lastName')} maxLength={40} required />
            </div>
          </div>
          <div className="team-card__form-field">
            <label>{t('settings.team.createModal.dob')}</label>
            <input
              className="input"
              type="date"
              value={form.birthDate}
              onChange={e => setForm(p => ({...p, birthDate: e.target.value}))}
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
          <div className="team-card__form-field">
            <label>{t('settings.team.createModal.phone')}</label>
            <PhoneInput
              value={form.phone}
              countryCode={form.phoneCountryCode}
              onChange={(number, iso) => setForm(p => ({...p, phone: number, phoneCountryCode: iso}))}
              placeholder={t('settings.team.createModal.phone')}
            />
          </div>
          <div className="team-card__form-row">
            <div className="team-card__form-field">
              <label>{t('settings.team.createModal.password')}</label>
              <input className="input" type="password" value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))} placeholder="••••••••" required minLength={8} maxLength={32} />
            </div>
            <div className="team-card__form-field">
              <label>{t('settings.team.createModal.confirmPassword')}</label>
              <input className="input" type="password" value={form.confirmPassword} onChange={e => setForm(p => ({...p, confirmPassword: e.target.value}))} placeholder="••••••••" required maxLength={32} />
            </div>
          </div>
          {formError && (
            <div className="team-card__form-error">
              <PiWarningBold size={13} /> {formError}
            </div>
          )}
          <div className="team-card__form-actions">
            <button type="button" className="btn btn--outline btn--sm" onClick={() => { setShowForm(false); setFormError(''); }}>
              {t('settings.team.createModal.cancel')}
            </button>
            <button type="submit" className="btn btn--primary btn--sm" disabled={creating}>
              {creating ? t('settings.team.createModal.submitting') : t('settings.team.createModal.submit')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default TeamCard;
