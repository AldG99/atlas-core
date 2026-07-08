import { forwardRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Order } from '../../types/Order';
import { formatShortDate, getTotalPaid, formatPhone } from '../../utils/formatters';
import { getCountryCode } from '../../data/countryCodes';
import { useCurrency } from '../../hooks/useCurrency';
import './OrderCapture.scss';

interface OrderCaptureProps {
  order: Order;
  coverage: number[];
  phoneCountryCode?: string;
  downloadDate?: Date | null;
  businessName?: string;
}

const OrderCapture = forwardRef<HTMLDivElement, OrderCaptureProps>(
  ({ order, coverage, phoneCountryCode, downloadDate, businessName }, ref) => {
    const { t, i18n } = useTranslation();
    const { format } = useCurrency();
    const paid = getTotalPaid(order);
    const remaining = order.total - paid;
    const payments = useMemo(
      () => [...(order.payments || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      [order.payments]
    );

    const tel = phoneCountryCode
      ? `${getCountryCode(phoneCountryCode)?.code ?? ''} ${formatPhone(order.clientPhone)}`
      : formatPhone(order.clientPhone);

    return (
      <div ref={ref} className="pedido-captura">

        {/* Header */}
        <div className="pedido-captura__header">
          {businessName && (
            <div className="pedido-captura__negocio">{businessName}</div>
          )}
          {order.orderNumber && (
            <div className="pedido-captura__folio">{order.orderNumber}</div>
          )}
        </div>

        <hr className="pedido-captura__sep pedido-captura__sep--double" />

        {/* Info del cliente */}
        <div className="pedido-captura__info">
          <div className="pedido-captura__info-row">
            <span>{order.clientName}</span>
            <span className="pedido-captura__estado">
              {t(`orders.status.${order.status}`)}
            </span>
          </div>
          <div className="pedido-captura__info-row">
            <span>{tel}</span>
            <span>{formatShortDate(order.createdAt)}</span>
          </div>
        </div>

        <hr className="pedido-captura__sep pedido-captura__sep--dashed" />

        {/* Productos */}
        <div className="pedido-captura__section-title">{t('orders.capture.products')}</div>
        {order.items.map((p, idx) => {
          const covered = Math.min(coverage[idx] || 0, p.subtotal);
          const percentage = p.subtotal > 0 ? (covered / p.subtotal) * 100 : 0;
          const statusLabel =
            percentage >= 100
              ? t('orders.capture.statusPaid')
              : percentage > 0
                ? `${Math.round(percentage)}%`
                : t('orders.capture.statusPending');
          return (
            <div key={idx} className="pedido-captura__product">
              <div className="pedido-captura__product-name">
                {p.sku && <span className="pedido-captura__clave">[{p.sku}] </span>}
                {p.name}
                {p.discount ? ` (-${p.discount}%)` : ''}
              </div>
              <div className="pedido-captura__product-detail">
                <span>{p.quantity} × {format(p.unitPrice)}</span>
                <span>{format(p.subtotal)} · {statusLabel}</span>
              </div>
            </div>
          );
        })}

        <hr className="pedido-captura__sep pedido-captura__sep--double" />

        {/* Totales */}
        <div className="pedido-captura__total-block">
          <div className="pedido-captura__total-row">
            <span>{t('orders.capture.total')}</span>
            <span>{format(order.total)}</span>
          </div>
          <div className="pedido-captura__total-row">
            <span>{t('orders.capture.paid')}</span>
            <span>{format(paid)}</span>
          </div>
          <div className="pedido-captura__total-row pedido-captura__total-row--highlight">
            <span>{t('orders.capture.remaining')}</span>
            <span>{remaining <= 0 ? t('orders.capture.settled') : format(remaining)}</span>
          </div>
        </div>

        {/* Notas */}
        {order.notes && (
          <>
            <hr className="pedido-captura__sep pedido-captura__sep--dashed" />
            <div className="pedido-captura__section-title">{t('orders.capture.notes')}</div>
            <div className="pedido-captura__notas">{order.notes}</div>
          </>
        )}

        {/* Abonos */}
        {payments.length > 0 && (
          <>
            <hr className="pedido-captura__sep pedido-captura__sep--dashed" />
            <div className="pedido-captura__section-title">{t('orders.capture.payments')}</div>
            {payments.map((payment, i) => {
              const prod =
                typeof payment.itemIndex === 'number'
                  ? order.items[payment.itemIndex]
                  : undefined;
              const label = prod
                ? `${prod.sku ? `[${prod.sku}] ` : ''}${prod.name}`
                : t('orders.capture.general');
              return (
                <div key={i} className="pedido-captura__abono-row">
                  <span className="pedido-captura__abono-left">{label}</span>
                  <span className="pedido-captura__abono-right">
                    {format(payment.amount)}{'  '}{formatShortDate(payment.date)}
                  </span>
                </div>
              );
            })}
          </>
        )}

        <hr className="pedido-captura__sep pedido-captura__sep--double" />

        {/* Pie */}
        <div className="pedido-captura__footer">
          {downloadDate &&
            t('orders.capture.generatedOn', {
              date: downloadDate.toLocaleDateString(i18n.language, {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              }),
              time: downloadDate.toLocaleTimeString(i18n.language, {
                hour: '2-digit',
                minute: '2-digit',
              }),
            })}
        </div>

      </div>
    );
  }
);

OrderCapture.displayName = 'OrderCapture';
export default OrderCapture;
