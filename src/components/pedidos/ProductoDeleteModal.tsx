import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PiXBold } from 'react-icons/pi';
import { useToast } from '../../hooks/useToast';
import { deleteProducto } from '../../services/productoService';
import type { Producto } from '../../types/Producto';

interface ProductoDeleteModalProps {
  producto: Producto;
  onClose: () => void;
  onDeleted: () => void;
}

const generateDeleteCode = () =>
  Array.from(
    { length: 10 },
    () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]
  ).join('');

const ProductoDeleteModal = ({ producto, onClose, onDeleted }: ProductoDeleteModalProps) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [deleteCode] = useState(generateDeleteCode);
  const [confirmText, setConfirmText] = useState('');

  const handleConfirm = async () => {
    if (confirmText !== deleteCode) return;
    onClose();
    try {
      await deleteProducto(producto.id);
      showToast(t('products.detail.deleteSuccess'), 'success');
      onDeleted();
    } catch {
      showToast(t('products.detail.deleteError'), 'error');
    }
  };

  return (
    <div className="producto-detail__modal-overlay" onClick={onClose}>
      <div className="producto-detail__modal" onClick={e => e.stopPropagation()}>
        <div className="producto-detail__modal-header">
          <h3>{t('products.detail.deleteModal.title')}</h3>
          <button className="producto-detail__modal-close" onClick={onClose}>
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
            value={confirmText}
            onChange={e => setConfirmText(e.target.value.toUpperCase())}
            autoComplete="off"
          />
        </div>
        <div className="producto-detail__modal-footer">
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

export default ProductoDeleteModal;
