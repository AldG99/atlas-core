import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { PiXBold, PiImageBold, PiPlusBold, PiTrashBold, PiWarehouseBold } from 'react-icons/pi';
import type { ProductFormData, Label } from '../../types/Product';
import { uploadProductImage } from '../../services/productService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { useLabels } from '../../hooks/useLabels';
import { LABEL_ICONS, LABEL_COLORS } from '../../constants/labelIcons';
import ImageCropper from '../ui/ImageCropper';
import './ProductModal.scss';

interface ProductModalProps {
  product?: ProductFormData;
  onClose: () => void;
  onSave: (data: ProductFormData) => void;
}

const ProductModal = ({ product, onClose, onSave }: ProductModalProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { labels: allLabels, addLabel, removeLabel } = useLabels();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(product?.image ?? null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState<ProductFormData>(
    product ?? {
      sku: '',
      name: '',
      price: 0,
      description: '',
      image: '',
      labels: [],
      trackStock: false,
      stock: 0,
      unit: '',
      unitQuantity: 1,
    }
  );

  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});

  const [showNewLabel, setShowNewLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);
  const [newLabelIcon, setNewLabelIcon] = useState('star');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ProductFormData, string>> = {};

    if (!formData.sku.trim()) {
      newErrors.sku = t('products.modal.errors.codeRequired');
    }
    if (!formData.name.trim()) {
      newErrors.name = t('products.modal.errors.nameRequired');
    }
    if (formData.price <= 0) {
      newErrors.price = t('products.modal.errors.priceInvalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!validate() || !user) return;

    let finalData = { ...formData };

    if (imageFile) {
      setIsUploading(true);
      try {
        const imageUrl = await uploadProductImage(imageFile, user.uid);
        finalData = { ...finalData, image: imageUrl };
      } catch (error) {
        const msg = error instanceof Error ? error.message : '';
        if (msg === 'IMAGEN_RECHAZADA') showToast(t('common.imageModeration.rejected'), 'error');
        else if (msg === 'MODERACION_TIMEOUT') showToast(t('common.imageModeration.timeout'), 'warning');
        else showToast(t('common.imageModeration.error'), 'error');
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    onSave(finalData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (errors[name as keyof ProductFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCropSrc(reader.result as string);
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleCropConfirm = (blob: Blob, url: string) => {
    setImageFile(new File([blob], 'producto.jpg', { type: 'image/jpeg' }));
    setPreviewImage(url);
    setCropSrc(null);
  };

  const removeImage = () => {
    setPreviewImage(null);
    setImageFile(null);
    setCropSrc(null);
    setFormData(prev => ({ ...prev, image: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const assignedLabels = (formData.labels || [])
    .map(id => allLabels.find(l => l.id === id))
    .filter((l): l is Label => !!l);

  const availableLabels = allLabels.filter(
    l => !(formData.labels || []).includes(l.id)
  );

  const MAX_LABELS = 4;
  const limitReached = (formData.labels || []).length >= MAX_LABELS;

  const toggleLabel = (id: string) => {
    setFormData(prev => {
      const current = prev.labels || [];
      if (current.includes(id)) {
        return { ...prev, labels: current.filter(lid => lid !== id) };
      }
      if (current.length >= MAX_LABELS) return prev;
      return { ...prev, labels: [...current, id] };
    });
  };

  const handleDeleteLabel = async (id: string) => {
    await removeLabel(id);
    setFormData(prev => ({
      ...prev,
      labels: (prev.labels || []).filter(lid => lid !== id),
    }));
  };

  const handleCreateLabel = async () => {
    const name = newLabelName.trim() || LABEL_ICONS[newLabelIcon]?.label || newLabelIcon;
    const created = await addLabel(name, newLabelColor, newLabelIcon);
    if (created && (formData.labels || []).length < MAX_LABELS) {
      setFormData(prev => ({
        ...prev,
        labels: [...(prev.labels || []), created.id],
      }));
    }
    setNewLabelName('');
    setNewLabelColor(LABEL_COLORS[0]);
    setNewLabelIcon('star');
    setShowNewLabel(false);
  };

  return (
    <>
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--large" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h2>{product ? t('products.modal.editTitle') : t('products.modal.newTitle')}</h2>
          <button className="modal__close" onClick={onClose}>
            <PiXBold size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal__body">

          {/* Imagen */}
          <div className="form-section">
            <h3 className="form-section__title">{t('products.modal.image')}</h3>
            <div className="producto-image-upload">
              <div className="producto-image-preview" onClick={handleImageClick}>
                {previewImage ? (
                  <img src={previewImage} alt="Preview" />
                ) : (
                  <div className="producto-image-placeholder">
                    <PiImageBold size={24} />
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
              <div className="producto-image-info">
                <span className="producto-image-hint">
                  {previewImage ? t('products.modal.imageHintChange') : t('products.modal.imageHintAdd')}
                </span>
                {previewImage && (
                  <button type="button" className="btn btn--sm btn--danger" onClick={removeImage}>
                    {t('products.modal.imageRemove')}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Información del producto */}
          <div className="form-section">
            <h3 className="form-section__title">{t('products.modal.info')}</h3>
            <div className="form-grid form-grid--2">
              <div className="form-group">
                <label htmlFor="sku">{t('products.modal.code')}</label>
                <input
                  type="text"
                  id="sku"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  className={`input ${errors.sku ? 'input--error' : ''}`}
                  placeholder={t('products.modal.codePlaceholder')}
                  maxLength={8}
                />
                {errors.sku && <span className="form-error">{errors.sku}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="name">{t('products.modal.name')}</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`input ${errors.name ? 'input--error' : ''}`}
                  placeholder={t('products.modal.namePlaceholder')}
                  maxLength={60}
                />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>

              <div className="form-group form-group--full">
                <label htmlFor="price">{t('products.modal.price')}</label>
                <div className="input-currency">
                  <span className="input-currency__symbol">$</span>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price || ''}
                    onChange={handleChange}
                    className={`input ${errors.price ? 'input--error' : ''}`}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                {errors.price && <span className="form-error">{errors.price}</span>}
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div className="form-section">
            <h3 className="form-section__title">{t('products.modal.description')}</h3>
            <div className="form-group">
              <label htmlFor="description">{t('products.modal.description')}</label>
              <textarea
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                className="input"
                placeholder={t('products.modal.descriptionPlaceholder')}
                rows={3}
                maxLength={240}
                style={{ resize: 'none' }}
              />
              <span className="form-char-count">{(formData.description || '').length}/240</span>
            </div>
          </div>

          {/* Unidad de medida */}
          <div className="form-section">
            <h3 className="form-section__title">{t('products.detail.unit')}</h3>
            <div className="form-group">
              <label className="stock-toggle">
                <input
                  type="checkbox"
                  checked={!!formData.unit}
                  onChange={(e) =>
                    setFormData(prev => ({
                      ...prev,
                      unit: e.target.checked ? 'kg' : '',
                      unitQuantity: e.target.checked ? (prev.unitQuantity ?? 1) : 1,
                    }))
                  }
                />
                <span>{t('products.detail.specifyUnit')}</span>
                <input
                  type="number"
                  value={formData.unitQuantity ?? 1}
                  onChange={(e) =>
                    setFormData(prev => ({
                      ...prev,
                      unitQuantity: Math.max(0, parseFloat(e.target.value) || 0),
                    }))
                  }
                  className="input stock-input"
                  min="0"
                  step="0.1"
                  disabled={!formData.unit}
                />
                <select
                  value={formData.unit || 'kg'}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, unit: e.target.value }))
                  }
                  className="input"
                  disabled={!formData.unit}
                  style={{ width: 'auto' }}
                >
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="L">L</option>
                  <option value="ml">ml</option>
                </select>
              </label>
            </div>
          </div>

          {/* Etiquetas asignadas */}
          <div className="form-section">
            <h3 className="form-section__title">{t('products.modal.labels')}</h3>
            <div className="form-group">
              {assignedLabels.length > 0 ? (
                <div className="etiquetas-chips">
                  {assignedLabels.map(label => (
                    <div key={label.id} className="etiqueta-chip-wrapper">
                      <span
                        className="etiqueta-chip etiqueta-chip--removable"
                        style={{ backgroundColor: label.color }}
                        title={label.name}
                      >
                        {LABEL_ICONS[label.icon] && (() => {
                          const Icon = LABEL_ICONS[label.icon].icon;
                          return <Icon size={12} />;
                        })()}
                        <button
                          type="button"
                          className="etiqueta-chip__remove"
                          onClick={() => toggleLabel(label.id)}
                        >
                          <PiXBold size={10} />
                        </button>
                      </span>
                      {confirmDeleteId === label.id ? (
                        <div className="etiqueta-chip__confirm">
                          <span>{t('common.confirmDelete')}</span>
                          <button type="button" className="etiqueta-chip__confirm-yes" onClick={() => { handleDeleteLabel(label.id); setConfirmDeleteId(null); }}>{t('common.yes')}</button>
                          <button type="button" className="etiqueta-chip__confirm-no" onClick={() => setConfirmDeleteId(null)}>{t('common.no')}</button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="etiqueta-chip__delete"
                          onClick={() => setConfirmDeleteId(label.id)}
                          title={t('products.modal.labelDelete')}
                        >
                          <PiTrashBold size={10} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="etiquetas-vacio">{t('products.modal.labelsNone')}</span>
              )}
              {limitReached && (
                <span className="etiquetas-limite">{t('products.modal.labelsLimit', { max: MAX_LABELS })}</span>
              )}
            </div>
          </div>

          {/* Etiquetas creadas */}
          <div className="form-section">
            <h3 className="form-section__title">{t('products.modal.labels')}</h3>
            <div className="form-group">
              {availableLabels.length > 0 && (
                <div className="etiquetas-disponibles">
                  {availableLabels.map(label => {
                    const iconData = LABEL_ICONS[label.icon];
                    const Icon = iconData?.icon;
                    return (
                      <div key={label.id} className="etiqueta-chip-wrapper">
                        <button
                          type="button"
                          className="etiqueta-option"
                          onClick={() => !limitReached && toggleLabel(label.id)}
                          title={limitReached ? t('products.modal.labelsLimit', { max: MAX_LABELS }) : label.name}
                          style={{ opacity: limitReached ? 0.5 : 1, cursor: limitReached ? 'not-allowed' : 'pointer' }}
                        >
                          <span className="etiqueta-option__icon" style={{ color: label.color }}>
                            {Icon && <Icon size={14} />}
                          </span>
                        </button>
                        {confirmDeleteId === label.id ? (
                          <div className="etiqueta-chip__confirm">
                            <span>{t('common.confirmDelete')}</span>
                            <button type="button" className="etiqueta-chip__confirm-yes" onClick={() => { handleDeleteLabel(label.id); setConfirmDeleteId(null); }}>{t('common.yes')}</button>
                            <button type="button" className="etiqueta-chip__confirm-no" onClick={() => setConfirmDeleteId(null)}>{t('common.no')}</button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="etiqueta-chip__delete"
                            onClick={() => setConfirmDeleteId(label.id)}
                            title={t('products.modal.labelDelete')}
                          >
                            <PiTrashBold size={10} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {!showNewLabel ? (
                <button
                  type="button"
                  className="etiqueta-add-btn"
                  onClick={() => setShowNewLabel(true)}
                >
                  <PiPlusBold size={14} />
                  {t('products.modal.labelNew')}
                </button>
              ) : (
                <div className="etiqueta-new-form">
                  <div className="etiqueta-picker-row">
                    <span className="etiqueta-picker-label">{t('products.modal.labelName')}</span>
                    <input
                      type="text"
                      className="input etiqueta-nombre-input"
                      placeholder={t('products.modal.labelNamePlaceholder')}
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                    />
                  </div>

                  <div className="etiqueta-picker-row">
                    <span className="etiqueta-picker-label">{t('products.modal.labelIcon')}</span>
                    <div className="etiqueta-icon-picker">
                      {Object.entries(LABEL_ICONS).map(([key, { icon: Icon, label }]) => (
                        <button
                          key={key}
                          type="button"
                          className={`etiqueta-icon-swatch ${newLabelIcon === key ? 'etiqueta-icon-swatch--active' : ''}`}
                          style={{ color: newLabelColor }}
                          onClick={() => setNewLabelIcon(key)}
                          title={label}
                        >
                          <Icon size={16} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="etiqueta-picker-row">
                    <span className="etiqueta-picker-label">{t('products.modal.labelColor')}</span>
                    <div className="etiqueta-color-picker">
                      {LABEL_COLORS.map(color => (
                        <button
                          key={color}
                          type="button"
                          className={`etiqueta-color-swatch ${newLabelColor === color ? 'etiqueta-color-swatch--active' : ''}`}
                          style={{ backgroundColor: color }}
                          onClick={() => setNewLabelColor(color)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="etiqueta-new-preview">
                    {(() => {
                      const Icon = LABEL_ICONS[newLabelIcon]?.icon;
                      const previewName = newLabelName.trim() || LABEL_ICONS[newLabelIcon]?.label;
                      return (
                        <span
                          className="etiqueta-chip"
                          style={{ backgroundColor: newLabelColor }}
                          title={t('products.modal.labelPreview')}
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
                      onClick={() => { setShowNewLabel(false); setNewLabelName(''); }}
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="button"
                      className="btn btn--sm btn--primary"
                      onClick={handleCreateLabel}
                    >
                      {t('products.modal.labelCreate')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Almacén */}
          <div className="form-section">
            <h3 className="form-section__title">{t('products.modal.warehouse')}</h3>
            <div className="form-group">
              <label className="stock-toggle">
                <input
                  type="checkbox"
                  checked={!!formData.trackStock}
                  onChange={(e) =>
                    setFormData(prev => ({
                      ...prev,
                      trackStock: e.target.checked,
                      stock: e.target.checked ? (prev.stock ?? 0) : 0,
                    }))
                  }
                />
                <PiWarehouseBold size={16} />
                <span>{t('products.modal.warehouseManage')}</span>
              </label>
              <div className="stock-input-row">
                <label htmlFor="stock">{t('products.modal.warehouseUnits')}</label>
                <input
                  type="number"
                  id="stock"
                  name="stock"
                  value={formData.stock ?? 0}
                  onChange={handleChange}
                  className="input stock-input"
                  min="0"
                  step="1"
                  placeholder="0"
                  disabled={!formData.trackStock}
                />
              </div>
            </div>
          </div>

          <div className="modal__actions">
            <button type="button" className="btn btn--secondary" onClick={onClose} disabled={isUploading}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn btn--primary" disabled={isUploading}>
              {isUploading ? t('products.modal.uploadingImage') : product ? t('products.modal.submitEdit') : t('products.modal.submitNew')}
            </button>
          </div>

        </form>
      </div>
    </div>
    {cropSrc && (
      <ImageCropper
        imageSrc={cropSrc}
        onConfirm={handleCropConfirm}
        onCancel={() => setCropSrc(null)}
      />
    )}
    </>
  );
};

export default ProductModal;
