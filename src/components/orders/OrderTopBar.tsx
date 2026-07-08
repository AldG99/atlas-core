import { useTranslation } from 'react-i18next';
import {
  PiArrowLeftBold,
  PiWhatsappLogoBold,
  PiCopyBold,
  PiCheckBold,
  PiCheckCircleBold,
  PiTrashBold,
  PiDownloadSimpleBold,
} from 'react-icons/pi';
import type { Order } from '../../types/Order';

interface Props {
  order: Order;
  copiedId: boolean;
  downloading: boolean;
  submitting: boolean;
  role: string;
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
  role,
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
    <div className="pedido-detail__top-bar">
      <div className="pedido-detail__top-bar-inner">
        <button
          className="pedido-detail__icon-btn pedido-detail__icon-btn--back"
          onClick={onBack}
          title={t('orders.detail.back')}
        >
          <PiArrowLeftBold size={20} />
        </button>
        <button
          onClick={onWhatsApp}
          className="pedido-detail__icon-btn pedido-detail__icon-btn--whatsapp"
          title={t('orders.detail.whatsapp')}
        >
          <PiWhatsappLogoBold size={20} />
        </button>
        <button
          onClick={onCopy}
          className={`pedido-detail__icon-btn ${copiedId ? 'pedido-detail__icon-btn--success' : ''}`}
          title={copiedId ? t('orders.detail.copied') : t('orders.detail.copy')}
        >
          {copiedId ? <PiCheckBold size={20} /> : <PiCopyBold size={20} />}
        </button>
        <button
          onClick={onDownload}
          className="pedido-detail__icon-btn"
          title={t('orders.detail.download')}
          disabled={downloading}
        >
          <PiDownloadSimpleBold size={20} />
        </button>
        {role === 'admin' && (
          <>
            <span className="pedido-detail__top-divider" />
            <button
              onClick={onDelete}
              className="pedido-detail__icon-btn pedido-detail__icon-btn--danger"
              title={t('orders.detail.delete')}
            >
              <PiTrashBold size={20} />
            </button>
          </>
        )}
        {!order.archived && (
          <>
            <div className="pedido-detail__top-bar-abono-group">
              <div className="pedido-detail__top-bar-abono">
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
              className={`pedido-detail__btn-entregado ${canMarkDelivered ? 'pedido-detail__btn-entregado--active' : ''} ${order.status === 'delivered' ? 'pedido-detail__btn-entregado--done' : ''}`}
              disabled={!canMarkDelivered || submitting}
            >
              {order.status === 'delivered'
                ? <><PiCheckBold size={16} />{t('orders.status.entregado')}</>
                : <><PiCheckCircleBold size={16} />{t('orders.detail.deliver')}</>
              }
            </button>
            {paymentError && (
              <span className="pedido-detail__top-bar-abono-error">{paymentError}</span>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OrderTopBar;
