import { useTranslation } from 'react-i18next';
import { PiArrowLeftBold, PiPencilBold, PiTrashBold } from 'react-icons/pi';

interface Props {
  isEditing: boolean;
  role: 'admin' | 'member';
  saving: boolean;
  onBack: () => void;
  onStartEdit: () => void;
  onDelete: () => void;
  onSave: () => void;
  onCancel: () => void;
}

const ProductTopBar = ({
  isEditing, role, saving,
  onBack, onStartEdit, onDelete, onSave, onCancel,
}: Props) => {
  const { t } = useTranslation();
  return (
    <div className="product-detail__top-bar">
      <div className="product-detail__top-bar-inner">
        <button
          className="product-detail__icon-btn product-detail__icon-btn--back"
          onClick={onBack}
          title={t('products.detail.back')}
        >
          <PiArrowLeftBold size={20} />
        </button>
        {role === 'admin' && (
          isEditing ? (
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
                className="product-detail__icon-btn product-detail__icon-btn--primary"
                title={t('products.detail.editProduct')}
              >
                <PiPencilBold size={20} />
              </button>
              <button
                onClick={onDelete}
                className="product-detail__icon-btn product-detail__icon-btn--danger"
                title={t('products.detail.deleteProduct')}
              >
                <PiTrashBold size={20} />
              </button>
            </>
          )
        )}
      </div>
    </div>
  );
};

export default ProductTopBar;
