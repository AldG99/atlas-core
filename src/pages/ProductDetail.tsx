import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  Package,
  Calendar,
  History,
} from 'lucide-react';
import type { Product, ProductFormData } from '../types/Product';
import { getProductById } from '../services/productService';
import type { CancelDiscountInfo } from '../services/productService';
import { isDiscountActive, getDiscountedPrice } from '../utils/discount';
import { useLabels } from '../hooks/useLabels';
import { useProducts } from '../hooks/useProducts';
import { useToast } from '../hooks/useToast';
import { useCurrency } from '../hooks/useCurrency';
import { ROUTES } from '../config/routes';
import { LABEL_ICONS } from '../constants/labelIcons';
import ProductImage from '../components/ui/ProductImage';
import ProductDeleteModal from '../components/orders/ProductDeleteModal';
import ProductTopBar from '../components/products/ProductTopBar';
import LabelEditSection from '../components/labels/LabelEditSection';
import DiscountHistoryModal from '../components/products/DiscountHistoryModal';
import MainLayout from '../layouts/MainLayout';
import './ProductDetail.scss';

const MAX_LABELS = 4;

// Campos que cuentan como "edición del producto" para la fecha de última
// edición — el descuento (agregarlo, quitarlo o que expire) se excluye.
const NON_DISCOUNT_FIELDS: (keyof ProductFormData)[] = [
  'sku', 'name', 'price', 'costPrice', 'description', 'image',
  'labels', 'trackStock', 'stock', 'minStock', 'maxStock', 'unit', 'unitQuantity',
];

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const { labels, addLabel, removeLabel } = useLabels();
  const { products, editProduct } = useProducts();
  const { format } = useCurrency();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDeleteLabelId, setConfirmDeleteLabelId] = useState<string | null>(null);
  const [editData, setEditData] = useState<ProductFormData | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDiscountHistory, setShowDiscountHistory] = useState(false);

  const fetchProduct = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await getProductById(id);
      if (!data) {
        showToast(t('products.detail.notFound'), 'error');
        navigate(ROUTES.INVENTORY);
        return;
      }
      setProduct(data);
    } catch {
      showToast(t('products.detail.loadError'), 'error');
      navigate(ROUTES.INVENTORY);
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showToast, t]);

  useEffect(() => {
    // Falso positivo del compiler: fetch-on-mount vía useCallback. Ver eslint.config.js.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProduct();
  }, [fetchProduct]);

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat(i18n.language, {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(date);

  const getLabelsForProduct = (p: Product) => {
    return (p.labels || [])
      .map(id => labels.find(l => l.id === id))
      .filter((l): l is NonNullable<typeof l> => !!l);
  };

  const handleDelete = () => {
    if (!product) return;
    setShowDeleteModal(true);
  };

  const startEditing = () => {
    if (!product) return;
    setEditData({
      sku: product.sku,
      name: product.name,
      price: product.price,
      costPrice: product.costPrice,
      description: product.description,
      image: product.image,
      labels: product.labels,
      discount: product.discount || 0,
      discountEndDate: product.discountEndDate
        ? new Date(product.discountEndDate).toISOString().split('T')[0]
        : '',
      trackStock: product.trackStock ?? false,
      stock: product.stock ?? 0,
      minStock: product.minStock,
      maxStock: product.maxStock,
      unit: product.unit ?? '',
      unitQuantity: product.unitQuantity ?? 1,
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditData(null);
  };

  const handleDeleteLabel = async (id: string) => {
    await removeLabel(id);
    if (editData) {
      setEditData({ ...editData, labels: (editData.labels || []).filter(lid => lid !== id) });
    }
    setConfirmDeleteLabelId(null);
  };

  const handleCreateLabel = async (name: string, color: string, icon: string) => {
    if (!editData) return;
    const created = await addLabel(name, color, icon);
    if (created && (editData.labels || []).length < MAX_LABELS) {
      setEditData({ ...editData, labels: [...(editData.labels || []), created.id] });
    }
  };

  const handleSave = async () => {
    if (!product || !editData) return;

    const sku = editData.sku.trim();
    const name = editData.name.trim();
    const trimmedSku = sku.toLowerCase();

    // Mismas validaciones que ProductModal (reutiliza sus claves i18n).
    if (!sku) {
      showToast(t('products.modal.errors.codeRequired'), 'error');
      return;
    }
    if (products.some(p => p.id !== product.id && p.sku.trim().toLowerCase() === trimmedSku)) {
      showToast(t('products.modal.errors.codeDuplicate'), 'error');
      return;
    }
    if (!name) {
      showToast(t('products.modal.errors.nameRequired'), 'error');
      return;
    }
    if ((editData.price ?? 0) <= 0) {
      showToast(t('products.modal.errors.priceInvalid'), 'error');
      return;
    }
    if ((editData.costPrice ?? 0) <= 0) {
      showToast(t('products.modal.errors.costPriceInvalid'), 'error');
      return;
    }
    if (
      editData.trackStock &&
      editData.minStock != null && editData.maxStock != null &&
      editData.minStock > editData.maxStock
    ) {
      showToast(t('products.modal.errors.stockRangeInvalid'), 'error');
      return;
    }

    try {
      const dataToSave = { ...editData, sku, name };

      setSaving(true);

      let cancelledDiscount: CancelDiscountInfo | undefined;
      const hadDiscount = product.discount && product.discount > 0 && product.discountEndDate;
      // Un descuento sin fecha de fin es inerte (todo depende de discountEndDate);
      // se trata como "sin descuento" para no dejar datos zombie.
      const removingDiscount =
        !dataToSave.discount || dataToSave.discount <= 0 || !dataToSave.discountEndDate;

      if (hadDiscount && removingDiscount) {
        cancelledDiscount = {
          percentage: product.discount!,
          endDate: product.discountEndDate!
        };
      }

      if (removingDiscount) {
        dataToSave.discount = 0;
        dataToSave.discountEndDate = '';
      }

      const hasOtherChanges = NON_DISCOUNT_FIELDS.some(
        (field) => JSON.stringify(product[field] ?? null) !== JSON.stringify(dataToSave[field] ?? null)
      );

      await editProduct(product.id, dataToSave, cancelledDiscount, hasOtherChanges);

      if (cancelledDiscount) {
        await fetchProduct();
      } else {
        setProduct({
          ...product,
          ...dataToSave,
          updatedAt: hasOtherChanges ? new Date() : product.updatedAt,
          discountEndDate: dataToSave.discountEndDate
            ? new Date(dataToSave.discountEndDate + 'T00:00:00')
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


  const updateField = (field: keyof ProductFormData, value: string | number | string[]) => {
    if (!editData) return;
    setEditData({ ...editData, [field]: value });
  };

  const toggleLabel = (labelId: string) => {
    if (!editData) return;
    const current = editData.labels || [];
    if (current.includes(labelId)) {
      setEditData({ ...editData, labels: current.filter(id => id !== labelId) });
    } else if (current.length < MAX_LABELS) {
      setEditData({ ...editData, labels: [...current, labelId] });
    }
  };

  const limitReached = isEditing && (editData?.labels || []).length >= MAX_LABELS;

  if (loading) {
    return (
      <MainLayout>
        <div className="product-detail">
          <p className="product-detail__loading">{t('products.detail.loading')}</p>
        </div>
      </MainLayout>
    );
  }

  if (!product) return null;

  const productLabels = getLabelsForProduct(product);
  const hasDiscountHistory = isDiscountActive(product) || !!product.discountHistory?.length;

  return (
    <MainLayout>
      <div className="product-detail">
        <ProductTopBar
          isEditing={isEditing}
          saving={saving}
          onBack={() => navigate(ROUTES.INVENTORY)}
          onStartEdit={startEditing}
          onDelete={handleDelete}
          onSave={handleSave}
          onCancel={cancelEditing}
          onShowDiscountHistory={() => setShowDiscountHistory(true)}
        />

        {/* Content */}
        <div className="product-detail__content">
          <div className="product-detail__card">

            {/* Header: Image + Info */}
            <div className="product-detail__header">
              {/* Image Section */}
              <div className="product-detail__image-section">
                <ProductImage
                  src={product.image}
                  alt={product.name}
                  placeholderClassName="product-detail__image-placeholder"
                />
              </div>

              {/* Info Side */}
              <div className="product-detail__header-info">
                <div className="product-detail__info-rows">

                  {/* Clave */}
                  <div className="product-detail__row">
                    <span className="product-detail__row-label">{t('products.detailModal.code')}</span>
                    {isEditing ? (
                      <div className="product-detail__row-value product-detail__row-value--form">
                        <input
                          type="text"
                          value={editData?.sku || ''}
                          onChange={(e) => updateField('sku', e.target.value)}
                          placeholder={t('products.detail.codePlaceholder')}
                          className="product-detail__input product-detail__input--sku"
                        />
                      </div>
                    ) : (
                      <span className="product-detail__row-value">
                        <span className="product-detail__sku">{product.sku}</span>
                      </span>
                    )}
                  </div>

                  {/* Nombre */}
                  <div className="product-detail__row">
                    <span className="product-detail__row-label">{t('products.detailModal.name')}</span>
                    {isEditing ? (
                      <div className="product-detail__row-value product-detail__row-value--form">
                        <input
                          type="text"
                          value={editData?.name || ''}
                          onChange={(e) => updateField('name', e.target.value)}
                          placeholder={t('products.detail.namePlaceholder')}
                          className="product-detail__input product-detail__input--name"
                        />
                      </div>
                    ) : (
                      <h1 className="product-detail__row-value">{product.name}</h1>
                    )}
                  </div>

                  {/* Unidad */}
                  <div className="product-detail__row">
                    <span className="product-detail__row-label">{t('products.detailModal.unit')}</span>
                    {isEditing ? (
                      <div className="product-detail__row-value product-detail__row-value--form">
                        <div className="product-detail__unit-edit">
                          <label className="product-detail__stock-toggle">
                            <input
                              type="checkbox"
                              checked={!!editData?.unit}
                              onChange={(e) => {
                                if (!editData) return;
                                setEditData({ ...editData, unit: e.target.checked ? 'kg' : '' });
                              }}
                            />
                            <span>{t('products.detail.specifyUnit')}</span>
                            <input
                              type="number"
                              value={editData?.unitQuantity ?? 1}
                              onChange={(e) => {
                                if (!editData) return;
                                setEditData({ ...editData, unitQuantity: Math.max(0, parseFloat(e.target.value) || 0) });
                              }}
                              className="product-detail__input product-detail__input--unit-quantity"
                              min="0"
                              step="0.1"
                              disabled={!editData?.unit}
                            />
                            <select
                              value={editData?.unit || 'kg'}
                              onChange={(e) => {
                                if (!editData) return;
                                setEditData({ ...editData, unit: e.target.value });
                              }}
                              className="product-detail__input product-detail__input--unit"
                              disabled={!editData?.unit}
                            >
                              <option value="kg">kg</option>
                              <option value="g">g</option>
                              <option value="L">L</option>
                              <option value="ml">ml</option>
                            </select>
                          </label>
                        </div>
                      </div>
                    ) : (
                      <span className={`product-detail__row-value${!product.unit ? ' product-detail__row-value--empty' : ''}`}>
                        {product.unit
                          ? `${product.unitQuantity ?? ''} ${product.unit}`.trim()
                          : t('products.detailModal.noUnit')}
                      </span>
                    )}
                  </div>

                  {isEditing ? (
                    /* Costo de producción + Precio de venta: en edición, en horizontal */
                    <div className="product-detail__row product-detail__row--align-start">
                      <div className="product-detail__stock-fields">
                        <div className="product-detail__stock-input-row">
                          <label htmlFor="costPrice">{t('products.detailModal.costPrice')}</label>
                          <input
                            type="number"
                            id="costPrice"
                            value={editData?.costPrice || 0}
                            onChange={(e) => updateField('costPrice', Math.max(0, parseFloat(e.target.value) || 0))}
                            className="product-detail__input product-detail__input--cost"
                            step="0.01"
                            min="0"
                          />
                        </div>
                        <div className="product-detail__stock-input-row">
                          <label htmlFor="price">{t('products.detailModal.price')}</label>
                          <input
                            type="number"
                            id="price"
                            value={editData?.price || 0}
                            onChange={(e) => updateField('price', Math.max(0, parseFloat(e.target.value) || 0))}
                            placeholder={t('products.detailModal.price')}
                            className="product-detail__input product-detail__input--price"
                            step="0.01"
                            min="0"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Costo de producción */}
                      <div className="product-detail__row">
                        <span className="product-detail__row-label">{t('products.detailModal.costPrice')}</span>
                        <span className="product-detail__row-value">
                          {product.costPrice ? format(product.costPrice) : t('products.detailModal.noCostPrice')}
                        </span>
                      </div>

                      {/* Precio de venta */}
                      <div className="product-detail__row">
                        <span className="product-detail__row-label">{t('products.detailModal.price')}</span>
                        {isDiscountActive(product) ? (
                          <span className="product-detail__row-value product-detail__price-discount">
                            <span className="product-detail__price-badge">-{product.discount}%</span>
                            <span className="product-detail__price-original">{format(product.price)}</span>
                            <span className="product-detail__price-final">
                              {format(getDiscountedPrice(product.price, product.discount!))}
                            </span>
                          </span>
                        ) : (
                          <span className="product-detail__row-value">{format(product.price)}</span>
                        )}
                      </div>
                    </>
                  )}

                  {/* Descuento: misma fila alterna vista/edición, igual que el resto de campos */}
                  <div className="product-detail__row product-detail__row--align-start">
                    {isEditing ? (
                      <label
                        htmlFor="discount"
                        className="product-detail__row-label product-detail__row-label--discount"
                      >
                        {t('products.detail.discount')}
                      </label>
                    ) : (
                      <span className="product-detail__row-label">
                        {t('products.detailModal.discountValidUntil')}
                      </span>
                    )}
                    {isEditing ? (
                      <div className="product-detail__row-value product-detail__row-value--form">
                        <div className="product-detail__price-edit-discount">
                          <div className="product-detail__price-edit-row">
                            <div className="product-detail__discount-input-wrapper">
                              <input
                                type="number"
                                id="discount"
                                value={editData?.discount || ''}
                                onChange={(e) => {
                                  const val = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
                                  updateField('discount', val);
                                }}
                                placeholder="0"
                                className="product-detail__input product-detail__input--discount"
                                min="0"
                                max="100"
                                step="1"
                              />
                              <span className="product-detail__discount-percent">%</span>
                            </div>
                            <input
                              type="date"
                              value={editData?.discountEndDate as string || ''}
                              onChange={(e) => updateField('discountEndDate', e.target.value)}
                              className="product-detail__input product-detail__input--date"
                              min={new Date().toISOString().split('T')[0]}
                            />
                            {editData?.discount && editData.discount > 0 && (
                              <button
                                type="button"
                                className="product-detail__cancel-discount"
                                onClick={() => {
                                  if (!editData) return;
                                  setEditData({ ...editData, discount: 0, discountEndDate: '' });
                                }}
                              >
                                {t('products.detail.cancelDiscount')}
                              </button>
                            )}
                            {hasDiscountHistory && (
                              <button
                                type="button"
                                className="product-detail__icon-btn"
                                title={t('products.discountHistory')}
                                aria-label={t('products.discountHistory')}
                                onClick={() => setShowDiscountHistory(true)}
                              >
                                <History size={15} />
                              </button>
                            )}
                          </div>
                          {editData?.discount && editData.discount > 0 && (
                            <div className="product-detail__price-edit-preview">
                              <span className="product-detail__price-original">
                                {format(editData?.price || product.price)}
                              </span>
                              <span className="product-detail__price-final">
                                {format(getDiscountedPrice(editData?.price || product.price, editData.discount))}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : isDiscountActive(product) && product.discountEndDate ? (
                      <span className="product-detail__row-value">{formatDate(product.discountEndDate)}</span>
                    ) : (
                      <span className="product-detail__row-value product-detail__row-value--empty">
                        {t('products.detailModal.noDiscount')}
                      </span>
                    )}
                  </div>

                  {/* Ganancia: en edición siempre visible (vista previa en vivo, igual que ProductModal);
                      en vista solo si hay costo registrado (igual que ProductDetailModal). */}
                  {isEditing ? (() => {
                    const priceValue = editData?.price || 0;
                    const effectivePrice = editData?.discount
                      ? getDiscountedPrice(priceValue, editData.discount)
                      : priceValue;
                    const profit = effectivePrice - (editData?.costPrice || 0);
                    const margin = effectivePrice > 0 ? (profit / effectivePrice) * 100 : 0;
                    return (
                      <div className="product-detail__row">
                        <span className="product-detail__row-label">{t('products.detailModal.profit')}</span>
                        <span className={`product-detail__row-value product-detail__margin${profit < 0 ? ' product-detail__margin--negative' : ''}`}>
                          {format(profit)} ({margin.toFixed(1)}%)
                        </span>
                      </div>
                    );
                  })() : !!product.costPrice && (() => {
                    const effectivePrice = isDiscountActive(product)
                      ? getDiscountedPrice(product.price, product.discount!)
                      : product.price;
                    const profit = effectivePrice - product.costPrice;
                    const margin = effectivePrice > 0 ? (profit / effectivePrice) * 100 : 0;
                    return (
                      <div className="product-detail__row">
                        <span className="product-detail__row-label">{t('products.detailModal.profit')}</span>
                        <span className={`product-detail__row-value product-detail__margin${profit < 0 ? ' product-detail__margin--negative' : ''}`}>
                          {format(profit)} ({margin.toFixed(1)}%)
                        </span>
                      </div>
                    );
                  })()}

                  {/* Etiquetas */}
                  <div className="product-detail__row product-detail__row--align-start">
                    <span className="product-detail__row-label">{t('products.detailModal.labels')}</span>
                    {isEditing ? (
                      <div className="product-detail__row-value product-detail__row-value--form">
                        <LabelEditSection
                          labels={labels}
                          selectedIds={editData?.labels || []}
                          limitReached={limitReached}
                          confirmDeleteId={confirmDeleteLabelId}
                          maxLabels={MAX_LABELS}
                          onToggle={toggleLabel}
                          onDeleteRequest={setConfirmDeleteLabelId}
                          onDeleteConfirm={handleDeleteLabel}
                          onDeleteCancel={() => setConfirmDeleteLabelId(null)}
                          onCreate={handleCreateLabel}
                        />
                      </div>
                    ) : productLabels.length > 0 ? (
                      <div className="product-detail__row-value product-detail__header-labels-row">
                        {productLabels.map(l => {
                          const iconData = LABEL_ICONS[l.icon];
                          const Icon = iconData?.icon;
                          return (
                            <span
                              key={l.id}
                              className="product-detail__label"
                              style={{ backgroundColor: l.color }}
                              title={l.name}
                            >
                              {Icon && <Icon size={12} />}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="product-detail__row-value product-detail__row-value--empty">
                        {t('products.detailModal.noLabels')}
                      </span>
                    )}
                  </div>

                  {/* Almacén */}
                  <div className={`product-detail__row${isEditing ? ' product-detail__row--align-start' : ''}`}>
                    <span className="product-detail__row-label">{t('products.detailModal.warehouse')}</span>
                    {isEditing ? (
                      <div className="product-detail__row-value product-detail__row-value--form">
                        <div className="product-detail__stock-edit">
                          <div className="product-detail__stock-fields">
                            <label className="product-detail__stock-toggle">
                              <input
                                type="checkbox"
                                checked={!!editData?.trackStock}
                                onChange={(e) => {
                                  if (!editData) return;
                                  setEditData({
                                    ...editData,
                                    trackStock: e.target.checked,
                                    stock: e.target.checked ? (editData.stock ?? 0) : 0,
                                  });
                                }}
                              />
                              <Package size={15} />
                              <span>{t('products.detail.manageStock')}</span>
                            </label>
                            <div className="product-detail__stock-input-row">
                              <label htmlFor="stock">{t('products.modal.warehouseUnits')}</label>
                              <input
                                type="number"
                                id="stock"
                                value={editData?.stock ?? 0}
                                onChange={(e) => {
                                  if (!editData) return;
                                  setEditData({ ...editData, stock: Math.max(0, parseInt(e.target.value) || 0) });
                                }}
                                className="product-detail__input product-detail__input--stock"
                                min="0"
                                step="1"
                                disabled={!editData?.trackStock}
                              />
                            </div>
                          </div>
                          <div className="product-detail__stock-fields">
                            <div className="product-detail__stock-input-row">
                              <label htmlFor="minStock">{t('products.modal.minStock')}</label>
                              <input
                                type="number"
                                id="minStock"
                                value={editData?.minStock ?? ''}
                                onChange={(e) => {
                                  if (!editData) return;
                                  const v = e.target.value;
                                  setEditData({ ...editData, minStock: v === '' ? undefined : Math.max(0, parseInt(v) || 0) });
                                }}
                                className="product-detail__input product-detail__input--stock"
                                min="0"
                                step="1"
                                disabled={!editData?.trackStock}
                              />
                            </div>
                            <div className="product-detail__stock-input-row">
                              <label htmlFor="maxStock">{t('products.modal.maxStock')}</label>
                              <input
                                type="number"
                                id="maxStock"
                                value={editData?.maxStock ?? ''}
                                onChange={(e) => {
                                  if (!editData) return;
                                  const v = e.target.value;
                                  setEditData({ ...editData, maxStock: v === '' ? undefined : Math.max(0, parseInt(v) || 0) });
                                }}
                                className="product-detail__input product-detail__input--stock"
                                min="0"
                                step="1"
                                disabled={!editData?.trackStock}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className={`product-detail__row-value${!product.trackStock ? ' product-detail__row-value--empty' : ''}`}>
                        {product.trackStock ? (
                          (product.stock ?? 0) === 0
                            ? t('products.detailModal.noStock')
                            : t('products.detailModal.stockUnits', { count: product.stock })
                        ) : (
                          t('products.detailModal.noStockControl')
                        )}
                      </span>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="product-detail__row">
                      <span className="product-detail__row-label">{t('products.detailModal.stockRange')}</span>
                      <span className={`product-detail__row-value${product.minStock == null && product.maxStock == null ? ' product-detail__row-value--empty' : ''}`}>
                        {t('products.detailModal.stockRangeValue', {
                          min: product.minStock ?? t('products.detailModal.notSet'),
                          max: product.maxStock ?? t('products.detailModal.notSet'),
                        })}
                      </span>
                    </div>
                  )}

                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="product-detail__section product-detail__section--grow">
              <div className="product-detail__section-header">
                <strong>{t('products.detail.description')}</strong>
              </div>
              {isEditing ? (
                <>
                  <textarea
                    value={editData?.description || ''}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder={t('products.modal.descriptionPlaceholder')}
                    className="product-detail__textarea"
                    maxLength={240}
                  />
                  <span className="product-detail__char-count">
                    {(editData?.description || '').length}/240
                  </span>
                </>
              ) : (
                <p className={`product-detail__description ${!product.description ? 'product-detail__description--empty' : ''}`}>
                  {product.description || t('products.detail.noDescription')}
                </p>
              )}
            </div>

            <div className="product-detail__footer-meta">
              <div className="product-detail__footer-meta-row">
                <History size={13} className="product-detail__header-meta-icon" />
                <span className="product-detail__info-label">{t('products.detail.lastEdited')}</span>
                <span className="product-detail__info-value">
                  {formatDate(product.updatedAt ?? product.createdAt)}
                </span>
              </div>
              <div className="product-detail__footer-meta-row">
                <Calendar size={13} className="product-detail__header-meta-icon" />
                <span className="product-detail__info-label">{t('products.detail.addedOn')}</span>
                <span className="product-detail__info-value">{formatDate(product.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDeleteModal && product && (
        <ProductDeleteModal
          product={product}
          onClose={() => setShowDeleteModal(false)}
          onDeleted={() => navigate(ROUTES.INVENTORY)}
        />
      )}

      {showDiscountHistory && (
        <DiscountHistoryModal
          products={[product]}
          onClose={() => setShowDiscountHistory(false)}
        />
      )}
    </MainLayout>
  );
};

export default ProductDetail;
