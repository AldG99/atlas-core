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
import { useToast } from '../hooks/useToast';
import { useClientes } from '../hooks/useClientes';
import { useProductos } from '../hooks/useProductos';
import { usePedidos } from '../hooks/usePedidos';
import PhoneInput from '../components/clientes/PhoneInput';
import { formatTelefono } from '../utils/formatters';
import { getCodigoPais } from '../data/codigosPais';
import ImageCropper from '../components/ui/ImageCropper';
import Avatar from '../components/ui/Avatar';
import './Perfil.scss';

const SOLO_LETRAS = /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s-]+$/;

const esTelefonoFicticio = (tel: string): boolean => {
  if (/^(\d)\1+$/.test(tel)) return true;
  let esAscendente = true;
  let esDescendente = true;
  for (let i = 1; i < tel.length; i++) {
    if (parseInt(tel[i]) - parseInt(tel[i - 1]) !== 1) esAscendente = false;
    if (parseInt(tel[i - 1]) - parseInt(tel[i]) !== 1) esDescendente = false;
  }
  return esAscendente || esDescendente;
};

const getEdad = (fechaNacimiento: string): number => {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
  return edad;
};

interface FormErrors {
  nombreNegocio?: string;
  nombre?: string;
  apellido?: string;
  fechaNacimiento?: string;
  telefono?: string;
}

const Perfil = () => {
  const { t } = useTranslation();
  const { user, updateProfile, changePassword, role } = useAuth();
  const isMiembro = role === 'miembro';
  const { showToast } = useToast();
  const { clientes } = useClientes();
  const { productos } = useProductos();
  const { pedidos } = usePedidos();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(user?.fotoPerfil ?? null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditing) {
      setPreviewImage(user?.fotoPerfil ?? null);
    }
  }, [user?.fotoPerfil, isEditing]);

  const [formData, setFormData] = useState({
    nombreNegocio: user?.nombreNegocio ?? '',
    nombre: user?.nombre ?? '',
    apellido: user?.apellido ?? '',
    fechaNacimiento: user?.fechaNacimiento ?? '',
    telefono: user?.telefono ?? '',
    telefonoCodigoPais: user?.telefonoCodigoPais ?? 'MX',
  });

  const getInitials = () => {
    const name = user?.nombreNegocio;
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

    if (!formData.nombreNegocio.trim()) {
      newErrors.nombreNegocio = t('profile.errors.firstNameShort');
    } else if (formData.nombreNegocio.trim().length < 2) {
      newErrors.nombreNegocio = t('profile.errors.firstNameShort');
    }

    if (!formData.nombre.trim()) {
      newErrors.nombre = t('profile.errors.firstNameShort');
    } else if (formData.nombre.trim().length < 2) {
      newErrors.nombre = t('profile.errors.firstNameShort');
    } else if (!SOLO_LETRAS.test(formData.nombre.trim())) {
      newErrors.nombre = t('profile.errors.firstNameLetters');
    }

    if (!formData.apellido.trim()) {
      newErrors.apellido = t('profile.errors.lastNameShort');
    } else if (formData.apellido.trim().length < 2) {
      newErrors.apellido = t('profile.errors.lastNameShort');
    } else if (!SOLO_LETRAS.test(formData.apellido.trim())) {
      newErrors.apellido = t('profile.errors.lastNameLetters');
    }

    if (formData.fechaNacimiento) {
      const edad = getEdad(formData.fechaNacimiento);
      if (edad < 18) newErrors.fechaNacimiento = t('profile.errors.dobAgeMin');
      else if (edad > 100) newErrors.fechaNacimiento = t('profile.errors.dobAgeMax');
    }

    if (formData.telefono) {
      if (formData.telefono.length < 10) {
        newErrors.telefono = t('profile.errors.phoneShort');
      } else if (esTelefonoFicticio(formData.telefono)) {
        newErrors.telefono = t('profile.errors.phoneInvalid');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!isMiembro && !validate()) return;
    setSaving(true);
    const removePhotoData = photoRemoved && !imageFile ? { fotoPerfil: '' } : {};
    try {
      if (isMiembro) {
        await updateProfile(removePhotoData, imageFile ?? undefined);
      } else {
        await updateProfile({
          ...removePhotoData,
          nombreNegocio: formData.nombreNegocio.trim(),
          nombre: formData.nombre.trim(),
          apellido: formData.apellido.trim(),
          fechaNacimiento: formData.fechaNacimiento,
          telefono: formData.telefono,
          telefonoCodigoPais: formData.telefonoCodigoPais,
        }, imageFile);
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
      nombreNegocio: user?.nombreNegocio ?? '',
      nombre: user?.nombre ?? '',
      apellido: user?.apellido ?? '',
      fechaNacimiento: user?.fechaNacimiento ?? '',
      telefono: user?.telefono ?? '',
      telefonoCodigoPais: user?.telefonoCodigoPais ?? 'MX',
    });
    setPreviewImage(user?.fotoPerfil ?? null);
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

  const hoy = new Date().toISOString().split('T')[0];
  const minFecha = new Date();
  minFecha.setFullYear(minFecha.getFullYear() - 100);
  const minFechaStr = minFecha.toISOString().split('T')[0];

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
                  <span className="perfil__negocio">{user?.nombreNegocio}</span>
                  <span className="perfil__email">{isMiembro ? user?.username : user?.email}</span>
                </div>
              )}
            </div>

            <div className="perfil__card-header">
              <PiUserBold size={16} />
              <span>{isMiembro ? t('profile.memberInfo') : t('profile.adminInfo')}</span>
              {!isMiembro && (
                <div className="perfil__card-header-actions">
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
                {isEditing && !isMiembro ? (
                  <>
                    <input
                      type="text"
                      name="nombreNegocio"
                      value={formData.nombreNegocio}
                      onChange={handleChange}
                      className={`input${errors.nombreNegocio ? ' input--error' : ''}`}
                      placeholder={t('profile.businessNamePlaceholder')}
                      maxLength={60}
                    />
                    {errors.nombreNegocio && <span className="perfil__field-error">{errors.nombreNegocio}</span>}
                  </>
                ) : (
                  <p>{user?.nombreNegocio || '—'}</p>
                )}
              </div>

              {/* Nombre y Apellido */}
              <div className="perfil__field">
                <label>{t('profile.firstName')}</label>
                {isEditing && !isMiembro ? (
                  <>
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleChange}
                      className={`input${errors.nombre ? ' input--error' : ''}`}
                      placeholder={t('profile.firstName')}
                      maxLength={40}
                    />
                    {errors.nombre && <span className="perfil__field-error">{errors.nombre}</span>}
                  </>
                ) : (
                  <p>{user?.nombre || '—'}</p>
                )}
              </div>

              <div className="perfil__field">
                <label>{t('profile.lastName')}</label>
                {isEditing && !isMiembro ? (
                  <>
                    <input
                      type="text"
                      name="apellido"
                      value={formData.apellido}
                      onChange={handleChange}
                      className={`input${errors.apellido ? ' input--error' : ''}`}
                      placeholder={t('profile.lastName')}
                      maxLength={40}
                    />
                    {errors.apellido && <span className="perfil__field-error">{errors.apellido}</span>}
                  </>
                ) : (
                  <p>{user?.apellido || '—'}</p>
                )}
              </div>

              {/* Fecha de nacimiento */}
              <div className="perfil__field">
                <label>{t('profile.dob')}</label>
                {isEditing && !isMiembro ? (
                  <>
                    <input
                      type="date"
                      name="fechaNacimiento"
                      value={formData.fechaNacimiento}
                      onChange={handleChange}
                      className={`input${errors.fechaNacimiento ? ' input--error' : ''}`}
                      max={hoy}
                      min={minFechaStr}
                    />
                    {errors.fechaNacimiento && <span className="perfil__field-error">{errors.fechaNacimiento}</span>}
                  </>
                ) : (
                  <p>
                    {user?.fechaNacimiento
                      ? new Date(user.fechaNacimiento + 'T00:00:00').toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' })
                      : '—'}
                  </p>
                )}
              </div>

              {/* Teléfono */}
              <div className="perfil__field">
                <label>{t('profile.phone')}</label>
                {isEditing && !isMiembro ? (
                  <>
                    <PhoneInput
                      value={formData.telefono}
                      codigoPais={formData.telefonoCodigoPais}
                      onChange={(numero, iso) => setFormData(prev => ({ ...prev, telefono: numero, telefonoCodigoPais: iso }))}
                      hasError={!!errors.telefono}
                      placeholder={t('profile.phonePlaceholder')}
                    />
                    {errors.telefono && <span className="perfil__field-error">{errors.telefono}</span>}
                  </>
                ) : (
                  <p>
                    {user?.telefono
                      ? `${user.telefonoCodigoPais ? `${getCodigoPais(user.telefonoCodigoPais)?.codigo ?? ''} ` : ''}${formatTelefono(user.telefono)}`
                      : '—'}
                  </p>
                )}
              </div>

              {/* Email — solo lectura */}
              <div className="perfil__field perfil__field--full">
                <label>{isMiembro ? t('profile.username') : t('profile.email')} <span className="perfil__readonly-badge">{t('common.readOnly')}</span></label>
                <p className="perfil__readonly">{isMiembro ? user?.username : user?.email || '—'}</p>
              </div>

              {/* Fecha de registro — solo lectura */}
              <div className="perfil__field perfil__field--full">
                <label>{t('profile.memberSince')} <span className="perfil__readonly-badge">{t('common.readOnly')}</span></label>
                <p className="perfil__readonly">
                  {user?.fechaRegistro
                    ? new Date(user.fechaRegistro).toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' })
                    : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Cambiar contraseña — solo admin */}
          {!isMiembro && <div className="perfil__card">
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
                <span className="perfil__stat-value">{pedidos.length}</span>
                <span className="perfil__stat-label">{t('profile.statsOrders')}</span>
              </div>
            </div>
            <div className="perfil__stat">
              <div className="perfil__stat-icon">
                <PiUsersBold size={20} />
              </div>
              <div className="perfil__stat-info">
                <span className="perfil__stat-value">{clientes.length}</span>
                <span className="perfil__stat-label">{t('profile.statsClients')}</span>
              </div>
            </div>
            <div className="perfil__stat">
              <div className="perfil__stat-icon">
                <PiShoppingBagBold size={20} />
              </div>
              <div className="perfil__stat-info">
                <span className="perfil__stat-value">{productos.length}</span>
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

export default Perfil;
