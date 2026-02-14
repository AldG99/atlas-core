import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PiArrowLeftBold,
  PiPencilBold,
  PiTrashBold,
  PiPackageBold,
  PiCalendarBold,
  PiTextAlignLeftBold,
  PiCameraBold
} from 'react-icons/pi';
import type { Producto, ProductoFormData } from '../types/Producto';
import { getProductoById, deleteProducto, updateProducto } from '../services/productoService';
import { useEtiquetas } from '../hooks/useEtiquetas';
import { useToast } from '../hooks/useToast';
import { ROUTES } from '../config/routes';
import { ETIQUETA_ICONS } from '../constants/etiquetaIcons';
import MainLayout from '../layouts/MainLayout';
import './ProductoDetail.scss';

const ProductoDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { etiquetas } = useEtiquetas();

  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<ProductoFormData | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editData) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditData({ ...editData, imagen: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchProducto = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await getProductoById(id);
      if (!data) {
        showToast('Producto no encontrado', 'error');
        navigate(ROUTES.PRODUCTOS);
        return;
      }
      setProducto(data);
    } catch {
      showToast('Error al cargar el producto', 'error');
      navigate(ROUTES.PRODUCTOS);
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showToast]);

  useEffect(() => {
    fetchProducto();
  }, [fetchProducto]);

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(new Date(date));

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

  const getEtiquetasForProducto = (p: Producto) => {
    return (p.etiquetas || [])
      .map(id => etiquetas.find(e => e.id === id))
      .filter((e): e is NonNullable<typeof e> => !!e);
  };

  const handleDelete = async () => {
    if (!producto) return;
    if (!window.confirm('¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.')) return;
    try {
      await deleteProducto(producto.id);
      showToast('Producto eliminado', 'success');
      navigate(ROUTES.PRODUCTOS);
    } catch {
      showToast('Error al eliminar el producto', 'error');
    }
  };

  const startEditing = () => {
    if (!producto) return;
    setEditData({
      clave: producto.clave,
      nombre: producto.nombre,
      precio: producto.precio,
      descripcion: producto.descripcion,
      imagen: producto.imagen,
      etiquetas: producto.etiquetas,
      descuento: producto.descuento || 0,
      fechaFinDescuento: producto.fechaFinDescuento
        ? `${new Date(producto.fechaFinDescuento).getFullYear()}-${String(new Date(producto.fechaFinDescuento).getMonth() + 1).padStart(2, '0')}-${String(new Date(producto.fechaFinDescuento).getDate()).padStart(2, '0')}`
        : ''
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditData(null);
  };

  const handleSave = async () => {
    if (!producto || !editData) return;
    try {
      setSaving(true);
      const dataToSave = { ...editData };
      if (!dataToSave.descuento || dataToSave.descuento <= 0) {
        dataToSave.descuento = 0;
        dataToSave.fechaFinDescuento = '';
      }
      await updateProducto(producto.id, dataToSave);
      setProducto({
        ...producto,
        ...dataToSave,
        fechaFinDescuento: dataToSave.fechaFinDescuento
          ? new Date(dataToSave.fechaFinDescuento + 'T00:00:00')
          : undefined
      });
      setIsEditing(false);
      setEditData(null);
      showToast('Producto actualizado correctamente', 'success');
    } catch {
      showToast('Error al actualizar el producto', 'error');
    } finally {
      setSaving(false);
    }
  };

  const isDescuentoActivo = (p: Producto): boolean => {
    if (!p.descuento || p.descuento <= 0) return false;
    if (!p.fechaFinDescuento) return false;
    return new Date(p.fechaFinDescuento) >= new Date(new Date().toDateString());
  };

  const getPrecioConDescuento = (precio: number, descuento: number): number => {
    return precio * (1 - descuento / 100);
  };

  const updateField = (field: keyof ProductoFormData, value: string | number | string[]) => {
    if (!editData) return;
    setEditData({ ...editData, [field]: value });
  };

  const MAX_ETIQUETAS = 4;

  const toggleEtiqueta = (etiquetaId: string) => {
    if (!editData) return;
    const current = editData.etiquetas || [];
    if (current.includes(etiquetaId)) {
      setEditData({ ...editData, etiquetas: current.filter(id => id !== etiquetaId) });
    } else if (current.length < MAX_ETIQUETAS) {
      setEditData({ ...editData, etiquetas: [...current, etiquetaId] });
    }
  };

  const limiteAlcanzado = isEditing && (editData?.etiquetas || []).length >= MAX_ETIQUETAS;

  if (loading) {
    return (
      <MainLayout>
        <div className="producto-detail">
          <p className="producto-detail__loading">Cargando producto...</p>
        </div>
      </MainLayout>
    );
  }

  if (!producto) return null;

  const productoEtiquetas = getEtiquetasForProducto(producto);

  return (
    <MainLayout>
      <div className="producto-detail">
        {/* Fixed Top Bar */}
        <div className="producto-detail__top-bar">
          <div className="producto-detail__top-bar-inner">
            <button
              className="producto-detail__icon-btn producto-detail__icon-btn--back"
              onClick={() => navigate(ROUTES.PRODUCTOS)}
              title="Volver"
            >
              <PiArrowLeftBold size={20} />
            </button>
            {isEditing ? (
              <div className="producto-detail__top-bar-actions">
                <button
                  onClick={cancelEditing}
                  className="btn btn--outline btn--sm"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="btn btn--primary btn--sm"
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            ) : (
              <>
                <span className="producto-detail__top-divider" />
                <button
                  onClick={startEditing}
                  className="producto-detail__icon-btn producto-detail__icon-btn--primary"
                  title="Editar producto"
                >
                  <PiPencilBold size={20} />
                </button>
                <button
                  onClick={handleDelete}
                  className="producto-detail__icon-btn producto-detail__icon-btn--danger"
                  title="Eliminar producto"
                >
                  <PiTrashBold size={20} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="producto-detail__content">
          {/* Hero: Image + Info */}
          <div className="producto-detail__hero">
            {/* Image Section */}
            <div
              className={`producto-detail__image-section ${isEditing ? 'producto-detail__image-section--editable' : ''}`}
              onClick={() => isEditing && fileInputRef.current?.click()}
            >
              {(isEditing ? editData?.imagen : producto.imagen) ? (
                <img src={(isEditing ? editData?.imagen : producto.imagen) || ''} alt={producto.nombre} />
              ) : (
                <div className="producto-detail__image-placeholder">
                  <PiPackageBold size={64} />
                  <span>Sin imagen</span>
                </div>
              )}
              {isEditing && (
                <div className="producto-detail__image-overlay">
                  <PiCameraBold size={32} />
                  <span>Cambiar imagen</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
            </div>

            {/* Info Side */}
            <div className="producto-detail__hero-info">
              <div className="producto-detail__title-section">
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={editData?.clave || ''}
                      onChange={(e) => updateField('clave', e.target.value)}
                      placeholder="Clave"
                      className="producto-detail__input producto-detail__input--clave"
                    />
                    <input
                      type="text"
                      value={editData?.nombre || ''}
                      onChange={(e) => updateField('nombre', e.target.value)}
                      placeholder="Nombre del producto"
                      className="producto-detail__input producto-detail__input--name"
                    />
                  </>
                ) : (
                  <>
                    <span className="producto-detail__clave">{producto.clave}</span>
                    <h1 className="producto-detail__name">{producto.nombre}</h1>
                  </>
                )}
              </div>
              <div className="producto-detail__price">
                {isEditing ? (
                  <div className="producto-detail__price-edit">
                    <input
                      type="number"
                      value={editData?.precio || 0}
                      onChange={(e) => updateField('precio', parseFloat(e.target.value) || 0)}
                      placeholder="Precio"
                      className="producto-detail__input producto-detail__input--price"
                      step="0.01"
                      min="0"
                    />
                    <div className="producto-detail__price-edit-discount">
                      <div className="producto-detail__price-edit-row">
                        <div className="producto-detail__descuento-input-wrapper">
                          <input
                            type="number"
                            value={editData?.descuento || ''}
                            onChange={(e) => {
                              const val = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
                              updateField('descuento', val);
                            }}
                            placeholder="0"
                            className="producto-detail__input producto-detail__input--discount"
                            min="0"
                            max="100"
                            step="1"
                          />
                          <span className="producto-detail__descuento-percent">%</span>
                        </div>
                        <input
                          type="date"
                          value={editData?.fechaFinDescuento as string || ''}
                          onChange={(e) => updateField('fechaFinDescuento', e.target.value)}
                          className="producto-detail__input producto-detail__input--date"
                        />
                      </div>
                      {editData?.descuento && editData.descuento > 0 && (
                        <div className="producto-detail__price-edit-preview">
                          <span className="producto-detail__price-original">
                            {formatCurrency(editData?.precio || producto.precio)}
                          </span>
                          <span className="producto-detail__price-final">
                            {formatCurrency(getPrecioConDescuento(editData?.precio || producto.precio, editData.descuento))}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : isDescuentoActivo(producto) ? (
                  <div className="producto-detail__price-discount">
                    <span className="producto-detail__price-badge">-{producto.descuento}%</span>
                    <span className="producto-detail__price-original">{formatCurrency(producto.precio)}</span>
                    <span className="producto-detail__price-final">
                      {formatCurrency(getPrecioConDescuento(producto.precio, producto.descuento!))}
                    </span>
                    {producto.fechaFinDescuento && (
                      <span className="producto-detail__price-expiry">
                        <PiCalendarBold size={12} />
                        Hasta {formatDate(producto.fechaFinDescuento)}
                      </span>
                    )}
                  </div>
                ) : (
                  formatCurrency(producto.precio)
                )}
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="producto-detail__section">
            <div className="producto-detail__section-header">
              <strong>Información</strong>
            </div>
            <div className="producto-detail__info-grid">
              <div className="producto-detail__info-item">
                <div className="producto-detail__info-icon">
                  <PiCalendarBold size={18} />
                </div>
                <div className="producto-detail__info-content">
                  <span className="producto-detail__info-label">Fecha de registro</span>
                  <span className="producto-detail__info-value">{formatDate(producto.fechaCreacion)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Etiquetas Section */}
          {(isEditing || productoEtiquetas.length > 0) && (
            <div className="producto-detail__section">
              <div className="producto-detail__section-header">
                <strong>Etiquetas</strong>
                {limiteAlcanzado && (
                  <span className="producto-detail__etiquetas-limite">Máximo {MAX_ETIQUETAS}</span>
                )}
              </div>
              <div className="producto-detail__etiquetas">
                {isEditing ? (
                  etiquetas.map(et => {
                    const iconData = ETIQUETA_ICONS[et.icono];
                    const Icon = iconData?.icon;
                    const isSelected = editData?.etiquetas?.includes(et.id);
                    const isDisabled = !isSelected && limiteAlcanzado;
                    return (
                      <span
                        key={et.id}
                        className={`producto-detail__etiqueta producto-detail__etiqueta--selectable ${isSelected ? '' : 'producto-detail__etiqueta--unselected'} ${isDisabled ? 'producto-detail__etiqueta--disabled' : ''}`}
                        style={{ backgroundColor: isSelected ? et.color : undefined }}
                        onClick={() => !isDisabled && toggleEtiqueta(et.id)}
                      >
                        {Icon && <Icon size={14} />}
                        <span>{et.nombre}</span>
                      </span>
                    );
                  })
                ) : (
                  productoEtiquetas.map(et => {
                    const iconData = ETIQUETA_ICONS[et.icono];
                    const Icon = iconData?.icon;
                    return (
                      <span
                        key={et.id}
                        className="producto-detail__etiqueta"
                        style={{ backgroundColor: et.color }}
                      >
                        {Icon && <Icon size={14} />}
                        <span>{et.nombre}</span>
                      </span>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Description Section */}
          <div className="producto-detail__section">
            <div className="producto-detail__section-header">
              <strong>Descripción</strong>
            </div>
            {isEditing ? (
              <textarea
                value={editData?.descripcion || ''}
                onChange={(e) => updateField('descripcion', e.target.value)}
                placeholder="Descripción del producto..."
                className="producto-detail__textarea"
                rows={4}
              />
            ) : (
              <div className="producto-detail__description-box">
                <div className="producto-detail__info-icon">
                  <PiTextAlignLeftBold size={18} />
                </div>
                <p className="producto-detail__description">
                  {producto.descripcion || 'Sin descripción'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

    </MainLayout>
  );
};

export default ProductoDetail;
