import { useTranslation } from 'react-i18next';
import {
  PiArrowLeft,
  PiWhatsappLogo,
  PiCopy,
  PiCheck,
  PiTrash,
  PiFileArrowDown,
} from 'react-icons/pi';
import type { Order } from '../../types/Order';

interface Props {
  order: Order;
  copiedId: boolean;
  downloading: boolean;
  submitting: boolean;
  settled: boolean;
  canMarkDelivered: boolean;
  paymentInput: string;
  paymentProduct: string;
  paymentError: string | null;
  onBack: () => void;
  onWhatsApp: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onPaymentInputChange: (v: string) => void;
  onPaymentProductChange: (v: string) => void;
  onPay: () => void;
  onDeliver: () => void;
}

const OrderTopBar = ({
  order,
  copiedId,
  downloading,
  submitting,
  settled,
  canMarkDelivered,
  paymentInput,
  paymentProduct,
  paymentError,
  onBack,
  onWhatsApp,
  onCopy,
  onDownload,
  onDelete,
  onPaymentInputChange,
  onPaymentProductChange,
  onPay,
  onDeliver,
}: Props) => {
  const { t } = useTranslation();
  return (
    <div className="order-detail__top-bar">
      <div className="order-detail__top-bar-inner">
        <button
          className="order-detail__icon-btn order-detail__icon-btn--back"
          onClick={onBack}
          title={t('orders.detail.back')}
        >
          <PiArrowLeft size={20} />
        </button>
        <button
          onClick={onWhatsApp}
          className="order-detail__icon-btn"
          title={t('orders.detail.whatsapp')}
          disabled={!order.clientPhone}
        >
          <PiWhatsappLogo size={20} />
        </button>
        <button
          onClick={onDownload}
          className="order-detail__icon-btn"
          title={t('orders.detail.download')}
          disabled={downloading}
        >
          <PiFileArrowDown size={20} />
        </button>
        <button
          onClick={onCopy}
          className={`order-detail__icon-btn ${copiedId ? 'order-detail__icon-btn--success' : ''}`}
          title={copiedId ? t('orders.detail.copied') : t('orders.detail.copy')}
        >
          {copiedId ? <PiCheck size={20} /> : <PiCopy size={20} />}
        </button>
        <span className="order-detail__top-divider" />
        <button
          onClick={onDelete}
          className="order-detail__icon-btn"
          title={t('orders.detail.delete')}
        >
          <PiTrash size={20} />
        </button>
        {!order.archived && (
          <>
            <div className="order-detail__top-bar-payment-group">
              <div className="order-detail__top-bar-payment">
                <select
                  value={paymentProduct}
                  onChange={e => onPaymentProductChange(e.target.value)}
                  disabled={settled}
                >
                  <option value="general">{t('orders.detail.generalPayment')}</option>
                  {order.items.map((p, idx) => (
                    <option key={idx} value={idx}>
                      {p.sku ? `[${p.sku}] ` : ''}{p.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  max="999999"
                  step="0.01"
                  placeholder={t('orders.detail.payInputPlaceholder')}
                  value={paymentInput}
                  onChange={e => onPaymentInputChange(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') onPay(); }}
                  disabled={settled}
                />
              </div>
              <button
                className="btn btn--primary btn--sm"
                onClick={onPay}
                disabled={settled || submitting}
              >
                {submitting ? '...' : t('orders.detail.payButton')}
              </button>
            </div>
            <button
              onClick={onDeliver}
              className={`order-detail__btn-delivered ${canMarkDelivered ? 'order-detail__btn-delivered--active' : ''} ${order.status === 'delivered' ? 'order-detail__btn-delivered--done' : ''}`}
              disabled={!canMarkDelivered || submitting}
            >
              {order.status === 'delivered'
                ? t('orders.status.delivered')
                : t('orders.detail.deliver')
              }
            </button>
            {paymentError && (
              <span className="order-detail__top-bar-payment-error">{paymentError}</span>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OrderTopBar;
