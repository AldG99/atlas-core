import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PiArrowLeftBold,
  PiPencilBold,
  PiTrashBold,
  PiPackageBold,
  PiCalendarBold,
  PiCameraBold,
  PiWarehouseBold
} from 'react-icons/pi';
import type { Producto, ProductoFormData } from '../types/Producto';
import { getProductoById, deleteProducto, updateProducto } from '../services/productoService';
import type { CancelDescuentoInfo } from '../services/productoService';
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
        ? new Date(producto.fechaFinDescuento).toISOString().split('T')[0]
        : '',
      controlStock: producto.controlStock ?? false,
      stock: producto.stock ?? 0,
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

      let cancelledDescuento: CancelDescuentoInfo | undefined;
      const hadDescuento = producto.descuento && producto.descuento > 0 && producto.fechaFinDescuento;
      const removingDescuento = !dataToSave.descuento || dataToSave.descuento <= 0;

      if (hadDescuento && removingDescuento) {
        cancelledDescuento = {
          porcentaje: producto.descuento!,
          fechaFin: producto.fechaFinDescuento!
        };
      }

      if (removingDescuento) {
        dataToSave.descuento = 0;
        dataToSave.fechaFinDescuento = '';
      }

      await updateProducto(producto.id, dataToSave, cancelledDescuento);

      if (cancelledDescuento) {
        await fetchProducto();
      } else {
        setProducto({
          ...producto,
          ...dataToSave,
          fechaFinDescuento: dataToSave.fechaFinDescuento
            ? new Date(dataToSave.fechaFinDescuento + 'T00:00:00')
            : undefined
        });
      }
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
          <div className="producto-detail__card">

            {/* Header: Image + Info */}
            <div className="producto-detail__header">
              {/* Image Section */}
              <div
                className={`producto-detail__image-section ${isEditing ? 'producto-detail__image-section--editable' : ''}`}
                onClick={() => isEditing && fileInputRef.current?.click()}
              >
                {(isEditing ? editData?.imagen : producto.imagen) ? (
                  <img src={(isEditing ? editData?.imagen : producto.imagen) || ''} alt={producto.nombre} />
                ) : (
                  <div className="producto-detail__image-placeholder">
                    <PiPackageBold size={48} />
                    <span>Sin imagen</span>
                  </div>
                )}
                {isEditing && (
                  <div className="producto-detail__image-overlay">
                    <PiCameraBold size={28} />
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
              <div className="producto-detail__header-info">
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
                          {editData?.descuento && editData.descuento > 0 && (
                            <button
                              type="button"
                              className="producto-detail__cancel-descuento"
                              onClick={() => {
                                if (!editData) return;
                                setEditData({ ...editData, descuento: 0, fechaFinDescuento: '' });
                              }}
                            >
                              Cancelar descuento
                            </button>
                          )}
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
                          Hasta {formatDate(producto.fechaFinDescuento)}
                        </span>
                      )}
                    </div>
                  ) : (
                    formatCurrency(producto.precio)
                  )}
                </div>

                {/* Etiquetas */}
                <div className="producto-detail__header-etiquetas">
                  <div className="producto-detail__header-etiquetas-row">
                    {isEditing ? (
                      <>
                        {etiquetas.map(et => {
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
                              title={et.nombre}
                            >
                              {Icon && <Icon size={12} />}
                            </span>
                          );
                        })}
                        {limiteAlcanzado && (
                          <span className="producto-detail__etiquetas-limite">Máx. {MAX_ETIQUETAS}</span>
                        )}
                      </>
                    ) : productoEtiquetas.length > 0 ? (
                      productoEtiquetas.map(et => {
                        const iconData = ETIQUETA_ICONS[et.icono];
                        const Icon = iconData?.icon;
                        return (
                          <span
                            key={et.id}
                            className="producto-detail__etiqueta"
                            style={{ backgroundColor: et.color }}
                            title={et.nombre}
                          >
                            {Icon && <Icon size={12} />}
                          </span>
                        );
                      })
                    ) : (
                      <span className="producto-detail__etiquetas-empty">Sin etiquetas</span>
                    )}
                  </div>
                </div>

                {/* Almacén */}
                {isEditing ? (
                  <div className="producto-detail__stock-edit">
                    <label className="producto-detail__stock-toggle">
                      <input
                        type="checkbox"
                        checked={!!editData?.controlStock}
                        onChange={(e) => {
                          if (!editData) return;
                          setEditData({
                            ...editData,
                            controlStock: e.target.checked,
                            stock: e.target.checked ? (editData.stock ?? 0) : 0,
                          });
                        }}
                      />
                      <PiWarehouseBold size={15} />
                      <span>Gestionar existencias</span>
                    </label>
                    <div className="producto-detail__stock-input-row">
                      <span className="producto-detail__info-label">Unidades en almacén</span>
                      <input
                        type="number"
                        value={editData?.stock ?? 0}
                        onChange={(e) => {
                          if (!editData) return;
                          setEditData({ ...editData, stock: Math.max(0, parseInt(e.target.value) || 0) });
                        }}
                        className="producto-detail__input producto-detail__input--stock"
                        min="0"
                        step="1"
                        disabled={!editData?.controlStock}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="producto-detail__stock-display">
                    <PiWarehouseBold size={15} className="producto-detail__header-meta-icon" />
                    {producto.controlStock ? (
                      <span className={`producto-detail__stock-badge ${(producto.stock ?? 0) === 0 ? 'producto-detail__stock-badge--empty' : ''}`}>
                        {(producto.stock ?? 0) === 0 ? 'Sin existencias' : `${producto.stock} unidades`}
                      </span>
                    ) : (
                      <span className="producto-detail__stock-untracked">
                        Sin control de inventario
                      </span>
                    )}
                  </div>
                )}

                <div className="producto-detail__header-meta">
                  <PiCalendarBold size={14} className="producto-detail__header-meta-icon" />
                  <span className="producto-detail__info-label">Cliente desde</span>
                  <span className="producto-detail__info-value">{formatDate(producto.fechaCreacion)}</span>
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="producto-detail__section producto-detail__section--grow">
              <div className="producto-detail__section-header">
                <strong>Descripción</strong>
              </div>
              {isEditing ? (
                <>
                  <textarea
                    value={editData?.descripcion || ''}
                    onChange={(e) => updateField('descripcion', e.target.value)}
                    placeholder="Descripción del producto..."
                    className="producto-detail__textarea"
                    maxLength={240}
                  />
                  <span className="producto-detail__char-count">
                    {(editData?.descripcion || '').length}/240
                  </span>
                </>
              ) : (
                <p className={`producto-detail__description ${!producto.descripcion ? 'producto-detail__description--empty' : ''}`}>
                  {producto.descripcion || 'Sin descripción'}
                </p>
              )}
            </div>

          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProductoDetail;
