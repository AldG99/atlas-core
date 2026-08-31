import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Pencil,
  User,
  Lock,
  Eye,
  EyeOff,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import PhoneInput from '../components/clients/PhoneInput';
import { formatPhone } from '../utils/formatters';
import { getCountryCode } from '../data/countryCodes';
import Avatar from '../components/ui/Avatar';
import './Profile.scss';

const LETTERS_ONLY = /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s-]+$/;

const isFakePhone = (phone: string): boolean => {
  if (/^(\d)\1+$/.test(phone)) return true;
  let ascending = true;
  let descending = true;
  for (let i = 1; i < phone.length; i++) {
    if (parseInt(phone[i]) - parseInt(phone[i - 1]) !== 1) ascending = false;
    if (parseInt(phone[i - 1]) - parseInt(phone[i]) !== 1) descending = false;
  }
  return ascending || descending;
};

const getAge = (birthDate: string): number => {
  const today = new Date();
  // Interpretar 'YYYY-MM-DD' en hora local (no UTC) para que coincida con
  // `today` y con cómo se muestra la fecha más abajo.
  const birth = new Date(birthDate + 'T00:00:00');
  let age = today.getFullYear() - birth.getFullYear();
  const month = today.getMonth() - birth.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

interface FormErrors {
  businessName?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  phone?: string;
  street?: string;
  exteriorNumber?: string;
  neighborhood?: string;
  city?: string;
  postalCode?: string;
}

const Profile = () => {
  const { t } = useTranslation();
  const { user, updateProfile, changePassword } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);

  const [formData, setFormData] = useState({
    businessName: user?.businessName ?? '',
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    birthDate: user?.birthDate ?? '',
    phone: user?.phone ?? '',
    phoneCountryCode: user?.phoneCountryCode ?? 'MX',
    country: user?.country ?? '',
    state: user?.state ?? '',
    city: user?.city ?? '',
    neighborhood: user?.neighborhood ?? '',
    street: user?.street ?? '',
    exteriorNumber: user?.exteriorNumber ?? '',
    interiorNumber: user?.interiorNumber ?? '',
    postalCode: user?.postalCode ?? '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (formData.businessName.trim().length < 2) {
      newErrors.businessName = t('profile.errors.firstNameShort');
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = t('profile.errors.firstNameShort');
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = t('profile.errors.firstNameShort');
    } else if (!LETTERS_ONLY.test(formData.firstName.trim())) {
      newErrors.firstName = t('profile.errors.firstNameLetters');
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = t('profile.errors.lastNameShort');
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = t('profile.errors.lastNameShort');
    } else if (!LETTERS_ONLY.test(formData.lastName.trim())) {
      newErrors.lastName = t('profile.errors.lastNameLetters');
    }

    if (formData.birthDate) {
      const age = getAge(formData.birthDate);
      if (age < 18) newErrors.birthDate = t('profile.errors.dobAgeMin');
      else if (age > 100) newErrors.birthDate = t('profile.errors.dobAgeMax');
    }

    if (formData.phone) {
      if (formData.phone.length < 10) {
        newErrors.phone = t('profile.errors.phoneShort');
      } else if (isFakePhone(formData.phone)) {
        newErrors.phone = t('profile.errors.phoneInvalid');
      }
    }

    // La dirección es opcional en el perfil del administrador: solo se valida el
    // formato de los campos que tengan algo escrito, igual que birthDate/phone.
    // Así corregir el nombre no obliga a rellenar una dirección completa.
    if (formData.street.trim() && formData.street.trim().length < 3) {
      newErrors.street = t('clients.modal.errors.streetShort');
    }

    if (formData.exteriorNumber.trim() && !/\d/.test(formData.exteriorNumber)) {
      newErrors.exteriorNumber = t('clients.modal.errors.exteriorNumberInvalid');
    }

    if (formData.neighborhood.trim() && formData.neighborhood.trim().length < 3) {
      newErrors.neighborhood = t('clients.modal.errors.colonyShort');
    }

    if (formData.city.trim() && formData.city.trim().length < 3) {
      newErrors.city = t('clients.modal.errors.cityShort');
    }

    if (formData.postalCode.trim() && !/^\d{5}$/.test(formData.postalCode.trim())) {
      newErrors.postalCode = t('clients.modal.errors.postalInvalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      await updateProfile({
        businessName: formData.businessName.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        birthDate: formData.birthDate,
        phone: formData.phone,
        phoneCountryCode: formData.phoneCountryCode,
        // La dirección se guarda en mayúsculas, igual que en el detalle del cliente.
        country: formData.country.trim().toUpperCase(),
        state: formData.state.trim().toUpperCase(),
        city: formData.city.trim().toUpperCase(),
        neighborhood: formData.neighborhood.trim().toUpperCase(),
        street: formData.street.trim().toUpperCase(),
        exteriorNumber: formData.exteriorNumber.trim().toUpperCase(),
        interiorNumber: formData.interiorNumber.trim().toUpperCase(),
        postalCode: formData.postalCode.trim().toUpperCase(),
      });
      setIsEditing(false);
      showToast(t('profile.updateSuccess'), 'success');
    } catch {
      showToast(t('profile.updateError'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      businessName: user?.businessName ?? '',
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      birthDate: user?.birthDate ?? '',
      phone: user?.phone ?? '',
      phoneCountryCode: user?.phoneCountryCode ?? 'MX',
      country: user?.country ?? '',
      state: user?.state ?? '',
      city: user?.city ?? '',
      neighborhood: user?.neighborhood ?? '',
      street: user?.street ?? '',
      exteriorNumber: user?.exteriorNumber ?? '',
      interiorNumber: user?.interiorNumber ?? '',
      postalCode: user?.postalCode ?? '',
    });
    setErrors({});
    setIsEditing(false);
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    if (!passwordData.current) return setPasswordError(t('profile.errors.passwordCurrentRequired'));
    if (passwordData.new.length < 8) return setPasswordError(t('profile.errors.passwordNewMinLength'));
    if (passwordData.new !== passwordData.confirm) return setPasswordError(t('profile.errors.passwordMismatch'));
    setSavingPassword(true);
    try {
      await changePassword(passwordData.current, passwordData.new);
      showToast(t('profile.passwordUpdateSuccess'), 'success');
      setShowPasswordForm(false);
      setPasswordData({ current: '', new: '', confirm: '' });
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setPasswordError(t('profile.errors.passwordWrongCurrent'));
      } else if (code === 'auth/weak-password') {
        setPasswordError(t('errors.passwordTooShort'));
      } else {
        // Re-auth OK pero updatePassword falló (red, requires-recent-login…):
        // no confundir con "contraseña actual incorrecta".
        setPasswordError(t('errors.passwordChangeError'));
      }
    } finally {
      setSavingPassword(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 100);
  const minDateStr = minDate.toISOString().split('T')[0];

  return (
    <div className="profile-page">
      <div className="profile">
        <div className="profile__header">
          <button className="profile__back-btn" onClick={() => navigate(-1)} aria-label={t('common.back')}>
            <ArrowLeft size={20} />
          </button>
          <h1 className="profile__title">{t('profile.title')}</h1>
        </div>

        <div className="profile__body">

          {/* Formulario */}
          <div className="profile__card">
            {/* Identidad: foto a la izquierda, datos a la derecha */}
            <div className="profile__identity">
              <div className="profile__avatar">
                <Avatar src={user?.profilePhoto} seed={user?.uid ?? ''} alt={t('profile.profilePhoto')} />
              </div>

              {isEditing ? (
                <div className="profile__identity-fields">
                  <div className="profile__field profile__field--plain">
                    <label htmlFor="pf-businessName">{t('profile.businessName')}</label>
                    <input
                      id="pf-businessName"
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleChange}
                      className={`input${errors.businessName ? ' input--error' : ''}`}
                      placeholder={t('profile.businessNamePlaceholder')}
                      maxLength={60}
                      spellCheck
                      autoCorrect="on"
                      autoCapitalize="words"
                    />
                    {errors.businessName && <span className="profile__field-error">{errors.businessName}</span>}
                  </div>

                  <div className="profile__identity-row">
                    <div className="profile__field profile__field--plain">
                      <label htmlFor="pf-firstName">{t('profile.firstName')}</label>
                      <input
                        id="pf-firstName"
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className={`input${errors.firstName ? ' input--error' : ''}`}
                        placeholder={t('profile.firstName')}
                        maxLength={40}
                        spellCheck
                        autoCorrect="on"
                        autoCapitalize="words"
                      />
                      {errors.firstName && <span className="profile__field-error">{errors.firstName}</span>}
                    </div>

                    <div className="profile__field profile__field--plain">
                      <label htmlFor="pf-lastName">{t('profile.lastName')}</label>
                      <input
                        id="pf-lastName"
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className={`input${errors.lastName ? ' input--error' : ''}`}
                        placeholder={t('profile.lastName')}
                        maxLength={40}
                        spellCheck
                        autoCorrect="on"
                        autoCapitalize="words"
                      />
                      {errors.lastName && <span className="profile__field-error">{errors.lastName}</span>}
                    </div>
                  </div>

                  <div className="profile__field profile__field--plain">
                    <label>{t('profile.phone')}</label>
                    <PhoneInput
                      value={formData.phone}
                      countryCode={formData.phoneCountryCode}
                      onChange={(number, iso) => setFormData(prev => ({ ...prev, phone: number, phoneCountryCode: iso }))}
                      hasError={!!errors.phone}
                      placeholder={t('profile.phonePlaceholder')}
                    />
                    {errors.phone && <span className="profile__field-error">{errors.phone}</span>}
                  </div>
                </div>
              ) : (
                <div className="profile__identity-info">
                  <span className="profile__business">{user?.businessName || '—'}</span>
                  <span className="profile__person">
                    {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || '—'}
                  </span>
                  <span className="profile__phone">
                    {user?.phone
                      ? `${user.phoneCountryCode ? `${getCountryCode(user.phoneCountryCode)?.code ?? ''} ` : ''}${formatPhone(user.phone)}`
                      : '—'}
                  </span>
                </div>
              )}
            </div>

            <div className="profile__card-header">
              <User size={16} />
              <span>{t('profile.adminInfo')}</span>
              <div className="profile__card-header-actions">
                {isEditing ? (
                  <>
                    <button className="btn btn--outline btn--sm" onClick={handleCancel} disabled={saving}>
                      {t('common.cancel')}
                    </button>
                    <button className="btn btn--primary btn--sm" onClick={handleSave} disabled={saving}>
                      {saving ? t('common.saving') : t('profile.saveButton')}
                    </button>
                  </>
                ) : (
                  <button className="profile__action-btn profile__action-btn--primary" onClick={() => setIsEditing(true)} title={t('profile.editButton')} aria-label={t('profile.editButton')}>
                    <Pencil size={20} />
                  </button>
                )}
              </div>
            </div>

            <div className="profile__fields profile__fields--admin">
              {/* Fecha de nacimiento */}
              <div className="profile__field profile__field--full">
                <label htmlFor="pf-birthDate">{t('profile.dob')}</label>
                {isEditing ? (
                  <>
                    <input
                      id="pf-birthDate"
                      type="date"
                      name="birthDate"
                      value={formData.birthDate}
                      onChange={handleChange}
                      className={`input${errors.birthDate ? ' input--error' : ''}`}
                      max={today}
                      min={minDateStr}
                    />
                    {errors.birthDate && <span className="profile__field-error">{errors.birthDate}</span>}
                  </>
                ) : (
                  <p>
                    {user?.birthDate
                      ? new Date(user.birthDate + 'T00:00:00').toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' })
                      : '—'}
                  </p>
                )}
              </div>

              {/* Correo electrónico y Miembro desde — solo lectura, misma fila */}
              <div className="profile__field">
                <label>{t('profile.email')} <span className="profile__readonly-badge">{t('common.readOnly')}</span></label>
                <p className="profile__readonly">{user?.email || '—'}</p>
              </div>

              <div className="profile__field">
                <label>{t('profile.memberSince')} <span className="profile__readonly-badge">{t('common.readOnly')}</span></label>
                <p className="profile__readonly">
                  {user?.registeredAt
                    ? new Date(user.registeredAt).toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' })
                    : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Dirección — debajo de Información del administrador */}
          <div className="profile__card">
            <div className="profile__card-header">
              <MapPin size={16} />
              <span>{t('profile.address')}</span>
            </div>

            <div className="profile__fields">
              <div className="profile__field">
                <label htmlFor="pf-country">{t('clients.modal.country')}</label>
                {isEditing ? (
                  <input
                    id="pf-country"
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="input"
                    placeholder={t('clients.modal.countryPlaceholder')}
                    maxLength={40}
                  />
                ) : (
                  <p>{user?.country || '—'}</p>
                )}
              </div>

              <div className="profile__field">
                <label htmlFor="pf-state">{t('clients.modal.state')}</label>
                {isEditing ? (
                  <input
                    id="pf-state"
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="input"
                    placeholder={t('clients.modal.statePlaceholder')}
                    maxLength={60}
                  />
                ) : (
                  <p>{user?.state || '—'}</p>
                )}
              </div>

              <div className="profile__field">
                <label htmlFor="pf-city">{t('clients.modal.city')}</label>
                {isEditing ? (
                  <>
                    <input
                      id="pf-city"
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className={`input${errors.city ? ' input--error' : ''}`}
                      placeholder={t('clients.modal.cityPlaceholder')}
                      maxLength={60}
                    />
                    {errors.city && <span className="profile__field-error">{errors.city}</span>}
                  </>
                ) : (
                  <p>{user?.city || '—'}</p>
                )}
              </div>

              <div className="profile__field">
                <label htmlFor="pf-neighborhood">{t('clients.modal.colony')}</label>
                {isEditing ? (
                  <>
                    <input
                      id="pf-neighborhood"
                      type="text"
                      name="neighborhood"
                      value={formData.neighborhood}
                      onChange={handleChange}
                      className={`input${errors.neighborhood ? ' input--error' : ''}`}
                      placeholder={t('clients.modal.colonyPlaceholder')}
                      maxLength={60}
                    />
                    {errors.neighborhood && <span className="profile__field-error">{errors.neighborhood}</span>}
                  </>
                ) : (
                  <p>{user?.neighborhood || '—'}</p>
                )}
              </div>

              <div className="profile__field profile__field--full">
                <label htmlFor="pf-street">{t('clients.modal.street')}</label>
                {isEditing ? (
                  <>
                    <input
                      id="pf-street"
                      type="text"
                      name="street"
                      value={formData.street}
                      onChange={handleChange}
                      className={`input${errors.street ? ' input--error' : ''}`}
                      placeholder={t('clients.modal.streetPlaceholder')}
                      maxLength={80}
                    />
                    {errors.street && <span className="profile__field-error">{errors.street}</span>}
                  </>
                ) : (
                  <p>{user?.street || '—'}</p>
                )}
              </div>

              <div className="profile__field">
                <label htmlFor="pf-exteriorNumber">{t('clients.modal.exteriorNumber')}</label>
                {isEditing ? (
                  <>
                    <input
                      id="pf-exteriorNumber"
                      type="text"
                      name="exteriorNumber"
                      value={formData.exteriorNumber}
                      onChange={handleChange}
                      className={`input${errors.exteriorNumber ? ' input--error' : ''}`}
                      placeholder={t('clients.modal.exteriorNumberPlaceholder')}
                      maxLength={10}
                    />
                    {errors.exteriorNumber && <span className="profile__field-error">{errors.exteriorNumber}</span>}
                  </>
                ) : (
                  <p>{user?.exteriorNumber || '—'}</p>
                )}
              </div>

              <div className="profile__field">
                <label htmlFor="pf-interiorNumber">{t('clients.modal.interiorNumber')}</label>
                {isEditing ? (
                  <input
                    id="pf-interiorNumber"
                    type="text"
                    name="interiorNumber"
                    value={formData.interiorNumber}
                    onChange={handleChange}
                    className="input"
                    placeholder={t('clients.modal.interiorNumberPlaceholder')}
                    maxLength={20}
                  />
                ) : (
                  <p>{user?.interiorNumber || '—'}</p>
                )}
              </div>

              <div className="profile__field">
                <label htmlFor="pf-postalCode">{t('clients.modal.postal')}</label>
                {isEditing ? (
                  <>
                    <input
                      id="pf-postalCode"
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleChange}
                      className={`input${errors.postalCode ? ' input--error' : ''}`}
                      placeholder={t('clients.modal.postalPlaceholder')}
                      maxLength={5}
                    />
                    {errors.postalCode && <span className="profile__field-error">{errors.postalCode}</span>}
                  </>
                ) : (
                  <p>{user?.postalCode || '—'}</p>
                )}
              </div>
            </div>
          </div>

          <div className="profile__card">
            <div className="profile__card-header">
              <Lock size={16} />
              <span>{t('profile.security')}</span>
            </div>
            {!showPasswordForm ? (
              <div className="profile__password-trigger">
                <span>{t('profile.password')}</span>
                <button className="btn btn--outline btn--sm" onClick={() => setShowPasswordForm(true)}>
                  {t('profile.changePassword')}
                </button>
              </div>
            ) : (
              <div className="profile__password-form">
                <div className="profile__password-field">
                  <label htmlFor="pf-currentPassword">{t('profile.currentPassword')}</label>
                  <div className="profile__password-input">
                    <input
                      id="pf-currentPassword"
                      autoComplete="current-password"
                      type={showCurrentPwd ? 'text' : 'password'}
                      className="input"
                      placeholder="••••••••"
                      value={passwordData.current}
                      onChange={e => setPasswordData(p => ({ ...p, current: e.target.value }))}
                      maxLength={32}
                    />
                    <button type="button" onClick={() => setShowCurrentPwd(v => !v)} aria-label={t('profile.currentPassword')} aria-pressed={showCurrentPwd}>
                      {showCurrentPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="profile__password-field">
                  <label htmlFor="pf-newPassword">{t('profile.newPassword')}</label>
                  <div className="profile__password-input">
                    <input
                      id="pf-newPassword"
                      autoComplete="new-password"
                      type={showNewPwd ? 'text' : 'password'}
                      className="input"
                      placeholder="••••••••"
                      value={passwordData.new}
                      onChange={e => setPasswordData(p => ({ ...p, new: e.target.value }))}
                      maxLength={32}
                    />
                    <button type="button" onClick={() => setShowNewPwd(v => !v)} aria-label={t('profile.newPassword')} aria-pressed={showNewPwd}>
                      {showNewPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="profile__password-field">
                  <label htmlFor="pf-confirmPassword">{t('profile.confirmNewPassword')}</label>
                  <div className="profile__password-input">
                    <input
                      id="pf-confirmPassword"
                      autoComplete="new-password"
                      type="password"
                      className="input"
                      placeholder="••••••••"
                      value={passwordData.confirm}
                      onChange={e => setPasswordData(p => ({ ...p, confirm: e.target.value }))}
                      maxLength={32}
                    />
                  </div>
                </div>
                {passwordError && <span className="profile__field-error">{passwordError}</span>}
                <div className="profile__password-actions">
                  <button className="btn btn--outline btn--sm" onClick={() => { setShowPasswordForm(false); setPasswordData({ current: '', new: '', confirm: '' }); setPasswordError(''); }}>
                    {t('common.cancel')}
                  </button>
                  <button className="btn btn--primary btn--sm" onClick={handleChangePassword} disabled={savingPassword}>
                    {savingPassword ? t('common.saving') : t('common.save')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
