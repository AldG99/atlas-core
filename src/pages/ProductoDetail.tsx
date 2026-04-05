import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  PiArrowLeftBold,
  PiPencilBold,
  PiTrashBold,
  PiPackageBold,
  PiCalendarBold,
  PiCameraBold,
  PiXBold,
} from 'react-icons/pi';
import type { Producto, ProductoFormData } from '../types/Producto';
import { getProductoById, deleteProducto, updateProducto, uploadProductoImage } from '../services/productoService';
import type { CancelDescuentoInfo } from '../services/productoService';
import { useEtiquetas } from '../hooks/useEtiquetas';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useCurrency } from '../hooks/useCurrency';
import { ROUTES } from '../config/routes';
import { ETIQUETA_ICONS } from '../constants/etiquetaIcons';
import { compressImage } from '../utils/imageUtils';
import ProductImage from '../components/ui/ProductImage';
import MainLayout from '../layouts/MainLayout';
import './ProductoDetail.scss';

const ProductoDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, role } = useAuth();
  const { showToast } = useToast();
  const { etiquetas } = useEtiquetas();
  const { format } = useCurrency();

  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteCode, setDeleteCode] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<ProductoFormData | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedImageFile = useRef<File | null>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editData) {
      try {
        const compressed = await compressImage(file, 600, 0.8);
        selectedImageFile.current = compressed;
        const reader = new FileReader();
        reader.onloadend = () => {
          setEditData({ ...editData, imagen: reader.result as string });
        };
        reader.readAsDataURL(compressed);
      } catch {
        selectedImageFile.current = file;
        const reader = new FileReader();
        reader.onloadend = () => {
          setEditData({ ...editData, imagen: reader.result as string });
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const fetchProducto = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await getProductoById(id);
      if (!data) {
        showToast(t('products.detail.notFound'), 'error');
        navigate(ROUTES.PRODUCTOS);
        return;
      }
      setProducto(data);
    } catch {
      showToast(t('products.detail.loadError'), 'error');
      navigate(ROUTES.PRODUCTOS);
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showToast]);

  useEffect(() => {
    fetchProducto();
  }, [fetchProducto]);

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat(i18n.language, {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(new Date(date));

  const getEtiquetasForProducto = (p: Producto) => {
    return (p.etiquetas || [])
      .map(id => etiquetas.find(e => e.id === id))
      .filter((e): e is NonNullable<typeof e> => !!e);
  };

  const generateDeleteCode = () =>
    Array.from({ length: 10 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');

  const handleDelete = () => {
    if (!producto) return;
    setDeleteConfirmText('');
    setDeleteCode(generateDeleteCode());
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!producto) return;
    if (deleteConfirmText !== deleteCode) return;
    setShowDeleteModal(false);
    try {
      await deleteProducto(producto.id);
      showToast(t('products.detail.deleteSuccess'), 'success');
      navigate(ROUTES.PRODUCTOS);
    } catch {
      showToast(t('products.detail.deleteError'), 'error');
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
      unidad: producto.unidad ?? '',
      unidadCantidad: producto.unidadCantidad ?? 1,
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditData(null);
    selectedImageFile.current = null;
  };

  const handleSave = async () => {
    if (!producto || !editData || !user) return;
    try {
      setSaving(true);
      const dataToSave = { ...editData };

      // Si el usuario seleccionó una nueva imagen, subirla a Storage primero
      if (selectedImageFile.current) {
        const url = await uploadProductoImage(selectedImageFile.current, user.uid);
        dataToSave.imagen = url;
        selectedImageFile.current = null;
      }

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
      showToast(t('products.detail.updateSuccess'), 'success');
    } catch {
      showToast(t('products.detail.updateError'), 'error');
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
          <p className="producto-detail__loading">{t('products.detail.loading')}</p>
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
              title={t('products.detail.back')}
            >
              <PiArrowLeftBold size={20} />
            </button>
            {role === 'admin' && (
              isEditing ? (
                <div className="producto-detail__top-bar-actions">
                  <button
                    onClick={cancelEditing}
                    className="btn btn--outline btn--sm"
                    disabled={saving}
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleSave}
                    className="btn btn--primary btn--sm"
                    disabled={saving}
                  >
                    {saving ? t('common.saving') : t('common.save')}
                  </button>
                </div>
              ) : (
                <>
                  <span className="producto-detail__top-divider" />
                  <button
                    onClick={startEditing}
                    className="producto-detail__icon-btn producto-detail__icon-btn--primary"
                    title={t('products.detail.editProduct')}
                  >
                    <PiPencilBold size={20} />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="producto-detail__icon-btn producto-detail__icon-btn--danger"
                    title={t('products.detail.deleteProduct')}
                  >
                    <PiTrashBold size={20} />
                  </button>
                </>
              )
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
                <ProductImage
                  src={isEditing ? editData?.imagen : producto.imagen}
                  alt={producto.nombre}
                  placeholderClassName="producto-detail__image-placeholder"
                />
                {isEditing && (
                  <div className="producto-detail__image-overlay">
                    <PiCameraBold size={28} />
                    <span>{t('products.detail.changeImage')}</span>
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
                        placeholder={t('products.detail.codePlaceholder')}
                        className="producto-detail__input producto-detail__input--clave"
                      />
                      <input
                        type="text"
                        value={editData?.nombre || ''}
                        onChange={(e) => updateField('nombre', e.target.value)}
                        placeholder={t('products.detail.namePlaceholder')}
                        className="producto-detail__input producto-detail__input--name"
                      />
                      <div className="producto-detail__unidad-edit">
                        <label className="producto-detail__stock-toggle">
                          <input
                            type="checkbox"
                            checked={!!editData?.unidad}
                            onChange={(e) => {
                              if (!editData) return;
                              setEditData({ ...editData, unidad: e.target.checked ? 'kg' : '' });
                            }}
                          />
                          <span>{t('products.detail.specifyUnit')}</span>
                          <input
                            type="number"
                            value={editData?.unidadCantidad ?? 1}
                            onChange={(e) => {
                              if (!editData) return;
                              setEditData({ ...editData, unidadCantidad: Math.max(0, parseFloat(e.target.value) || 0) });
                            }}
                            className="producto-detail__input producto-detail__input--unidad-cantidad"
                            min="0"
                            step="0.1"
                            disabled={!editData?.unidad}
                          />
                          <select
                            value={editData?.unidad || 'kg'}
                            onChange={(e) => {
                              if (!editData) return;
                              setEditData({ ...editData, unidad: e.target.value });
                            }}
                            className="producto-detail__input producto-detail__input--unidad"
                            disabled={!editData?.unidad}
                          >
                            <option value="kg">kg</option>
                            <option value="g">g</option>
                            <option value="L">L</option>
                            <option value="ml">ml</option>
                          </select>
                        </label>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="producto-detail__clave">{producto.clave}</span>
                      <h1 className="producto-detail__name">{producto.nombre}</h1>
                      <span className="producto-detail__unidad-display">
                        {producto.unidad
                          ? `${producto.unidadCantidad ?? ''} ${producto.unidad}`.trim()
                          : '---'}
                      </span>
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
                              {t('products.detail.cancelDiscount')}
                            </button>
                          )}
                        </div>
                        {editData?.descuento && editData.descuento > 0 && (
                          <div className="producto-detail__price-edit-preview">
                            <span className="producto-detail__price-original">
                              {format(editData?.precio || producto.precio)}
                            </span>
                            <span className="producto-detail__price-final">
                              {format(getPrecioConDescuento(editData?.precio || producto.precio, editData.descuento))}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : isDescuentoActivo(producto) ? (
                    <div className="producto-detail__price-discount">
                      <span className="producto-detail__price-badge">-{producto.descuento}%</span>
                      <span className="producto-detail__price-original">{format(producto.precio)}</span>
                      <span className="producto-detail__price-final">
                        {format(getPrecioConDescuento(producto.precio, producto.descuento!))}
                      </span>
                      {producto.fechaFinDescuento && (
                        <span className="producto-detail__price-expiry">
                          {t('products.detail.validUntil', { date: formatDate(producto.fechaFinDescuento) })}
                        </span>
                      )}
                    </div>
                  ) : (
                    format(producto.precio)
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
                          <span className="producto-detail__etiquetas-limite">{t('products.detail.labelsLimit', { max: MAX_ETIQUETAS })}</span>
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
                      <span className="producto-detail__etiquetas-empty">{t('products.detail.noLabels')}</span>
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
                      <PiPackageBold size={15} />
                      <span>{t('products.detail.manageStock')}</span>
                    </label>
                    <div className="producto-detail__stock-input-row">
                      <span className="producto-detail__info-label">{t('products.detail.inWarehouse')}</span>
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
                    <PiPackageBold size={15} className="producto-detail__header-meta-icon" />
                    {producto.controlStock ? (
                      <span className="producto-detail__stock-badge">
                        {(producto.stock ?? 0) === 0
                          ? t('products.detail.noStock')
                          : t('products.detail.stockUnits', { count: producto.stock })}
                      </span>
                    ) : (
                      <span className="producto-detail__stock-untracked">
                        {t('products.detail.noStockControl')}
                      </span>
                    )}
                  </div>
                )}

              </div>
            </div>

            {/* Description Section */}
            <div className="producto-detail__section producto-detail__section--grow">
              <div className="producto-detail__section-header">
                <strong>{t('products.detail.description')}</strong>
              </div>
              {isEditing ? (
                <>
                  <textarea
                    value={editData?.descripcion || ''}
                    onChange={(e) => updateField('descripcion', e.target.value)}
                    placeholder={t('products.modal.descriptionPlaceholder')}
                    className="producto-detail__textarea"
                    maxLength={240}
                  />
                  <span className="producto-detail__char-count">
                    {(editData?.descripcion || '').length}/240
                  </span>
                </>
              ) : (
                <p className={`producto-detail__description ${!producto.descripcion ? 'producto-detail__description--empty' : ''}`}>
                  {producto.descripcion || t('products.detail.noDescription')}
                </p>
              )}
            </div>

            <div className="producto-detail__footer-meta">
              <PiCalendarBold size={13} className="producto-detail__header-meta-icon" />
              <span className="producto-detail__info-label">{t('products.detail.addedOn')}</span>
              <span className="producto-detail__info-value">{formatDate(producto.fechaCreacion)}</span>
            </div>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="producto-detail__modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="producto-detail__modal" onClick={e => e.stopPropagation()}>
            <div className="producto-detail__modal-header">
              <h3>{t('products.detail.deleteModal.title')}</h3>
              <button className="producto-detail__modal-close" onClick={() => setShowDeleteModal(false)}>
                <PiXBold size={18} />
              </button>
            </div>
            <div className="producto-detail__modal-body">
              <p>{t('products.detail.deleteModal.warning')}</p>
              <p className="producto-detail__delete-label">
                {t('products.detail.deleteModal.instruction')}
              </p>
              <code className="producto-detail__delete-code">{deleteCode}</code>
              <input
                type="text"
                className="input"
                placeholder={t('products.detail.deleteModal.placeholder')}
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value.toUpperCase())}
                autoComplete="off"
              />
            </div>
            <div className="producto-detail__modal-footer">
              <button className="btn btn--secondary btn--sm" onClick={() => setShowDeleteModal(false)}>{t('products.detail.deleteModal.cancel')}</button>
              <button
                className="btn btn--danger btn--sm"
                onClick={confirmDelete}
                disabled={deleteConfirmText !== deleteCode}
              >
                {t('products.detail.deleteModal.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default ProductoDetail;
