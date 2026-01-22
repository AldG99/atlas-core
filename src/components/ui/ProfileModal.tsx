import { useState, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import './ProfileModal.scss';

interface ProfileModalProps {
  onClose: () => void;
}

const IconX = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const IconCamera = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
    <circle cx="12" cy="13" r="4"></circle>
  </svg>
);

const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const ProfileModal = ({ onClose }: ProfileModalProps) => {
  const { user, updateProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(user?.fotoPerfil || null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    nombreNegocio: user?.nombreNegocio || '',
    email: user?.email || '',
    telefono: user?.telefono || '',
    direccion: user?.direccion || ''
  });

  const getInitials = (name: string | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        nombreNegocio: formData.nombreNegocio,
        telefono: formData.telefono,
        direccion: formData.direccion
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
      nombreNegocio: user?.nombreNegocio || '',
      email: user?.email || '',
      telefono: user?.telefono || '',
      direccion: user?.direccion || ''
    });
    setPreviewImage(user?.fotoPerfil || null);
    setImageFile(null);
    setIsEditing(false);
  };

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal__header">
          <h2>Mi Perfil</h2>
          <button className="profile-modal__close" onClick={onClose}>
            <IconX />
          </button>
        </div>

        <div className="profile-modal__content">
          <div className="profile-modal__avatar-section">
            <div
              className={`profile-modal__avatar ${isEditing ? 'profile-modal__avatar--editable' : ''}`}
              onClick={handleImageClick}
            >
              {previewImage ? (
                <img src={previewImage} alt="Foto de perfil" />
              ) : (
                getInitials(user?.nombreNegocio)
              )}
              {isEditing && (
                <div className="profile-modal__avatar-overlay">
                  <IconCamera />
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
                <IconTrash />
                <span>Eliminar foto</span>
              </button>
            )}
          </div>

          <div className="profile-modal__form">
            <div className="profile-modal__field">
              <label>Nombre del negocio</label>
              {isEditing ? (
                <input
                  type="text"
                  name="nombreNegocio"
                  value={formData.nombreNegocio}
                  onChange={handleChange}
                  className="input"
                />
              ) : (
                <p>{user?.nombreNegocio || '—'}</p>
              )}
            </div>

            <div className="profile-modal__field">
              <label>Correo electrónico</label>
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
              <label>Teléfono</label>
              {isEditing ? (
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="input"
                />
              ) : (
                <p>{user?.telefono || '—'}</p>
              )}
            </div>

            <div className="profile-modal__field">
              <label>Dirección</label>
              {isEditing ? (
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  className="input"
                />
              ) : (
                <p>{user?.direccion || '—'}</p>
              )}
            </div>
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
                Cancelar
              </button>
              <button
                className="btn btn--primary"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </>
          ) : (
            <button className="btn btn--primary" onClick={() => setIsEditing(true)}>
              Editar perfil
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
