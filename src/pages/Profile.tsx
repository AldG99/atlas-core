import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  PiArrowLeftBold,
  PiPencilBold,
  PiCameraBold,
  PiTrashBold,
  PiUserBold,
  PiUsersBold,
  PiShoppingBagBold,
  PiReceiptBold,
  PiLockKeyBold,
  PiEyeBold,
  PiEyeSlashBold,
} from 'react-icons/pi';
import { useAuth } from '../hooks/useAuth';
import { uploadProfileImage } from '../services/authService';
import { useToast } from '../hooks/useToast';
import { useClients } from '../hooks/useClients';
import { useProducts } from '../hooks/useProducts';
import { useOrders } from '../hooks/useOrders';
import PhoneInput from '../components/clients/PhoneInput';
import { formatPhone } from '../utils/formatters';
import { getCountryCode } from '../data/countryCodes';
import ImageCropper from '../components/ui/ImageCropper';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(user?.profilePhoto ?? null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditing) {
      setPreviewImage(user?.profilePhoto ?? null);
    }
  }, [user?.profilePhoto, isEditing]);

  const [formData, setFormData] = useState({
    businessName: user?.businessName ?? '',
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    birthDate: user?.birthDate ?? '',
    phone: user?.phone ?? '',
    phoneCountryCode: user?.phoneCountryCode ?? 'MX',
  });

  const getInitials = () => {
    const name = user?.businessName;
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageClick = () => {
    if (isEditing) fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCropSrc(reader.result as string);
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleCropConfirm = (blob: Blob, url: string) => {
    setImageFile(new File([blob], 'perfil.jpg', { type: 'image/jpeg' }));
    setPreviewImage(url);
    setCropSrc(null);
  };

  const removeImage = () => {
    setPreviewImage(null);
    setImageFile(null);
    setPhotoRemoved(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
    const removePhotoData = photoRemoved && !imageFile ? { profilePhoto: '' } : {};

    let uploadedPhotoUrl: string | undefined;
    if (imageFile && user) {
      setIsUploading(true);
      try {
        uploadedPhotoUrl = await uploadProfileImage(imageFile, user.uid);
      } catch (error) {
        const msg = error instanceof Error ? error.message : '';
        if (msg === 'IMAGEN_RECHAZADA') showToast(t('common.imageModeration.rejected'), 'error');
        else if (msg === 'MODERACION_TIMEOUT') showToast(t('common.imageModeration.timeout'), 'warning');
        else showToast(t('common.imageModeration.error'), 'error');
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    setSaving(true);
    const photoData = uploadedPhotoUrl ? { profilePhoto: uploadedPhotoUrl } : removePhotoData;
    try {
      if (isMember) {
        await updateProfile(photoData);
      } else {
        await updateProfile({
          ...photoData,
          businessName: formData.businessName.trim(),
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          birthDate: formData.birthDate,
          phone: formData.phone,
          phoneCountryCode: formData.phoneCountryCode,
        });
      }
      setIsEditing(false);
      setImageFile(null);
      setPhotoRemoved(false);
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
    setPreviewImage(user?.profilePhoto ?? null);
    setImageFile(null);
    setPhotoRemoved(false);
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
    <div className="perfil-page">
      <div className="perfil">
        {/* Controles flotantes */}
        <div className="perfil__controls">
          <button className="perfil__back-btn" onClick={() => navigate(-1)}>
            <PiArrowLeftBold size={20} />
          </button>
          <h1 className="perfil__title">{t('profile.title')}</h1>
        </div>

        <div className="perfil__body">

          {/* Formulario */}
          <div className="perfil__card perfil__card--main">
            {/* Avatar dentro del card */}
            <div className="perfil__avatar-section">
              <div
                className={`perfil__avatar${isEditing ? ' perfil__avatar--editable' : ''}`}
                onClick={handleImageClick}
              >
                <Avatar src={previewImage} initials={getInitials()} alt="Foto de perfil" />
                {isEditing && (
                  <div className="perfil__avatar-overlay">
                    <PiCameraBold size={22} />
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
              {isEditing && previewImage && (
                <button type="button" className="perfil__remove-photo" onClick={removeImage}>
                  <PiTrashBold size={14} />
                  {t('profile.removePhoto')}
                </button>
              )}
              {!isEditing && (
                <div className="perfil__avatar-name">
                  <span className="perfil__negocio">{user?.businessName}</span>
                  <span className="perfil__email">{isMember ? user?.username : user?.email}</span>
                </div>
              )}
            </div>

            <div className="perfil__card-header">
              <PiUserBold size={16} />
              <span>{isMember ? t('profile.memberInfo') : t('profile.adminInfo')}</span>
              {!isMember && (
                <div className="perfil__card-header-actions">
                  {isEditing ? (
                    <>
                      <button className="btn btn--outline btn--sm" onClick={handleCancel} disabled={saving || isUploading}>
                        {t('common.cancel')}
                      </button>
                      <button className="btn btn--primary btn--sm" onClick={handleSave} disabled={saving || isUploading}>
                        {isUploading ? t('common.imageModeration.verifying') : saving ? t('common.saving') : t('profile.saveButton')}
                      </button>
                    </>
                  ) : (
                    <button className="perfil__action-btn perfil__action-btn--primary" onClick={() => setIsEditing(true)} title={t('profile.editButton')}>
                      <PiPencilBold size={20} />
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="perfil__fields">
              {/* Nombre del negocio */}
              <div className="perfil__field perfil__field--full">
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
                    {errors.businessName && <span className="perfil__field-error">{errors.businessName}</span>}
                  </>
                ) : (
                  <p>{user?.businessName || '—'}</p>
                )}
              </div>

              {/* Nombre y Apellido */}
              <div className="perfil__field">
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
                    {errors.firstName && <span className="perfil__field-error">{errors.firstName}</span>}
                  </>
                ) : (
                  <p>{user?.firstName || '—'}</p>
                )}
              </div>

              <div className="perfil__field">
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
                    {errors.lastName && <span className="perfil__field-error">{errors.lastName}</span>}
                  </>
                ) : (
                  <p>{user?.lastName || '—'}</p>
                )}
              </div>

              {/* Fecha de nacimiento */}
              <div className="perfil__field">
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
                    {errors.birthDate && <span className="perfil__field-error">{errors.birthDate}</span>}
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
              <div className="perfil__field">
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
                    {errors.phone && <span className="perfil__field-error">{errors.phone}</span>}
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
              <div className="perfil__field perfil__field--full">
                <label>{isMember ? t('profile.username') : t('profile.email')} <span className="perfil__readonly-badge">{t('common.readOnly')}</span></label>
                <p className="perfil__readonly">{isMember ? user?.username : user?.email || '—'}</p>
              </div>

              {/* Fecha de registro — solo lectura */}
              <div className="perfil__field perfil__field--full">
                <label>{t('profile.memberSince')} <span className="perfil__readonly-badge">{t('common.readOnly')}</span></label>
                <p className="perfil__readonly">
                  {user?.registeredAt
                    ? new Date(user.registeredAt).toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' })
                    : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Cambiar contraseña — solo admin */}
          {!isMember && <div className="perfil__card">
            <div className="perfil__card-header">
              <PiLockKeyBold size={16} />
              <span>{t('profile.security')}</span>
            </div>
            {!showPasswordForm ? (
              <div className="perfil__password-trigger">
                <span>{t('profile.password')}</span>
                <button className="btn btn--outline btn--sm" onClick={() => setShowPasswordForm(true)}>
                  {t('profile.changePassword')}
                </button>
              </div>
            ) : (
              <div className="perfil__password-form">
                <div className="perfil__password-field">
                  <label>{t('profile.currentPassword')}</label>
                  <div className="perfil__password-input">
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
                <div className="perfil__password-field">
                  <label>{t('profile.newPassword')}</label>
                  <div className="perfil__password-input">
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
                <div className="perfil__password-field">
                  <label>{t('profile.confirmNewPassword')}</label>
                  <div className="perfil__password-input">
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
                {passwordError && <span className="perfil__field-error">{passwordError}</span>}
                <div className="perfil__password-actions">
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
          <div className="perfil__stats">
            <div className="perfil__stat">
              <div className="perfil__stat-icon">
                <PiReceiptBold size={20} />
              </div>
              <div className="perfil__stat-info">
                <span className="perfil__stat-value">{orders.length}</span>
                <span className="perfil__stat-label">{t('profile.statsOrders')}</span>
              </div>
            </div>
            <div className="perfil__stat">
              <div className="perfil__stat-icon">
                <PiUsersBold size={20} />
              </div>
              <div className="perfil__stat-info">
                <span className="perfil__stat-value">{clients.length}</span>
                <span className="perfil__stat-label">{t('profile.statsClients')}</span>
              </div>
            </div>
            <div className="perfil__stat">
              <div className="perfil__stat-icon">
                <PiShoppingBagBold size={20} />
              </div>
              <div className="perfil__stat-info">
                <span className="perfil__stat-value">{products.length}</span>
                <span className="perfil__stat-label">{t('profile.statsProducts')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
        {cropSrc && (
          <ImageCropper
            imageSrc={cropSrc}
            onConfirm={handleCropConfirm}
            onCancel={() => setCropSrc(null)}
          />
        )}
    </div>
  );
};

export default Profile;
