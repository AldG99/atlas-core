import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Order, OrderStatus } from '../../types/Order';
import { ORDER_STATUS_COLORS } from '../../constants/orderStatus';
import { buildOrderMessage, openWhatsApp, copyToClipboard } from '../../utils/formatters';
import { useCurrency } from '../../hooks/useCurrency';
import { useAuth } from '../../hooks/useAuth';
import { DEFAULT_TEMPLATES } from '../../types/User';
import './OrderCard.scss';

interface OrderCardProps {
  order: Order;
  onChangeStatus: (id: string, status: OrderStatus) => void;
  onDelete: (id: string) => void;
  onArchive?: (id: string) => void;
  onRestore?: (id: string) => void;
  isArchived?: boolean;
}

const OrderCard = ({ order, onChangeStatus, onDelete, onArchive, onRestore, isArchived = false }: OrderCardProps) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const statusOptions: OrderStatus[] = ['pending', 'preparing', 'delivered'];
  const { format, symbol } = useCurrency();
  const { user } = useAuth();

  const getMessage = () =>
    buildOrderMessage(order, user?.templates ?? DEFAULT_TEMPLATES, symbol, user?.businessName ?? '');

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(undefined, {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(getMessage());
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsApp = () => {
    openWhatsApp(order.clientPhone, getMessage());
  };

  return (
    <div className="pedido-card">
      <div className="pedido-card__header">
        <div className="pedido-card__client">
          <h3 className="pedido-card__name">{order.clientName}</h3>
          <span className="pedido-card__phone">{order.clientPhone}</span>
        </div>
        <span
          className="pedido-card__status"
          style={{ backgroundColor: ORDER_STATUS_COLORS[order.status] }}
        >
          {t(`orders.status.${order.status}`)}
        </span>
      </div>

      <div className="pedido-card__body">
        <div className="pedido-card__products">
          <strong>{t('orders.products')}:</strong>
          <p>{order.items.map(p => `${p.quantity}x ${p.name}`).join(', ')}</p>
        </div>

        {order.notes && (
          <div className="pedido-card__notes">
            <strong>{t('orders.notes')}:</strong>
            <p>{order.notes}</p>
          </div>
        )}

        <div className="pedido-card__total">
          <span>{t('common.total')}:</span>
          <strong>{format(order.total)}</strong>
        </div>
      </div>

      <div className="pedido-card__whatsapp">
        <button onClick={handleCopy} className="btn btn--outline">
          {copied ? t('orders.detail.copied') : t('orders.detail.copy')}
        </button>
        <button onClick={handleWhatsApp} className="btn btn--whatsapp">
          WhatsApp
        </button>
      </div>

      <div className="pedido-card__footer">
        <span className="pedido-card__date">{formatDate(order.createdAt)}</span>

        <div className="pedido-card__actions">
          {!isArchived && (
            <>
              <select
                value={order.status}
                onChange={(e) => onChangeStatus(order.id, e.target.value as OrderStatus)}
                className="pedido-card__select"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {t(`orders.status.${status}`)}
                  </option>
                ))}
              </select>

              {onArchive && (
                <button
                  onClick={() => onArchive(order.id)}
                  className="btn btn--secondary"
                >
                  {t('nav.archived')}
                </button>
              )}

              <button
                onClick={() => onDelete(order.id)}
                className="btn btn--danger"
              >
                {t('common.delete')}
              </button>
            </>
          )}

          {isArchived && onRestore && (
            <>
              <button
                onClick={() => onRestore(order.id)}
                className="btn btn--primary"
              >
                {t('archive.restore')}
              </button>
              <button
                onClick={() => onDelete(order.id)}
                className="btn btn--danger"
              >
                {t('common.delete')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
