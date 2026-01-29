import { useState, useEffect, useRef } from 'react';
import { PiXBold, PiImageBold } from 'react-icons/pi';
import type { ProductoFormData } from '../../types/Producto';
import { uploadProductoImage } from '../../services/productoService';
import { useAuth } from '../../hooks/useAuth';
import './ProductoModal.scss';

interface ProductoModalProps {
  producto?: ProductoFormData;
  onClose: () => void;
  onSave: (data: ProductoFormData) => void;
}

const ProductoModal = ({ producto, onClose, onSave }: ProductoModalProps) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState<ProductoFormData>({
    clave: '',
    nombre: '',
    precio: 0,
    descripcion: '',
    imagen: '',
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof ProductoFormData, string>>
  >({});

  useEffect(() => {
    if (producto) {
      setFormData(producto);
      if (producto.imagen) {
        setPreviewImage(producto.imagen);
      }
    }
  }, [producto]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ProductoFormData, string>> = {};

    if (!formData.clave.trim()) {
      newErrors.clave = 'La clave es requerida';
    }
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }
    if (formData.precio <= 0) {
      newErrors.precio = 'El precio debe ser mayor a 0';
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
        const imageUrl = await uploadProductoImage(imageFile, user.uid);
        finalData = { ...finalData, imagen: imageUrl };
      } catch (error) {
        console.error('Error al subir imagen:', error);
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    onSave(finalData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (errors[name as keyof ProductoFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
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
    setFormData(prev => ({ ...prev, imagen: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h2>{producto ? 'Editar Producto' : 'Nuevo Producto'}</h2>
          <button className="modal__close" onClick={onClose}>
            <PiXBold size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal__body">
          <div className="producto-image-section">
            <label>Imagen del producto (opcional)</label>
            <div className="producto-image-upload">
              <div
                className="producto-image-preview"
                onClick={handleImageClick}
              >
                {previewImage ? (
                  <img src={previewImage} alt="Preview" />
                ) : (
                  <div className="producto-image-placeholder">
                    <PiImageBold size={32} />
                    <span>Agregar imagen</span>
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
                <button
                  type="button"
                  className="btn btn--sm btn--danger"
                  onClick={removeImage}
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="clave">Clave del producto *</label>
            <input
              type="text"
              id="clave"
              name="clave"
              value={formData.clave}
              onChange={handleChange}
              className={`input ${errors.clave ? 'input--error' : ''}`}
              placeholder="Ej: PAST-001"
            />
            {errors.clave && <span className="form-error">{errors.clave}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="nombre">Nombre del producto *</label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className={`input ${errors.nombre ? 'input--error' : ''}`}
              placeholder="Ej: Pastel de chocolate"
            />
            {errors.nombre && (
              <span className="form-error">{errors.nombre}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="precio">Precio *</label>
            <div className="input-currency">
              <span className="input-currency__symbol">$</span>
              <input
                type="number"
                id="precio"
                name="precio"
                value={formData.precio || ''}
                onChange={handleChange}
                className={`input ${errors.precio ? 'input--error' : ''}`}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            {errors.precio && (
              <span className="form-error">{errors.precio}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="descripcion">Descripción (opcional)</label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion || ''}
              onChange={handleChange}
              className="input"
              placeholder="Describe el producto..."
              rows={3}
            />
          </div>

          <div className="modal__actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={onClose}
              disabled={isUploading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={isUploading}
            >
              {isUploading
                ? 'Subiendo imagen...'
                : producto
                  ? 'Guardar cambios'
                  : 'Agregar producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductoModal;
