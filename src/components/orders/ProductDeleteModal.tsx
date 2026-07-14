import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PiXBold } from 'react-icons/pi';
import { useToast } from '../../hooks/useToast';
import { deleteProduct } from '../../services/productService';
import type { Product } from '../../types/Product';

interface ProductDeleteModalProps {
  product: Product;
  onClose: () => void;
  onDeleted: () => void;
}

const generateDeleteCode = () =>
  Array.from(
    { length: 10 },
    () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]
  ).join('');

const ProductDeleteModal = ({ product, onClose, onDeleted }: ProductDeleteModalProps) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [deleteCode] = useState(generateDeleteCode);
  const [confirmText, setConfirmText] = useState('');

  const handleConfirm = async () => {
    if (confirmText !== deleteCode) return;
    onClose();
    try {
      await deleteProduct(product.id);
      showToast(t('products.detail.deleteSuccess'), 'success');
      onDeleted();
    } catch {
      showToast(t('products.detail.deleteError'), 'error');
    }
  };

  return (
    <div className="product-detail__modal-overlay" onClick={onClose}>
      <div className="product-detail__modal" onClick={e => e.stopPropagation()}>
        <div className="product-detail__modal-header">
          <h3>{t('products.detail.deleteModal.title')}</h3>
          <button className="product-detail__modal-close" onClick={onClose}>
            <PiXBold size={18} />
          </button>
        </div>
        <div className="product-detail__modal-body">
          <p>{t('products.detail.deleteModal.warning')}</p>
          <p className="product-detail__delete-label">
            {t('products.detail.deleteModal.instruction')}
          </p>
          <code className="product-detail__delete-code">{deleteCode}</code>
          <input
            type="text"
            className="input"
            placeholder={t('products.detail.deleteModal.placeholder')}
            value={confirmText}
            onChange={e => setConfirmText(e.target.value.toUpperCase())}
            autoComplete="off"
          />
        </div>
        <div className="product-detail__modal-footer">
          <button className="btn btn--secondary btn--sm" onClick={onClose}>
            {t('products.detail.deleteModal.cancel')}
          </button>
          <button
            className="btn btn--danger btn--sm"
            onClick={handleConfirm}
            disabled={confirmText !== deleteCode}
          >
            {t('products.detail.deleteModal.delete')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDeleteModal;
