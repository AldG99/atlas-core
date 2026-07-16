import { useTranslation } from 'react-i18next';
import { PiXBold } from 'react-icons/pi';

interface Props {
  orderNumber?: string;
  confirmText: string;
  onConfirmTextChange: (v: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

const OrderDeleteModal = ({ orderNumber, confirmText, onConfirmTextChange, onConfirm, onClose }: Props) => {
  const { t } = useTranslation();
  return (
    <div className="order-detail__modal-overlay" onClick={onClose}>
      <div
        className="order-detail__modal order-detail__modal--confirm"
        onClick={e => e.stopPropagation()}
      >
        <div className="order-detail__modal-header">
          <h3>{t('orders.deleteModal.title')}</h3>
          <button className="order-detail__modal-close" onClick={onClose}>
            <PiXBold size={18} />
          </button>
        </div>
        <div className="order-detail__modal-body order-detail__modal-body--confirm">
          <p>{t('orders.deleteModal.warning')}</p>
          <p className="order-detail__delete-label">
            {t('orders.deleteModal.instruction')} <strong>{orderNumber}</strong>
          </p>
          <input
            type="text"
            className="input"
            placeholder={orderNumber}
            value={confirmText}
            onChange={e => onConfirmTextChange(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="order-detail__modal-footer">
          <button className="btn btn--secondary btn--sm" onClick={onClose}>
            {t('orders.deleteModal.cancel')}
          </button>
          <button
            className="btn btn--danger btn--sm"
            onClick={onConfirm}
            disabled={confirmText !== orderNumber}
          >
            {t('orders.deleteModal.delete')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDeleteModal;
