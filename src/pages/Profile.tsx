import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  PiArrowLeftBold,
  PiPencilBold,
  PiUserBold,
  PiUsersBold,
  PiShoppingBagBold,
  PiReceiptBold,
  PiLockKeyBold,
  PiEyeBold,
  PiEyeSlashBold,
} from 'react-icons/pi';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useClients } from '../hooks/useClients';
import { useProducts } from '../hooks/useProducts';
import { useOrders } from '../hooks/useOrders';
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
  const birth = new Date(birthDate);
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
}

const Profile = () => {
  const { t } = useTranslation();
  const { user, updateProfile, changePassword, role } = useAuth();
  const isMember = role === 'member';
  const { showToast } = useToast();
  const { clients } = useClients();
  const { products } = useProducts();
  const { orders } = useOrders();
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
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.businessName.trim()) {
      newErrors.businessName = t('profile.errors.firstNameShort');
    } else if (formData.businessName.trim().length < 2) {
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!isMember && !validate()) return;

    setSaving(true);
    try {
      if (isMember) {
        await updateProfile({});
      } else {
        await updateProfile({
          businessName: formData.businessName.trim(),
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          birthDate: formData.birthDate,
          phone: formData.phone,
          phoneCountryCode: formData.phoneCountryCode,
        });
      }
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
    } catch {
      setPasswordError(t('profile.errors.passwordWrongCurrent'));
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
        {/* Controles flotantes */}
        <div className="profile__controls">
          <button className="profile__back-btn" onClick={() => navigate(-1)}>
            <PiArrowLeftBold size={20} />
          </button>
          <h1 className="profile__title">{t('profile.title')}</h1>
        </div>

        <div className="profile__body">

          {/* Formulario */}
          <div className="profile__card profile__card--main">
            {/* Avatar dentro del card */}
            <div className="profile__avatar-section">
              <div className="profile__avatar">
                <Avatar src={user?.profilePhoto} seed={user?.uid ?? ''} alt="Foto de perfil" />
              </div>
              {!isEditing && (
                <div className="profile__avatar-name">
                  <span className="profile__business">{user?.businessName}</span>
                  <span className="profile__email">{isMember ? user?.username : user?.email}</span>
                </div>
              )}
            </div>

            <div className="profile__card-header">
              <PiUserBold size={16} />
              <span>{isMember ? t('profile.memberInfo') : t('profile.adminInfo')}</span>
              {!isMember && (
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
                    <button className="profile__action-btn profile__action-btn--primary" onClick={() => setIsEditing(true)} title={t('profile.editButton')}>
                      <PiPencilBold size={20} />
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="profile__fields">
              {/* Nombre del negocio */}
              <div className="profile__field profile__field--full">
                <label>{t('profile.businessName')}</label>
                {isEditing && !isMember ? (
                  <>
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleChange}
                      className={`input${errors.businessName ? ' input--error' : ''}`}
                      placeholder={t('profile.businessNamePlaceholder')}
                      maxLength={60}
                    />
                    {errors.businessName && <span className="profile__field-error">{errors.businessName}</span>}
                  </>
                ) : (
                  <p>{user?.businessName || '—'}</p>
                )}
              </div>

              {/* Nombre y Apellido */}
              <div className="profile__field">
                <label>{t('profile.firstName')}</label>
                {isEditing && !isMember ? (
                  <>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={`input${errors.firstName ? ' input--error' : ''}`}
                      placeholder={t('profile.firstName')}
                      maxLength={40}
                    />
                    {errors.firstName && <span className="profile__field-error">{errors.firstName}</span>}
                  </>
                ) : (
                  <p>{user?.firstName || '—'}</p>
                )}
              </div>

              <div className="profile__field">
                <label>{t('profile.lastName')}</label>
                {isEditing && !isMember ? (
                  <>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={`input${errors.lastName ? ' input--error' : ''}`}
                      placeholder={t('profile.lastName')}
                      maxLength={40}
                    />
                    {errors.lastName && <span className="profile__field-error">{errors.lastName}</span>}
                  </>
                ) : (
                  <p>{user?.lastName || '—'}</p>
                )}
              </div>

              {/* Fecha de nacimiento */}
              <div className="profile__field">
                <label>{t('profile.dob')}</label>
                {isEditing && !isMember ? (
                  <>
                    <input
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

              {/* Teléfono */}
              <div className="profile__field">
                <label>{t('profile.phone')}</label>
                {isEditing && !isMember ? (
                  <>
                    <PhoneInput
                      value={formData.phone}
                      countryCode={formData.phoneCountryCode}
                      onChange={(number, iso) => setFormData(prev => ({ ...prev, phone: number, phoneCountryCode: iso }))}
                      hasError={!!errors.phone}
                      placeholder={t('profile.phonePlaceholder')}
                    />
                    {errors.phone && <span className="profile__field-error">{errors.phone}</span>}
                  </>
                ) : (
                  <p>
                    {user?.phone
                      ? `${user.phoneCountryCode ? `${getCountryCode(user.phoneCountryCode)?.code ?? ''} ` : ''}${formatPhone(user.phone)}`
                      : '—'}
                  </p>
                )}
              </div>

              {/* Email — solo lectura */}
              <div className="profile__field profile__field--full">
                <label>{isMember ? t('profile.username') : t('profile.email')} <span className="profile__readonly-badge">{t('common.readOnly')}</span></label>
                <p className="profile__readonly">{isMember ? user?.username : user?.email || '—'}</p>
              </div>

              {/* Fecha de registro — solo lectura */}
              <div className="profile__field profile__field--full">
                <label>{t('profile.memberSince')} <span className="profile__readonly-badge">{t('common.readOnly')}</span></label>
                <p className="profile__readonly">
                  {user?.registeredAt
                    ? new Date(user.registeredAt).toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' })
                    : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Cambiar contraseña — solo admin */}
          {!isMember && <div className="profile__card">
            <div className="profile__card-header">
              <PiLockKeyBold size={16} />
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
                  <label>{t('profile.currentPassword')}</label>
                  <div className="profile__password-input">
                    <input
                      type={showCurrentPwd ? 'text' : 'password'}
                      className="input"
                      placeholder="••••••••"
                      value={passwordData.current}
                      onChange={e => setPasswordData(p => ({ ...p, current: e.target.value }))}
                      maxLength={32}
                    />
                    <button type="button" onClick={() => setShowCurrentPwd(v => !v)}>
                      {showCurrentPwd ? <PiEyeSlashBold size={16} /> : <PiEyeBold size={16} />}
                    </button>
                  </div>
                </div>
                <div className="profile__password-field">
                  <label>{t('profile.newPassword')}</label>
                  <div className="profile__password-input">
                    <input
                      type={showNewPwd ? 'text' : 'password'}
                      className="input"
                      placeholder="••••••••"
                      value={passwordData.new}
                      onChange={e => setPasswordData(p => ({ ...p, new: e.target.value }))}
                      maxLength={32}
                    />
                    <button type="button" onClick={() => setShowNewPwd(v => !v)}>
                      {showNewPwd ? <PiEyeSlashBold size={16} /> : <PiEyeBold size={16} />}
                    </button>
                  </div>
                </div>
                <div className="profile__password-field">
                  <label>{t('profile.confirmNewPassword')}</label>
                  <div className="profile__password-input">
                    <input
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
          </div>}

          {/* Estadísticas */}
          <div className="profile__stats">
            <div className="profile__stat">
              <div className="profile__stat-icon">
                <PiReceiptBold size={20} />
              </div>
              <div className="profile__stat-info">
                <span className="profile__stat-value">{orders.length}</span>
                <span className="profile__stat-label">{t('profile.statsOrders')}</span>
              </div>
            </div>
            <div className="profile__stat">
              <div className="profile__stat-icon">
                <PiUsersBold size={20} />
              </div>
              <div className="profile__stat-info">
                <span className="profile__stat-value">{clients.length}</span>
                <span className="profile__stat-label">{t('profile.statsClients')}</span>
              </div>
            </div>
            <div className="profile__stat">
              <div className="profile__stat-icon">
                <PiShoppingBagBold size={20} />
              </div>
              <div className="profile__stat-info">
                <span className="profile__stat-value">{products.length}</span>
                <span className="profile__stat-label">{t('profile.statsProducts')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
