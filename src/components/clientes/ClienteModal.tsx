import { useState, useEffect, useRef } from 'react';
import type { ClienteFormData } from '../../types/Cliente';
import { uploadClienteImage } from '../../services/clienteService';
import { useAuth } from '../../hooks/useAuth';
import './ClienteModal.scss';

interface ClienteModalProps {
  cliente?: ClienteFormData;
  onClose: () => void;
  onSave: (data: ClienteFormData) => void;
}

const HORARIOS_ENTREGA = [
  '09:00 - 12:00',
  '12:00 - 15:00',
  '15:00 - 18:00',
  '18:00 - 21:00',
  'Cualquier horario'
];

const ClienteModal = ({ cliente, onClose, onSave }: ClienteModalProps) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState<ClienteFormData>({
    fotoPerfil: '',
    nombre: '',
    apellido: '',
    telefono: '',
    telefonoSecundario: '',
    correo: '',
    calle: '',
    numeroExterior: '',
    numeroInterior: '',
    colonia: '',
    ciudad: '',
    codigoPostal: '',
    referencia: '',
    numeroVisible: true,
    horarioEntrega: '',
    notas: ''
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ClienteFormData, string>>>({});

  useEffect(() => {
    if (cliente) {
      setFormData(cliente);
      if (cliente.fotoPerfil) {
        setPreviewImage(cliente.fotoPerfil);
      }
    }
  }, [cliente]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ClienteFormData, string>> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }
    if (!formData.apellido.trim()) {
      newErrors.apellido = 'El apellido es requerido';
    }
    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es requerido';
    }
    if (!formData.calle.trim()) {
      newErrors.calle = 'La calle es requerida';
    }
    if (!formData.numeroExterior.trim()) {
      newErrors.numeroExterior = 'El número exterior es requerido';
    }
    if (!formData.colonia.trim()) {
      newErrors.colonia = 'La colonia es requerida';
    }
    if (!formData.ciudad.trim()) {
      newErrors.ciudad = 'La ciudad es requerida';
    }
    if (!formData.codigoPostal.trim()) {
      newErrors.codigoPostal = 'El código postal es requerido';
    }
    if (formData.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo)) {
      newErrors.correo = 'El correo no es válido';
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

    onSave(finalData);
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
          <h2>{cliente ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
          <button className="modal__close" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal__body">
          {/* Foto de perfil */}
          <div className="form-section">
            <h3 className="form-section__title">Foto de perfil</h3>
            <div className="form-avatar">
              <div className="form-avatar__preview" onClick={handleImageClick}>
                {previewImage ? (
                  <img src={previewImage} alt="Preview" />
                ) : (
                  <div className="form-avatar__placeholder">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span>Agregar foto</span>
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
              {previewImage && (
                <button type="button" className="btn btn--sm btn--danger" onClick={removeImage}>
                  Eliminar foto
                </button>
              )}
            </div>
          </div>

          {/* Información personal */}
          <div className="form-section">
            <h3 className="form-section__title">Información personal</h3>
            <div className="form-grid form-grid--2">
              <div className="form-group">
                <label htmlFor="nombre">Nombre *</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className={`input ${errors.nombre ? 'input--error' : ''}`}
                  placeholder="Nombre"
                />
                {errors.nombre && <span className="form-error">{errors.nombre}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="apellido">Apellido *</label>
                <input
                  type="text"
                  id="apellido"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  className={`input ${errors.apellido ? 'input--error' : ''}`}
                  placeholder="Apellido"
                />
                {errors.apellido && <span className="form-error">{errors.apellido}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="telefono">Teléfono *</label>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className={`input ${errors.telefono ? 'input--error' : ''}`}
                  placeholder="Número de teléfono"
                />
                {errors.telefono && <span className="form-error">{errors.telefono}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="telefonoSecundario">Teléfono secundario</label>
                <input
                  type="tel"
                  id="telefonoSecundario"
                  name="telefonoSecundario"
                  value={formData.telefonoSecundario || ''}
                  onChange={handleChange}
                  className="input"
                  placeholder="Número alternativo (opcional)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="correo">Correo electrónico</label>
                <input
                  type="email"
                  id="correo"
                  name="correo"
                  value={formData.correo || ''}
                  onChange={handleChange}
                  className={`input ${errors.correo ? 'input--error' : ''}`}
                  placeholder="correo@ejemplo.com"
                />
                {errors.correo && <span className="form-error">{errors.correo}</span>}
              </div>
            </div>
          </div>

          {/* Dirección */}
          <div className="form-section">
            <h3 className="form-section__title">Dirección de entrega</h3>
            <div className="form-grid form-grid--2">
              <div className="form-group">
                <label htmlFor="calle">Calle *</label>
                <input
                  type="text"
                  id="calle"
                  name="calle"
                  value={formData.calle}
                  onChange={handleChange}
                  className={`input ${errors.calle ? 'input--error' : ''}`}
                  placeholder="Nombre de la calle"
                />
                {errors.calle && <span className="form-error">{errors.calle}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="numeroExterior">Número exterior *</label>
                <input
                  type="text"
                  id="numeroExterior"
                  name="numeroExterior"
                  value={formData.numeroExterior}
                  onChange={handleChange}
                  className={`input ${errors.numeroExterior ? 'input--error' : ''}`}
                  placeholder="Ej: 123"
                />
                {errors.numeroExterior && <span className="form-error">{errors.numeroExterior}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="numeroInterior">Número interior</label>
                <input
                  type="text"
                  id="numeroInterior"
                  name="numeroInterior"
                  value={formData.numeroInterior || ''}
                  onChange={handleChange}
                  className="input"
                  placeholder="Ej: Depto 4 (opcional)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="colonia">Colonia *</label>
                <input
                  type="text"
                  id="colonia"
                  name="colonia"
                  value={formData.colonia}
                  onChange={handleChange}
                  className={`input ${errors.colonia ? 'input--error' : ''}`}
                  placeholder="Nombre de la colonia"
                />
                {errors.colonia && <span className="form-error">{errors.colonia}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="ciudad">Ciudad *</label>
                <input
                  type="text"
                  id="ciudad"
                  name="ciudad"
                  value={formData.ciudad}
                  onChange={handleChange}
                  className={`input ${errors.ciudad ? 'input--error' : ''}`}
                  placeholder="Ciudad"
                />
                {errors.ciudad && <span className="form-error">{errors.ciudad}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="codigoPostal">Código postal *</label>
                <input
                  type="text"
                  id="codigoPostal"
                  name="codigoPostal"
                  value={formData.codigoPostal}
                  onChange={handleChange}
                  className={`input ${errors.codigoPostal ? 'input--error' : ''}`}
                  placeholder="Ej: 12345"
                  maxLength={5}
                />
                {errors.codigoPostal && <span className="form-error">{errors.codigoPostal}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="referencia">Referencia del domicilio</label>
              <textarea
                id="referencia"
                name="referencia"
                value={formData.referencia || ''}
                onChange={handleChange}
                className="input"
                placeholder="Ej: Casa color azul, entre calle X y calle Y"
                rows={2}
              />
            </div>
          </div>

          {/* Información de entrega */}
          <div className="form-section">
            <h3 className="form-section__title">Información de entrega</h3>
            <div className="form-grid form-grid--2">
              <div className="form-group">
                <label>¿El número es visible desde la calle?</label>
                <div className="form-radio-group">
                  <label className="form-radio">
                    <input
                      type="radio"
                      name="numeroVisible"
                      checked={formData.numeroVisible === true}
                      onChange={() => setFormData(prev => ({ ...prev, numeroVisible: true }))}
                    />
                    <span>Sí</span>
                  </label>
                  <label className="form-radio">
                    <input
                      type="radio"
                      name="numeroVisible"
                      checked={formData.numeroVisible === false}
                      onChange={() => setFormData(prev => ({ ...prev, numeroVisible: false }))}
                    />
                    <span>No</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="horarioEntrega">Horario de entrega preferido</label>
                <select
                  id="horarioEntrega"
                  name="horarioEntrega"
                  value={formData.horarioEntrega || ''}
                  onChange={handleChange}
                  className="select"
                >
                  <option value="">Seleccionar horario</option>
                  {HORARIOS_ENTREGA.map((horario) => (
                    <option key={horario} value={horario}>
                      {horario}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Notas adicionales */}
          <div className="form-section">
            <h3 className="form-section__title">Notas adicionales</h3>
            <div className="form-group">
              <textarea
                id="notas"
                name="notas"
                value={formData.notas || ''}
                onChange={handleChange}
                className="input"
                placeholder="Información adicional sobre el cliente..."
                rows={3}
              />
            </div>
          </div>

          <div className="modal__actions">
            <button type="button" className="btn btn--secondary" onClick={onClose} disabled={isUploading}>
              Cancelar
            </button>
            <button type="submit" className="btn btn--primary" disabled={isUploading}>
              {isUploading ? 'Subiendo imagen...' : cliente ? 'Guardar cambios' : 'Agregar cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClienteModal;
