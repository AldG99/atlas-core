import { useTranslation } from 'react-i18next';
import { ArrowLeft, History, Pencil, Trash2 } from 'lucide-react';

interface Props {
  isEditing: boolean;
  saving: boolean;
  onBack: () => void;
  onStartEdit: () => void;
  onDelete: () => void;
  onSave: () => void;
  onCancel: () => void;
  onShowDiscountHistory: () => void;
}

const ProductTopBar = ({
  isEditing, saving,
  onBack, onStartEdit, onDelete, onSave, onCancel, onShowDiscountHistory,
}: Props) => {
  const { t } = useTranslation();
  return (
    <div className="product-detail__top-bar">
      <div className="product-detail__top-bar-inner">
        <button
          className="product-detail__icon-btn product-detail__icon-btn--back"
          onClick={onBack}
          title={t('products.detail.back')}
          aria-label={t('products.detail.back')}
        >
          <ArrowLeft size={20} />
        </button>
        {isEditing ? (
          <div className="product-detail__top-bar-actions">
            <button
              onClick={onCancel}
              className="btn btn--outline btn--sm"
              disabled={saving}
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={onSave}
              className="btn btn--primary btn--sm"
              disabled={saving}
            >
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        ) : (
          <>
            <span className="product-detail__top-divider" />
            <button
              onClick={onStartEdit}
              className="product-detail__icon-btn"
              title={t('products.detail.editProduct')}
              aria-label={t('products.detail.editProduct')}
            >
              <Pencil size={20} />
            </button>
            <button
              onClick={onDelete}
              className="product-detail__icon-btn"
              title={t('products.detail.deleteProduct')}
              aria-label={t('products.detail.deleteProduct')}
            >
              <Trash2 size={20} />
            </button>
            <button
              onClick={onShowDiscountHistory}
              className="product-detail__icon-btn"
              title={t('products.discountHistory')}
              aria-label={t('products.discountHistory')}
            >
              <History size={20} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ProductTopBar;
