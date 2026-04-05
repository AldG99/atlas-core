import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PiUsersThreeBold, PiWarningBold } from 'react-icons/pi';
import { useEquipo } from '../../hooks/useEquipo';
import { useToast } from '../../hooks/useToast';
import PhoneInput from '../clientes/PhoneInput';
import Avatar from '../ui/Avatar';
import './EquipoCard.scss';

const EquipoCard = () => {
  const { t } = useTranslation();
  const { miembros, loading, crearMiembro, remover } = useEquipo();
  const { showToast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    nombre: '', apellido: '', fechaNacimiento: '', telefono: '', telefonoCodigoPais: 'MX', password: '', confirmarPassword: ''
  });
  const [creando, setCreando] = useState(false);
  const [formError, setFormError] = useState('');

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (form.password !== form.confirmarPassword) {
      setFormError(t('settings.team.createModal.passwordMismatch'));
      return;
    }
    if (!form.fechaNacimiento) {
      setFormError(t('settings.team.createModal.dobRequired'));
      return;
    }
    if (!form.telefono || form.telefono.length < 10) {
      setFormError(t('settings.team.createModal.phoneInvalid'));
      return;
    }
    setCreando(true);
    try {
      await crearMiembro({
        nombre: form.nombre,
        apellido: form.apellido,
        fechaNacimiento: form.fechaNacimiento,
        telefono: form.telefono,
        telefonoCodigoPais: form.telefonoCodigoPais,
        password: form.password,
      });
      showToast(t('settings.team.created'), 'success');
      setForm({ nombre: '', apellido: '', fechaNacimiento: '', telefono: '', telefonoCodigoPais: 'MX', password: '', confirmarPassword: '' });
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('settings.team.createError'));
    } finally {
      setCreando(false);
    }
  };

  const handleRemover = async (uid: string, nombre: string) => {
    try {
      await remover(uid);
      showToast(t('settings.team.removed', { name: nombre }), 'success');
    } catch {
      showToast(t('settings.team.removeError'), 'error');
    }
  };

  return (
    <div className="configuracion__card configuracion__card--full equipo-card">
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
        <div className="equipo-card__loading">{t('settings.team.loading')}</div>
      ) : (
        <>
          {miembros.length > 0 && (
            <div className="equipo-card__section">
              <p className="equipo-card__section-title">{t('settings.team.members')}</p>
              <ul className="equipo-card__list">
                {miembros.map((m) => (
                  <li key={m.uid} className="equipo-card__item">
                    <div className="equipo-card__item-avatar">
                      <Avatar
                        src={m.fotoPerfil}
                        initials={`${(m.nombre?.[0] ?? '').toUpperCase()}${(m.apellido?.[0] ?? '').toUpperCase()}`}
                        alt={m.nombre}
                      />
                    </div>
                    <div className="equipo-card__item-info">
                      <span className="equipo-card__item-name">
                        {m.nombre} {m.apellido}
                      </span>
                      <span className="equipo-card__item-email">
                        {m.username}{m.numeroMiembro ? ` · ${t('settings.team.memberNumber', { number: m.numeroMiembro })}` : ''}
                      </span>
                    </div>
                    <button
                      className="btn btn--ghost btn--sm equipo-card__remove-btn"
                      onClick={() => handleRemover(m.uid, `${m.nombre ?? ''} ${m.apellido ?? ''}`.trim())}
                      title={t('settings.team.removeTitle')}
                    >
                      {t('settings.team.remove')}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {miembros.length === 0 && (
            <p className="equipo-card__empty">{t('settings.team.empty')}</p>
          )}
        </>
      )}

      {!showForm ? (
        <button className="btn btn--primary btn--sm equipo-card__add-btn" onClick={() => setShowForm(true)}>
          {t('settings.team.newMember')}
        </button>
      ) : (
        <form onSubmit={handleCrear} className="equipo-card__form">
          <p className="equipo-card__section-title">{t('settings.team.createModal.title')}</p>
          <div className="equipo-card__form-row">
            <div className="equipo-card__form-field">
              <label>{t('settings.team.createModal.firstName')}</label>
              <input className="input" value={form.nombre} onChange={e => setForm(p => ({...p, nombre: e.target.value}))} placeholder={t('settings.team.createModal.firstName')} maxLength={40} required />
            </div>
            <div className="equipo-card__form-field">
              <label>{t('settings.team.createModal.lastName')}</label>
              <input className="input" value={form.apellido} onChange={e => setForm(p => ({...p, apellido: e.target.value}))} placeholder={t('settings.team.createModal.lastName')} maxLength={40} required />
            </div>
          </div>
          <div className="equipo-card__form-field">
            <label>{t('settings.team.createModal.dob')}</label>
            <input
              className="input"
              type="date"
              value={form.fechaNacimiento}
              onChange={e => setForm(p => ({...p, fechaNacimiento: e.target.value}))}
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
          <div className="equipo-card__form-field">
            <label>{t('settings.team.createModal.phone')}</label>
            <PhoneInput
              value={form.telefono}
              codigoPais={form.telefonoCodigoPais}
              onChange={(numero, iso) => setForm(p => ({...p, telefono: numero, telefonoCodigoPais: iso}))}
              placeholder={t('settings.team.createModal.phone')}
            />
          </div>
          <div className="equipo-card__form-row">
            <div className="equipo-card__form-field">
              <label>{t('settings.team.createModal.password')}</label>
              <input className="input" type="password" value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))} placeholder="••••••••" required minLength={8} maxLength={32} />
            </div>
            <div className="equipo-card__form-field">
              <label>{t('settings.team.createModal.confirmPassword')}</label>
              <input className="input" type="password" value={form.confirmarPassword} onChange={e => setForm(p => ({...p, confirmarPassword: e.target.value}))} placeholder="••••••••" required maxLength={32} />
            </div>
          </div>
          {formError && (
            <div className="equipo-card__form-error">
              <PiWarningBold size={13} /> {formError}
            </div>
          )}
          <div className="equipo-card__form-actions">
            <button type="button" className="btn btn--outline btn--sm" onClick={() => { setShowForm(false); setFormError(''); }}>
              {t('settings.team.createModal.cancel')}
            </button>
            <button type="submit" className="btn btn--primary btn--sm" disabled={creando}>
              {creando ? t('settings.team.createModal.submitting') : t('settings.team.createModal.submit')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default EquipoCard;
