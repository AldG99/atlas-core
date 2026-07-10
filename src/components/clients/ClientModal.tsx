import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { PiXBold, PiUserBold } from 'react-icons/pi';
import type { ClientFormData } from '../../types/Client';
import { isValidPhone } from '../../utils/validators';
import { uploadClientImage } from '../../services/clientService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import PhoneInput from './PhoneInput';
import ImageCropper from '../ui/ImageCropper';
import './ClientModal.scss';

const DISPOSABLE_DOMAINS = [
  'mailinator.com', 'tempmail.com', 'guerrillamail.com', 'throwam.com',
  'trashmail.com', 'fakeinbox.com', 'sharklasers.com', 'yopmail.com',
  'dispostable.com', 'maildrop.cc', 'spamgourmet.com', 'trashmail.at',
  'getairmail.com', 'discard.email', 'mailnull.com',
];

const LETTERS_ONLY = /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s-]+$/;

interface ClientModalProps {
  client?: ClientFormData;
  onClose: () => void;
  onSave: (data: ClientFormData) => void;
  existingPhones?: string[];
}

const ClientModal = ({ client, onClose, onSave, existingPhones = [] }: ClientModalProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(client?.profilePhoto ?? null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState<ClientFormData>(
    client ?? {
      profilePhoto: '',
      firstName: '',
      lastName: '',
      phone: '',
      phoneCountryCode: 'MX',
      email: '',
      street: '',
      exteriorNumber: '',
      interiorNumber: '',
      neighborhood: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      reference: ''
    }
  );

  const [errors, setErrors] = useState<Partial<Record<keyof ClientFormData, string>>>({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ClientFormData, string>> = {};

    // Nombre
    if (!formData.firstName.trim()) {
      newErrors.firstName = t('clients.modal.errors.firstNameRequired');
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = t('clients.modal.errors.firstNameShort');
    } else if (!LETTERS_ONLY.test(formData.firstName.trim())) {
      newErrors.firstName = t('clients.modal.errors.firstNameLetters');
    }

    // Apellido
    if (!formData.lastName.trim()) {
      newErrors.lastName = t('clients.modal.errors.lastNameRequired');
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = t('clients.modal.errors.lastNameShort');
    } else if (!LETTERS_ONLY.test(formData.lastName.trim())) {
      newErrors.lastName = t('clients.modal.errors.lastNameLetters');
    }

    // Teléfono
    if (!formData.phone.trim()) {
      newErrors.phone = t('clients.modal.errors.phoneRequired');
    } else if (!isValidPhone(formData.phone, formData.phoneCountryCode)) {
      newErrors.phone = t('clients.modal.errors.phoneInvalid');
    } else if (existingPhones.includes(formData.phone)) {
      newErrors.phone = t('clients.modal.errors.phoneDuplicate');
    }

    // Correo
    if (formData.email && formData.email.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = t('clients.modal.errors.emailInvalid');
      } else {
        const domain = formData.email.split('@')[1]?.toLowerCase();
        if (domain && DISPOSABLE_DOMAINS.includes(domain)) {
          newErrors.email = t('clients.modal.errors.emailFake');
        }
      }
    }

    // Calle
    if (!formData.street.trim()) {
      newErrors.street = t('clients.modal.errors.streetRequired');
    } else if (formData.street.trim().length < 3) {
      newErrors.street = t('clients.modal.errors.streetShort');
    }

    // Número exterior
    if (!formData.exteriorNumber.trim()) {
      newErrors.exteriorNumber = t('clients.modal.errors.exteriorNumberRequired');
    } else if (!/\d/.test(formData.exteriorNumber)) {
      newErrors.exteriorNumber = t('clients.modal.errors.exteriorNumberInvalid');
    }

    // Colonia
    if (!formData.neighborhood.trim()) {
      newErrors.neighborhood = t('clients.modal.errors.colonyRequired');
    } else if (formData.neighborhood.trim().length < 3) {
      newErrors.neighborhood = t('clients.modal.errors.colonyShort');
    }

    // Ciudad
    if (!formData.city.trim()) {
      newErrors.city = t('clients.modal.errors.cityRequired');
    } else if (formData.city.trim().length < 3) {
      newErrors.city = t('clients.modal.errors.cityShort');
    }

    // Código postal
    if (!formData.postalCode.trim()) {
      newErrors.postalCode = t('clients.modal.errors.postalRequired');
    } else if (!/^\d{5}$/.test(formData.postalCode.trim())) {
      newErrors.postalCode = t('clients.modal.errors.postalInvalid');
    }

    // Referencia
    if (!formData.reference?.trim()) {
      newErrors.reference = t('clients.modal.errors.referenceRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!validate() || !user) return;

    let finalData = { ...formData };

    if (imageFile) {
      setIsUploading(true);
      try {
        const imageUrl = await uploadClientImage(imageFile, user.uid);
        finalData = { ...finalData, profilePhoto: imageUrl };
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

    onSave({
      ...finalData,
      street: finalData.street?.toUpperCase(),
      exteriorNumber: finalData.exteriorNumber?.toUpperCase(),
      interiorNumber: finalData.interiorNumber?.toUpperCase(),
      neighborhood: finalData.neighborhood?.toUpperCase(),
      city: finalData.city?.toUpperCase(),
      state: finalData.state?.toUpperCase(),
      postalCode: finalData.postalCode?.toUpperCase(),
      country: finalData.country?.toUpperCase(),
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name as keyof ClientFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handlePhoneChange = (
    field: 'phone',
    codeField: 'phoneCountryCode'
  ) =>
    (number: string, iso: string) => {
      setFormData((prev) => ({ ...prev, [field]: number, [codeField]: iso }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };

  const handleImageClick = () => {
    fileInputRef.current?.click();
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
    setImageFile(new File([blob], 'client.jpg', { type: 'image/jpeg' }));
    setPreviewImage(url);
    setCropSrc(null);
  };

  const removeImage = () => {
    setPreviewImage(null);
    setImageFile(null);
    setCropSrc(null);
    setFormData((prev) => ({ ...prev, profilePhoto: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--large" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>{client ? t('clients.modal.editTitle') : t('clients.modal.newTitle')}</h2>
          <button className="modal__close" onClick={onClose}>
            <PiXBold size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal__body">
          {/* Foto de perfil */}
          <div className="form-section">
            <h3 className="form-section__title">{t('clients.modal.photo')}</h3>
            <div className="form-avatar">
              <div className="form-avatar__preview" onClick={handleImageClick}>
                {previewImage ? (
                  <img src={previewImage} alt="Preview" />
                ) : (
                  <div className="form-avatar__placeholder">
                    <PiUserBold size={24} />
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
              <div className="form-avatar__info">
                <span className="form-avatar__hint">
                  {previewImage ? t('clients.modal.photoHintChange') : t('clients.modal.photoHintAdd')}
                </span>
                {previewImage && (
                  <button type="button" className="btn btn--sm btn--danger" onClick={removeImage}>
                    {t('clients.modal.photoRemove')}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Información personal */}
          <div className="form-section">
            <h3 className="form-section__title">{t('clients.modal.personalInfo')}</h3>
            <div className="form-grid form-grid--2">
              <div className="form-group">
                <label htmlFor="firstName">{t('clients.modal.firstName')}</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`input ${errors.firstName ? 'input--error' : ''}`}
                  placeholder={t('clients.modal.firstNamePlaceholder')}
                  maxLength={40}
                />
                {errors.firstName && <span className="form-error">{errors.firstName}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="lastName">{t('clients.modal.lastName')}</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`input ${errors.lastName ? 'input--error' : ''}`}
                  placeholder={t('clients.modal.lastNamePlaceholder')}
                  maxLength={40}
                />
                {errors.lastName && <span className="form-error">{errors.lastName}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="phone">{t('clients.modal.phone')}</label>
                <PhoneInput
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  countryCode={formData.phoneCountryCode ?? 'MX'}
                  onChange={handlePhoneChange('phone', 'phoneCountryCode')}
                  hasError={!!errors.phone}
                  placeholder={t('auth.register.phonePlaceholder')}
                />
                {errors.phone && <span className="form-error">{errors.phone}</span>}
              </div>


              <div className="form-group">
                <label htmlFor="email">{t('clients.modal.email')}</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                  className={`input ${errors.email ? 'input--error' : ''}`}
                  placeholder="correo@ejemplo.com"
                  maxLength={100}
                />
                {errors.email && <span className="form-error">{errors.email}</span>}
              </div>
            </div>
          </div>

          {/* Dirección */}
          <div className="form-section">
            <h3 className="form-section__title">{t('clients.modal.deliveryAddress')}</h3>
            <div className="form-grid form-grid--2">
              <div className="form-group">
                <label htmlFor="country">{t('clients.modal.country')}</label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={formData.country || ''}
                  onChange={handleChange}
                  className="input"
                  placeholder={t('clients.modal.countryPlaceholder')}
                  maxLength={40}
                />
              </div>

              <div className="form-group">
                <label htmlFor="state">{t('clients.modal.state')}</label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state || ''}
                  onChange={handleChange}
                  className="input"
                  placeholder={t('clients.modal.statePlaceholder')}
                  maxLength={60}
                />
              </div>

              <div className="form-group">
                <label htmlFor="city">{t('clients.modal.city')}</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className={`input ${errors.city ? 'input--error' : ''}`}
                  placeholder={t('clients.modal.cityPlaceholder')}
                  maxLength={60}
                />
                {errors.city && <span className="form-error">{errors.city}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="neighborhood">{t('clients.modal.colony')}</label>
                <input
                  type="text"
                  id="neighborhood"
                  name="neighborhood"
                  value={formData.neighborhood}
                  onChange={handleChange}
                  className={`input ${errors.neighborhood ? 'input--error' : ''}`}
                  placeholder={t('clients.modal.colonyPlaceholder')}
                  maxLength={60}
                />
                {errors.neighborhood && <span className="form-error">{errors.neighborhood}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="street">{t('clients.modal.street')}</label>
                <input
                  type="text"
                  id="street"
                  name="street"
                  value={formData.street}
                  onChange={handleChange}
                  className={`input ${errors.street ? 'input--error' : ''}`}
                  placeholder={t('clients.modal.streetPlaceholder')}
                  maxLength={80}
                />
                {errors.street && <span className="form-error">{errors.street}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="exteriorNumber">{t('clients.modal.exteriorNumber')}</label>
                <input
                  type="text"
                  id="exteriorNumber"
                  name="exteriorNumber"
                  value={formData.exteriorNumber}
                  onChange={handleChange}
                  className={`input ${errors.exteriorNumber ? 'input--error' : ''}`}
                  placeholder={t('clients.modal.exteriorNumberPlaceholder')}
                  maxLength={10}
                />
                {errors.exteriorNumber && <span className="form-error">{errors.exteriorNumber}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="interiorNumber">{t('clients.modal.interiorNumber')}</label>
                <input
                  type="text"
                  id="interiorNumber"
                  name="interiorNumber"
                  value={formData.interiorNumber || ''}
                  onChange={handleChange}
                  className="input"
                  placeholder={t('clients.modal.interiorNumberPlaceholder')}
                  maxLength={20}
                />
              </div>

              <div className="form-group">
                <label htmlFor="postalCode">{t('clients.modal.postal')}</label>
                <input
                  type="text"
                  id="postalCode"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  className={`input ${errors.postalCode ? 'input--error' : ''}`}
                  placeholder={t('clients.modal.postalPlaceholder')}
                  maxLength={5}
                />
                {errors.postalCode && <span className="form-error">{errors.postalCode}</span>}
              </div>

              <div className="form-group form-group--full">
                <label htmlFor="reference">{t('clients.modal.reference')}</label>
                <textarea
                  id="reference"
                  name="reference"
                  value={formData.reference || ''}
                  onChange={handleChange}
                  className={`input ${errors.reference ? 'input--error' : ''}`}
                  placeholder={t('clients.modal.referencePlaceholder')}
                  rows={2}
                  maxLength={140}
                  style={{ resize: 'none' }}
                />
                <span className="form-char-count">{(formData.reference || '').length}/140</span>
                {errors.reference && <span className="form-error">{errors.reference}</span>}
              </div>
            </div>
          </div>

          <div className="modal__actions">
            <button type="button" className="btn btn--secondary" onClick={onClose} disabled={isUploading}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn btn--primary" disabled={isUploading}>
              {isUploading ? t('clients.modal.uploadingImage') : client ? t('clients.modal.submitEdit') : t('clients.modal.submitNew')}
            </button>
          </div>
        </form>
      </div>
    </div>
    {cropSrc && (
      <ImageCropper
        imageSrc={cropSrc}
        onConfirm={handleCropConfirm}
        onCancel={() => setCropSrc(null)}
      />
    )}
    </>
  );
};

export default ClientModal;
