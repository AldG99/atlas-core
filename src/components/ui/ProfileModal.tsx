import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { PiXBold, PiCameraBold, PiTrashBold } from 'react-icons/pi';
import { useAuth } from '../../hooks/useAuth';
import './ProfileModal.scss';

interface ProfileModalProps {
  onClose: () => void;
}

const ProfileModal = ({ onClose }: ProfileModalProps) => {
  const { t } = useTranslation();
  const { user, updateProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(user?.profilePhoto || null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    businessName: user?.businessName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    street: user?.street || '',
    exteriorNumber: user?.exteriorNumber || '',
    interiorNumber: user?.interiorNumber || '',
    neighborhood: user?.neighborhood || '',
    city: user?.city || '',
    state: user?.state || '',
    postalCode: user?.postalCode || '',
    country: user?.country || '',
    reference: user?.reference || ''
  });

  const getInitials = (name: string | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageClick = () => {
    if (isEditing) {
      fileInputRef.current?.click();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setPreviewImage(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        businessName: formData.businessName,
        phone: formData.phone,
        street: formData.street,
        exteriorNumber: formData.exteriorNumber,
        interiorNumber: formData.interiorNumber,
        neighborhood: formData.neighborhood,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        country: formData.country,
        reference: formData.reference
      }, imageFile);
      setIsEditing(false);
      setImageFile(null);
    } catch (error) {
      console.error('Error al guardar perfil:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      businessName: user?.businessName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      street: user?.street || '',
      exteriorNumber: user?.exteriorNumber || '',
      interiorNumber: user?.interiorNumber || '',
      neighborhood: user?.neighborhood || '',
      city: user?.city || '',
      state: user?.state || '',
      postalCode: user?.postalCode || '',
      country: user?.country || '',
      reference: user?.reference || ''
    });
    setPreviewImage(user?.profilePhoto || null);
    setImageFile(null);
    setIsEditing(false);
  };

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal__header">
          <h2>{t('profile.profileModal')}</h2>
          <button className="profile-modal__close" onClick={onClose}>
            <PiXBold size={20} />
          </button>
        </div>

        <div className="profile-modal__content">
          <div className="profile-modal__avatar-section">
            <div
              className={`profile-modal__avatar ${isEditing ? 'profile-modal__avatar--editable' : ''}`}
              onClick={handleImageClick}
            >
              {previewImage ? (
                <img src={previewImage} alt={t('profile.profilePhoto')} />
              ) : (
                getInitials(user?.businessName)
              )}
              {isEditing && (
                <div className="profile-modal__avatar-overlay">
                  <PiCameraBold size={20} />
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
              <button
                type="button"
                className="profile-modal__remove-photo"
                onClick={removeImage}
              >
                <PiTrashBold size={16} />
                <span>{t('profile.removePhoto')}</span>
              </button>
            )}
          </div>

          <div className="profile-modal__form">
            <div className="profile-modal__field">
              <label>{t('profile.businessName')}</label>
              {isEditing ? (
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  className="input"
                />
              ) : (
                <p>{user?.businessName || '—'}</p>
              )}
            </div>

            <div className="profile-modal__field">
              <label>{t('profile.email')}</label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input"
                />
              ) : (
                <p>{user?.email || '—'}</p>
              )}
            </div>

            <div className="profile-modal__field">
              <label>{t('profile.phone')}</label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input"
                />
              ) : (
                <p>{user?.phone || '—'}</p>
              )}
            </div>

          </div>

          <div className="form-section">
            <h3 className="form-section__title">{t('clients.modal.deliveryAddress')}</h3>
            {isEditing ? (
              <div className="form-grid form-grid--2">
                <div className="form-group">
                  <label htmlFor="country">{t('clients.modal.country')}</label>
                  <input
                    type="text" id="country" name="country"
                    value={formData.country} onChange={handleChange}
                    className="input" placeholder={t('clients.modal.countryPlaceholder')} maxLength={40}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="state">{t('clients.modal.state')}</label>
                  <input
                    type="text" id="state" name="state"
                    value={formData.state} onChange={handleChange}
                    className="input" placeholder={t('clients.modal.statePlaceholder')} maxLength={60}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="city">{t('clients.modal.city')}</label>
                  <input
                    type="text" id="city" name="city"
                    value={formData.city} onChange={handleChange}
                    className="input" placeholder={t('clients.modal.cityPlaceholder')} maxLength={60}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="neighborhood">{t('clients.modal.colony')}</label>
                  <input
                    type="text" id="neighborhood" name="neighborhood"
                    value={formData.neighborhood} onChange={handleChange}
                    className="input" placeholder={t('clients.modal.colonyPlaceholder')} maxLength={60}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="street">{t('clients.modal.street')}</label>
                  <input
                    type="text" id="street" name="street"
                    value={formData.street} onChange={handleChange}
                    className="input" placeholder={t('clients.modal.streetPlaceholder')} maxLength={80}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="exteriorNumber">{t('clients.modal.exteriorNumber')}</label>
                  <input
                    type="text" id="exteriorNumber" name="exteriorNumber"
                    value={formData.exteriorNumber} onChange={handleChange}
                    className="input" placeholder={t('clients.modal.exteriorNumberPlaceholder')} maxLength={10}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="interiorNumber">{t('clients.modal.interiorNumber')}</label>
                  <input
                    type="text" id="interiorNumber" name="interiorNumber"
                    value={formData.interiorNumber} onChange={handleChange}
                    className="input" placeholder={t('clients.modal.interiorNumberPlaceholder')} maxLength={20}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="postalCode">{t('clients.modal.postal')}</label>
                  <input
                    type="text" id="postalCode" name="postalCode"
                    value={formData.postalCode} onChange={handleChange}
                    className="input" placeholder={t('clients.modal.postalPlaceholder')} maxLength={5}
                  />
                </div>
                <div className="form-group form-group--full">
                  <label htmlFor="reference">{t('clients.modal.reference')}</label>
                  <textarea
                    id="reference" name="reference"
                    value={formData.reference} onChange={handleChange}
                    className="input" placeholder={t('clients.modal.referencePlaceholder')}
                    rows={2} maxLength={140} style={{ resize: 'none' }}
                  />
                  <span className="form-char-count">{formData.reference.length}/140</span>
                </div>
              </div>
            ) : (
              <p>
                {user?.street
                  ? `${user.street} ${user.exteriorNumber ?? ''}${user.interiorNumber ? ` int. ${user.interiorNumber}` : ''}, ${user.neighborhood ?? ''}, ${user.city ?? ''}${user.state ? `, ${user.state}` : ''}${user.postalCode ? `, ${user.postalCode}` : ''}${user.country ? `, ${user.country}` : ''}`
                  : '—'}
              </p>
            )}
          </div>
        </div>

        <div className="profile-modal__footer">
          {isEditing ? (
            <>
              <button
                className="btn btn--secondary"
                onClick={handleCancel}
                disabled={isSaving}
              >
                {t('common.cancel')}
              </button>
              <button
                className="btn btn--primary"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? t('common.saving') : t('profile.saveChanges')}
              </button>
            </>
          ) : (
            <button className="btn btn--primary" onClick={() => setIsEditing(true)}>
              {t('profile.editProfile')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
