import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { PiXBold, PiUserBold } from 'react-icons/pi';
import type { ClienteFormData } from '../../types/Cliente';
import { uploadClienteImage } from '../../services/clienteService';
import { useAuth } from '../../hooks/useAuth';
import PhoneInput from './PhoneInput';
import './ClienteModal.scss';

const DOMINIOS_DESECHABLES = [
  'mailinator.com', 'tempmail.com', 'guerrillamail.com', 'throwam.com',
  'trashmail.com', 'fakeinbox.com', 'sharklasers.com', 'yopmail.com',
  'dispostable.com', 'maildrop.cc', 'spamgourmet.com', 'trashmail.at',
  'getairmail.com', 'discard.email', 'mailnull.com',
];

const SOLO_LETRAS = /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s-]+$/;

const esTelefonoFicticio = (tel: string): boolean => {
  // Todos los dígitos iguales: 0000000000, 5555555555
  if (/^(\d)\1+$/.test(tel)) return true;

  // Secuencia ascendente o descendente estricta
  let esAscendente = true;
  let esDescendente = true;
  for (let i = 1; i < tel.length; i++) {
    if (parseInt(tel[i]) - parseInt(tel[i - 1]) !== 1) esAscendente = false;
    if (parseInt(tel[i - 1]) - parseInt(tel[i]) !== 1) esDescendente = false;
  }
  if (esAscendente || esDescendente) return true;

  return false;
};

interface ClienteModalProps {
  cliente?: ClienteFormData;
  onClose: () => void;
  onSave: (data: ClienteFormData) => void;
  telefonosExistentes?: string[];
}

const ClienteModal = ({ cliente, onClose, onSave, telefonosExistentes = [] }: ClienteModalProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(cliente?.fotoPerfil ?? null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState<ClienteFormData>(
    cliente ?? {
      fotoPerfil: '',
      nombre: '',
      apellido: '',
      telefono: '',
      telefonoCodigoPais: 'MX',
      correo: '',
      calle: '',
      numeroExterior: '',
      numeroInterior: '',
      colonia: '',
      ciudad: '',
      codigoPostal: '',
      pais: '',
      referencia: ''
    }
  );

  const [errors, setErrors] = useState<Partial<Record<keyof ClienteFormData, string>>>({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ClienteFormData, string>> = {};

    // Nombre
    if (!formData.nombre.trim()) {
      newErrors.nombre = t('clients.modal.errors.firstNameRequired');
    } else if (formData.nombre.trim().length < 2) {
      newErrors.nombre = t('clients.modal.errors.firstNameShort');
    } else if (!SOLO_LETRAS.test(formData.nombre.trim())) {
      newErrors.nombre = t('clients.modal.errors.firstNameLetters');
    }

    // Apellido
    if (!formData.apellido.trim()) {
      newErrors.apellido = t('clients.modal.errors.lastNameRequired');
    } else if (formData.apellido.trim().length < 2) {
      newErrors.apellido = t('clients.modal.errors.lastNameShort');
    } else if (!SOLO_LETRAS.test(formData.apellido.trim())) {
      newErrors.apellido = t('clients.modal.errors.lastNameLetters');
    }

    // Teléfono
    if (!formData.telefono.trim()) {
      newErrors.telefono = t('clients.modal.errors.phoneRequired');
    } else if (esTelefonoFicticio(formData.telefono)) {
      newErrors.telefono = t('clients.modal.errors.phoneInvalid');
    } else if (telefonosExistentes.includes(formData.telefono)) {
      newErrors.telefono = t('clients.modal.errors.phoneDuplicate');
    }

    // Correo
    if (formData.correo && formData.correo.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo)) {
        newErrors.correo = t('clients.modal.errors.emailInvalid');
      } else {
        const dominio = formData.correo.split('@')[1]?.toLowerCase();
        if (dominio && DOMINIOS_DESECHABLES.includes(dominio)) {
          newErrors.correo = t('clients.modal.errors.emailFake');
        }
      }
    }

    // Calle
    if (!formData.calle.trim()) {
      newErrors.calle = t('clients.modal.errors.streetRequired');
    } else if (formData.calle.trim().length < 3) {
      newErrors.calle = t('clients.modal.errors.streetShort');
    }

    // Número exterior
    if (!formData.numeroExterior.trim()) {
      newErrors.numeroExterior = t('clients.modal.errors.exteriorNumberRequired');
    } else if (!/\d/.test(formData.numeroExterior)) {
      newErrors.numeroExterior = t('clients.modal.errors.exteriorNumberInvalid');
    }

    // Colonia
    if (!formData.colonia.trim()) {
      newErrors.colonia = t('clients.modal.errors.colonyRequired');
    } else if (formData.colonia.trim().length < 3) {
      newErrors.colonia = t('clients.modal.errors.colonyShort');
    }

    // Ciudad
    if (!formData.ciudad.trim()) {
      newErrors.ciudad = t('clients.modal.errors.cityRequired');
    } else if (formData.ciudad.trim().length < 3) {
      newErrors.ciudad = t('clients.modal.errors.cityShort');
    }

    // Código postal
    if (!formData.codigoPostal.trim()) {
      newErrors.codigoPostal = t('clients.modal.errors.postalRequired');
    } else if (!/^\d{5}$/.test(formData.codigoPostal.trim())) {
      newErrors.codigoPostal = t('clients.modal.errors.postalInvalid');
    }

    // Referencia
    if (!formData.referencia?.trim()) {
      newErrors.referencia = t('clients.modal.errors.referenceRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !user) return;

    let finalData = { ...formData };

    if (imageFile) {
      setIsUploading(true);
      try {
        const imageUrl = await uploadClienteImage(imageFile, user.uid);
        finalData = { ...finalData, fotoPerfil: imageUrl };
      } catch (error) {
        console.error('Error al subir imagen:', error);
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    onSave({
      ...finalData,
      calle: finalData.calle?.toUpperCase(),
      numeroExterior: finalData.numeroExterior?.toUpperCase(),
      numeroInterior: finalData.numeroInterior?.toUpperCase(),
      colonia: finalData.colonia?.toUpperCase(),
      ciudad: finalData.ciudad?.toUpperCase(),
      codigoPostal: finalData.codigoPostal?.toUpperCase(),
      pais: finalData.pais?.toUpperCase(),
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

    if (errors[name as keyof ClienteFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handlePhoneChange = (
    field: 'telefono',
    codigoField: 'telefonoCodigoPais'
  ) =>
    (numero: string, iso: string) => {
      setFormData((prev) => ({ ...prev, [field]: numero, [codigoField]: iso }));
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
    setFormData((prev) => ({ ...prev, fotoPerfil: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--large" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>{cliente ? t('clients.modal.editTitle') : t('clients.modal.newTitle')}</h2>
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
                <label htmlFor="nombre">{t('clients.modal.firstName')}</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className={`input ${errors.nombre ? 'input--error' : ''}`}
                  placeholder={t('clients.modal.firstNamePlaceholder')}
                  maxLength={40}
                />
                {errors.nombre && <span className="form-error">{errors.nombre}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="apellido">{t('clients.modal.lastName')}</label>
                <input
                  type="text"
                  id="apellido"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  className={`input ${errors.apellido ? 'input--error' : ''}`}
                  placeholder={t('clients.modal.lastNamePlaceholder')}
                  maxLength={40}
                />
                {errors.apellido && <span className="form-error">{errors.apellido}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="telefono">{t('clients.modal.phone')}</label>
                <PhoneInput
                  id="telefono"
                  name="telefono"
                  value={formData.telefono}
                  codigoPais={formData.telefonoCodigoPais ?? 'MX'}
                  onChange={handlePhoneChange('telefono', 'telefonoCodigoPais')}
                  hasError={!!errors.telefono}
                  placeholder={t('auth.register.phonePlaceholder')}
                />
                {errors.telefono && <span className="form-error">{errors.telefono}</span>}
              </div>


              <div className="form-group">
                <label htmlFor="correo">{t('clients.modal.email')}</label>
                <input
                  type="email"
                  id="correo"
                  name="correo"
                  value={formData.correo || ''}
                  onChange={handleChange}
                  className={`input ${errors.correo ? 'input--error' : ''}`}
                  placeholder="correo@ejemplo.com"
                  maxLength={100}
                />
                {errors.correo && <span className="form-error">{errors.correo}</span>}
              </div>
            </div>
          </div>

          {/* Dirección */}
          <div className="form-section">
            <h3 className="form-section__title">{t('clients.modal.deliveryAddress')}</h3>
            <div className="form-grid form-grid--2">
              <div className="form-group">
                <label htmlFor="pais">{t('clients.modal.country')}</label>
                <input
                  type="text"
                  id="pais"
                  name="pais"
                  value={formData.pais || ''}
                  onChange={handleChange}
                  className="input"
                  placeholder={t('clients.modal.countryPlaceholder')}
                  maxLength={40}
                />
              </div>

              <div className="form-group">
                <label htmlFor="ciudad">{t('clients.modal.city')}</label>
                <input
                  type="text"
                  id="ciudad"
                  name="ciudad"
                  value={formData.ciudad}
                  onChange={handleChange}
                  className={`input ${errors.ciudad ? 'input--error' : ''}`}
                  placeholder={t('clients.modal.cityPlaceholder')}
                  maxLength={60}
                />
                {errors.ciudad && <span className="form-error">{errors.ciudad}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="colonia">{t('clients.modal.colony')}</label>
                <input
                  type="text"
                  id="colonia"
                  name="colonia"
                  value={formData.colonia}
                  onChange={handleChange}
                  className={`input ${errors.colonia ? 'input--error' : ''}`}
                  placeholder={t('clients.modal.colonyPlaceholder')}
                  maxLength={60}
                />
                {errors.colonia && <span className="form-error">{errors.colonia}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="calle">{t('clients.modal.street')}</label>
                <input
                  type="text"
                  id="calle"
                  name="calle"
                  value={formData.calle}
                  onChange={handleChange}
                  className={`input ${errors.calle ? 'input--error' : ''}`}
                  placeholder={t('clients.modal.streetPlaceholder')}
                  maxLength={80}
                />
                {errors.calle && <span className="form-error">{errors.calle}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="numeroExterior">{t('clients.modal.exteriorNumber')}</label>
                <input
                  type="text"
                  id="numeroExterior"
                  name="numeroExterior"
                  value={formData.numeroExterior}
                  onChange={handleChange}
                  className={`input ${errors.numeroExterior ? 'input--error' : ''}`}
                  placeholder={t('clients.modal.exteriorNumberPlaceholder')}
                  maxLength={10}
                />
                {errors.numeroExterior && <span className="form-error">{errors.numeroExterior}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="numeroInterior">{t('clients.modal.interiorNumber')}</label>
                <input
                  type="text"
                  id="numeroInterior"
                  name="numeroInterior"
                  value={formData.numeroInterior || ''}
                  onChange={handleChange}
                  className="input"
                  placeholder={t('clients.modal.interiorNumberPlaceholder')}
                  maxLength={20}
                />
              </div>

              <div className="form-group">
                <label htmlFor="codigoPostal">{t('clients.modal.postal')}</label>
                <input
                  type="text"
                  id="codigoPostal"
                  name="codigoPostal"
                  value={formData.codigoPostal}
                  onChange={handleChange}
                  className={`input ${errors.codigoPostal ? 'input--error' : ''}`}
                  placeholder={t('clients.modal.postalPlaceholder')}
                  maxLength={5}
                />
                {errors.codigoPostal && <span className="form-error">{errors.codigoPostal}</span>}
              </div>

              <div className="form-group form-group--full">
                <label htmlFor="referencia">{t('clients.modal.reference')}</label>
                <textarea
                  id="referencia"
                  name="referencia"
                  value={formData.referencia || ''}
                  onChange={handleChange}
                  className={`input ${errors.referencia ? 'input--error' : ''}`}
                  placeholder={t('clients.modal.referencePlaceholder')}
                  rows={2}
                  maxLength={80}
                  style={{ resize: 'none' }}
                />
                <span className="form-char-count">{(formData.referencia || '').length}/80</span>
                {errors.referencia && <span className="form-error">{errors.referencia}</span>}
              </div>
            </div>
          </div>

          <div className="modal__actions">
            <button type="button" className="btn btn--secondary" onClick={onClose} disabled={isUploading}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn btn--primary" disabled={isUploading}>
              {isUploading ? t('clients.modal.uploadingImage') : cliente ? t('clients.modal.submitEdit') : t('clients.modal.submitNew')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClienteModal;
