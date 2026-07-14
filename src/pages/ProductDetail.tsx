import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  PiPackageBold,
  PiCalendarBold,
  PiCameraBold,
} from 'react-icons/pi';
import type { Product, ProductFormData } from '../types/Product';
import { getProductById, updateProduct, uploadProductImage } from '../services/productService';
import type { CancelDiscountInfo } from '../services/productService';
import { useLabels } from '../hooks/useLabels';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useCurrency } from '../hooks/useCurrency';
import { ROUTES } from '../config/routes';
import { LABEL_ICONS } from '../constants/labelIcons';
import { compressImage } from '../utils/imageUtils';
import ProductImage from '../components/ui/ProductImage';
import ProductDeleteModal from '../components/orders/ProductDeleteModal';
import ProductTopBar from '../components/products/ProductTopBar';
import LabelEditSection from '../components/labels/LabelEditSection';
import MainLayout from '../layouts/MainLayout';
import './ProductDetail.scss';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, role } = useAuth();
  const { showToast } = useToast();
  const { labels, addLabel, removeLabel } = useLabels();
  const { format } = useCurrency();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDeleteLabelId, setConfirmDeleteLabelId] = useState<string | null>(null);
  const [editData, setEditData] = useState<ProductFormData | null>(null);
  const [saving, setSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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
          setEditData({ ...editData, image: reader.result as string });
        };
        reader.readAsDataURL(compressed);
      } catch {
        selectedImageFile.current = file;
        const reader = new FileReader();
        reader.onloadend = () => {
          setEditData({ ...editData, image: reader.result as string });
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const fetchProduct = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await getProductById(id);
      if (!data) {
        showToast(t('products.detail.notFound'), 'error');
        navigate(ROUTES.PRODUCTS);
        return;
      }
      setProduct(data);
    } catch {
      showToast(t('products.detail.loadError'), 'error');
      navigate(ROUTES.PRODUCTS);
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showToast, t]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat(i18n.language, {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(new Date(date));

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
      description: product.description,
      image: product.image,
      labels: product.labels,
      discount: product.discount || 0,
      discountEndDate: product.discountEndDate
        ? new Date(product.discountEndDate).toISOString().split('T')[0]
        : '',
      trackStock: product.trackStock ?? false,
      stock: product.stock ?? 0,
      unit: product.unit ?? '',
      unitQuantity: product.unitQuantity ?? 1,
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditData(null);
    selectedImageFile.current = null;
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
    if (!product || !editData || !user) return;
    try {
      const dataToSave = { ...editData };

      if (selectedImageFile.current) {
        setIsUploading(true);
        try {
          const url = await uploadProductImage(selectedImageFile.current, user.uid);
          dataToSave.image = url;
          selectedImageFile.current = null;
        } catch (error) {
          const msg = error instanceof Error ? error.message : '';
          if (msg === 'IMAGEN_RECHAZADA') showToast(t('common.imageModeration.rejected'), 'error');
          else if (msg === 'MODERACION_TIMEOUT') showToast(t('common.imageModeration.timeout'), 'warning');
          else showToast(t('common.imageModeration.error'), 'error');
          return;
        } finally {
          setIsUploading(false);
        }
      }

      setSaving(true);

      let cancelledDiscount: CancelDiscountInfo | undefined;
      const hadDiscount = product.discount && product.discount > 0 && product.discountEndDate;
      const removingDiscount = !dataToSave.discount || dataToSave.discount <= 0;

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

      await updateProduct(product.id, dataToSave, cancelledDiscount);

      if (cancelledDiscount) {
        await fetchProduct();
      } else {
        setProduct({
          ...product,
          ...dataToSave,
          discountEndDate: dataToSave.discountEndDate
            ? new Date(dataToSave.discountEndDate + 'T00:00:00')
            : undefined
        });
      }
      setIsEditing(false);
      setEditData(null);
      showToast(t('products.detail.updateSuccess'), 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'IMAGEN_RECHAZADA') showToast(t('common.imageModeration.rejected'), 'error');
      else if (msg === 'MODERACION_TIMEOUT') showToast(t('common.imageModeration.timeout'), 'warning');
      else if (msg === 'MODERACION_ERROR') showToast(t('common.imageModeration.error'), 'error');
      else showToast(t('products.detail.updateError'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const isDiscountActive = (p: Product): boolean => {
    if (!p.discount || p.discount <= 0) return false;
    if (!p.discountEndDate) return false;
    return new Date(p.discountEndDate) >= new Date(new Date().toDateString());
  };

  const getDiscountedPrice = (price: number, discount: number): number => {
    return price * (1 - discount / 100);
  };

  const updateField = (field: keyof ProductFormData, value: string | number | string[]) => {
    if (!editData) return;
    setEditData({ ...editData, [field]: value });
  };

  const MAX_LABELS = 4;

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

  return (
    <MainLayout>
      <div className="product-detail">
        <ProductTopBar
          isEditing={isEditing}
          role={role}
          saving={saving}
          isUploading={isUploading}
          onBack={() => navigate(ROUTES.PRODUCTS)}
          onStartEdit={startEditing}
          onDelete={handleDelete}
          onSave={handleSave}
          onCancel={cancelEditing}
        />

        {/* Content */}
        <div className="product-detail__content">
          <div className="product-detail__card">

            {/* Header: Image + Info */}
            <div className="product-detail__header">
              {/* Image Section */}
              <div
                className={`product-detail__image-section ${isEditing ? 'product-detail__image-section--editable' : ''}`}
                onClick={() => isEditing && fileInputRef.current?.click()}
              >
                <ProductImage
                  src={isEditing ? editData?.image : product.image}
                  alt={product.name}
                  placeholderClassName="product-detail__image-placeholder"
                />
                {isEditing && (
                  <div className="product-detail__image-overlay">
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
              <div className="product-detail__header-info">
                <div className="product-detail__title-section">
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        value={editData?.sku || ''}
                        onChange={(e) => updateField('sku', e.target.value)}
                        placeholder={t('products.detail.codePlaceholder')}
                        className="product-detail__input product-detail__input--sku"
                      />
                      <input
                        type="text"
                        value={editData?.name || ''}
                        onChange={(e) => updateField('name', e.target.value)}
                        placeholder={t('products.detail.namePlaceholder')}
                        className="product-detail__input product-detail__input--name"
                      />
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
                    </>
                  ) : (
                    <>
                      <span className="product-detail__sku">{product.sku}</span>
                      <h1 className="product-detail__name">{product.name}</h1>
                      <span className="product-detail__unit-display">
                        {product.unit
                          ? `${product.unitQuantity ?? ''} ${product.unit}`.trim()
                          : '---'}
                      </span>
                    </>
                  )}
                </div>

                <div className="product-detail__price">
                  {isEditing ? (
                    <div className="product-detail__price-edit">
                      <input
                        type="number"
                        value={editData?.price || 0}
                        onChange={(e) => updateField('price', parseFloat(e.target.value) || 0)}
                        placeholder="Precio"
                        className="product-detail__input product-detail__input--price"
                        step="0.01"
                        min="0"
                      />
                      <div className="product-detail__price-edit-discount">
                        <div className="product-detail__price-edit-row">
                          <div className="product-detail__discount-input-wrapper">
                            <input
                              type="number"
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
                  ) : isDiscountActive(product) ? (
                    <div className="product-detail__price-discount">
                      <span className="product-detail__price-badge">-{product.discount}%</span>
                      <span className="product-detail__price-original">{format(product.price)}</span>
                      <span className="product-detail__price-final">
                        {format(getDiscountedPrice(product.price, product.discount!))}
                      </span>
                      {product.discountEndDate && (
                        <span className="product-detail__price-expiry">
                          {t('products.detail.validUntil', { date: formatDate(product.discountEndDate) })}
                        </span>
                      )}
                    </div>
                  ) : (
                    format(product.price)
                  )}
                </div>

                {/* Etiquetas */}
                <div className="product-detail__header-labels">
                  <div className="product-detail__header-labels-row">
                    {isEditing ? (
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
                    ) : productLabels.length > 0 ? (
                      productLabels.map(l => {
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
                      })
                    ) : (
                      <span className="product-detail__labels-empty">{t('products.detail.noLabels')}</span>
                    )}
                  </div>
                </div>

                {/* Almacén */}
                {isEditing ? (
                  <div className="product-detail__stock-edit">
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
                      <PiPackageBold size={15} />
                      <span>{t('products.detail.manageStock')}</span>
                    </label>
                    <div className="product-detail__stock-input-row">
                      <span className="product-detail__info-label">{t('products.detail.inWarehouse')}</span>
                      <input
                        type="number"
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
                ) : (
                  <div className="product-detail__stock-display">
                    <PiPackageBold size={15} className="product-detail__header-meta-icon" />
                    {product.trackStock ? (
                      <span className="product-detail__stock-badge">
                        {(product.stock ?? 0) === 0
                          ? t('products.detail.noStock')
                          : t('products.detail.stockUnits', { count: product.stock })}
                      </span>
                    ) : (
                      <span className="product-detail__stock-untracked">
                        {t('products.detail.noStockControl')}
                      </span>
                    )}
                  </div>
                )}

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
              <PiCalendarBold size={13} className="product-detail__header-meta-icon" />
              <span className="product-detail__info-label">{t('products.detail.addedOn')}</span>
              <span className="product-detail__info-value">{formatDate(product.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {showDeleteModal && product && (
        <ProductDeleteModal
          product={product}
          onClose={() => setShowDeleteModal(false)}
          onDeleted={() => navigate(ROUTES.PRODUCTS)}
        />
      )}
    </MainLayout>
  );
};

export default ProductDetail;
