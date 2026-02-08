import { useState, useEffect, useRef } from 'react';
import { PiXBold, PiImageBold, PiPlusBold, PiTrashBold } from 'react-icons/pi';
import type { ProductoFormData, Etiqueta } from '../../types/Producto';
import { uploadProductoImage } from '../../services/productoService';
import { useAuth } from '../../hooks/useAuth';
import { useEtiquetas } from '../../hooks/useEtiquetas';
import { ETIQUETA_ICONS, ETIQUETA_COLORES } from '../../constants/etiquetaIcons';
import './ProductoModal.scss';

interface ProductoModalProps {
  producto?: ProductoFormData;
  onClose: () => void;
  onSave: (data: ProductoFormData) => void;
}

const ProductoModal = ({ producto, onClose, onSave }: ProductoModalProps) => {
  const { user } = useAuth();
  const { etiquetas: todasEtiquetas, addEtiqueta, removeEtiqueta } = useEtiquetas();
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
    etiquetas: [],
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof ProductoFormData, string>>
  >({});

  const [showNewEtiqueta, setShowNewEtiqueta] = useState(false);
  const [nuevaEtiquetaNombre, setNuevaEtiquetaNombre] = useState('');
  const [nuevaEtiquetaColor, setNuevaEtiquetaColor] = useState(ETIQUETA_COLORES[0]);
  const [nuevaEtiquetaIcono, setNuevaEtiquetaIcono] = useState('star');

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

  const etiquetasAsignadas = (formData.etiquetas || [])
    .map(id => todasEtiquetas.find(e => e.id === id))
    .filter((e): e is Etiqueta => !!e);

  const etiquetasDisponibles = todasEtiquetas.filter(
    e => !(formData.etiquetas || []).includes(e.id)
  );

  const MAX_ETIQUETAS = 4;

  const limiteAlcanzado = (formData.etiquetas || []).length >= MAX_ETIQUETAS;

  const toggleEtiqueta = (id: string) => {
    setFormData(prev => {
      const current = prev.etiquetas || [];
      if (current.includes(id)) {
        return { ...prev, etiquetas: current.filter(eid => eid !== id) };
      }
      if (current.length >= MAX_ETIQUETAS) {
        return prev;
      }
      return { ...prev, etiquetas: [...current, id] };
    });
  };

  const handleDeleteEtiqueta = async (id: string) => {
    await removeEtiqueta(id);
    setFormData(prev => ({
      ...prev,
      etiquetas: (prev.etiquetas || []).filter(eid => eid !== id),
    }));
  };

  const handleCrearEtiqueta = async () => {
    const nombre = nuevaEtiquetaNombre.trim() || ETIQUETA_ICONS[nuevaEtiquetaIcono]?.label || nuevaEtiquetaIcono;
    const nueva = await addEtiqueta(
      nombre,
      nuevaEtiquetaColor,
      nuevaEtiquetaIcono
    );
    if (nueva && (formData.etiquetas || []).length < MAX_ETIQUETAS) {
      setFormData(prev => ({
        ...prev,
        etiquetas: [...(prev.etiquetas || []), nueva.id],
      }));
    }
    setNuevaEtiquetaNombre('');
    setNuevaEtiquetaColor(ETIQUETA_COLORES[0]);
    setNuevaEtiquetaIcono('star');
    setShowNewEtiqueta(false);
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

          <div className="form-group etiquetas-section">
            <label>Etiquetas</label>

            {etiquetasAsignadas.length > 0 && (
              <div className="etiquetas-chips">
                {etiquetasAsignadas.map(et => (
                  <div key={et.id} className="etiqueta-chip-wrapper">
                    <span
                      className="etiqueta-chip etiqueta-chip--removable"
                      style={{ backgroundColor: et.color }}
                      title={et.nombre}
                    >
                      {ETIQUETA_ICONS[et.icono] && (() => {
                        const Icon = ETIQUETA_ICONS[et.icono].icon;
                        return <Icon size={12} />;
                      })()}
                      <button
                        type="button"
                        className="etiqueta-chip__remove"
                        onClick={() => toggleEtiqueta(et.id)}
                      >
                        <PiXBold size={10} />
                      </button>
                    </span>
                    <button
                      type="button"
                      className="etiqueta-chip__delete"
                      onClick={() => handleDeleteEtiqueta(et.id)}
                      title="Eliminar etiqueta"
                    >
                      <PiTrashBold size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {limiteAlcanzado ? (
              <span className="etiquetas-limite">Máximo {MAX_ETIQUETAS} etiquetas</span>
            ) : (
              <>
                {etiquetasDisponibles.length > 0 && (
                  <div className="etiquetas-disponibles">
                    {etiquetasDisponibles.map(et => {
                      const iconData = ETIQUETA_ICONS[et.icono];
                      const Icon = iconData?.icon;
                      return (
                        <div key={et.id} className="etiqueta-chip-wrapper">
                          <button
                            type="button"
                            className="etiqueta-option"
                            onClick={() => toggleEtiqueta(et.id)}
                            title={et.nombre}
                          >
                            <span
                              className="etiqueta-option__icon"
                              style={{ color: et.color }}
                            >
                              {Icon && <Icon size={14} />}
                            </span>
                          </button>
                          <button
                            type="button"
                            className="etiqueta-chip__delete"
                            onClick={() => handleDeleteEtiqueta(et.id)}
                            title="Eliminar etiqueta"
                          >
                            <PiTrashBold size={10} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {!showNewEtiqueta ? (
                  <button
                    type="button"
                    className="etiqueta-add-btn"
                    onClick={() => setShowNewEtiqueta(true)}
                  >
                    <PiPlusBold size={14} />
                    Nueva etiqueta
                  </button>
                ) : (
                  <div className="etiqueta-new-form">
                    <div className="etiqueta-picker-row">
                      <span className="etiqueta-picker-label">Nombre</span>
                      <input
                        type="text"
                        className="input etiqueta-nombre-input"
                        placeholder="Ej: Vegano, Sin gluten..."
                        value={nuevaEtiquetaNombre}
                        onChange={(e) => setNuevaEtiquetaNombre(e.target.value)}
                      />
                    </div>

                    <div className="etiqueta-picker-row">
                      <span className="etiqueta-picker-label">Icono</span>
                      <div className="etiqueta-icon-picker">
                        {Object.entries(ETIQUETA_ICONS).map(([key, { icon: Icon, label }]) => (
                          <button
                            key={key}
                            type="button"
                            className={`etiqueta-icon-swatch ${nuevaEtiquetaIcono === key ? 'etiqueta-icon-swatch--active' : ''}`}
                            style={{ color: nuevaEtiquetaColor }}
                            onClick={() => setNuevaEtiquetaIcono(key)}
                            title={label}
                          >
                            <Icon size={16} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="etiqueta-picker-row">
                      <span className="etiqueta-picker-label">Color</span>
                      <div className="etiqueta-color-picker">
                        {ETIQUETA_COLORES.map(color => (
                          <button
                            key={color}
                            type="button"
                            className={`etiqueta-color-swatch ${nuevaEtiquetaColor === color ? 'etiqueta-color-swatch--active' : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => setNuevaEtiquetaColor(color)}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="etiqueta-new-preview">
                      {(() => {
                        const Icon = ETIQUETA_ICONS[nuevaEtiquetaIcono]?.icon;
                        const previewName = nuevaEtiquetaNombre.trim() || ETIQUETA_ICONS[nuevaEtiquetaIcono]?.label;
                        return (
                          <span
                            className="etiqueta-chip"
                            style={{ backgroundColor: nuevaEtiquetaColor }}
                            title="Vista previa"
                          >
                            {Icon && <Icon size={12} />}
                            <span className="etiqueta-chip__label">{previewName}</span>
                          </span>
                        );
                      })()}
                    </div>

                    <div className="etiqueta-new-form__actions">
                      <button
                        type="button"
                        className="btn btn--sm btn--secondary"
                        onClick={() => {
                          setShowNewEtiqueta(false);
                          setNuevaEtiquetaNombre('');
                        }}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="btn btn--sm btn--primary"
                        onClick={handleCrearEtiqueta}
                      >
                        Crear
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
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
