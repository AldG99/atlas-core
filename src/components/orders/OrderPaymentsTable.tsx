import { useTranslation } from 'react-i18next';
import { PiCheckBold, PiXBold, PiPencilSimpleBold } from 'react-icons/pi';
import type { Payment, OrderItem, OrderStatus } from '../../types/Order';
import { formatDate } from '../../utils/formatters';

interface Props {
  payments: Payment[];
  items: OrderItem[];
  focusedPaymentRow: number | null;
  editingPaymentId: string | null;
  editingPaymentValue: string;
  status: OrderStatus;
  archived: boolean;
  paymentScrollRef: React.RefObject<HTMLDivElement | null>;
  format: (n: number) => string;
  onRowClick: (index: number) => void;
  onEditStart: (id: string, amount: number) => void;
  onEditConfirm: (id: string) => void;
  onEditCancel: () => void;
  onEditValueChange: (value: string) => void;
}

const Colgroup = () => (
  <colgroup>
    <col style={{ width: '8%' }} />
    <col style={{ width: '30%' }} />
    <col style={{ width: '15%' }} />
    <col style={{ width: '7%' }} />
    <col style={{ width: '10%' }} />
    <col style={{ width: '30%' }} />
  </colgroup>
);

const OrderPaymentsTable: React.FC<Props> = ({
  payments,
  items,
  focusedPaymentRow,
  editingPaymentId,
  editingPaymentValue,
  status,
  archived,
  paymentScrollRef,
  format,
  onRowClick,
  onEditStart,
  onEditConfirm,
  onEditCancel,
  onEditValueChange,
}) => {
  const { t } = useTranslation();
  const sorted = [...payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="order-detail__section order-detail__section--no-pad">
      <div className="order-detail__table-wrapper">
        {/* Header fijo */}
        <div className="order-detail__table-head">
          <table className="order-detail__payments-table">
            <Colgroup />
            <thead>
              <tr>
                <th>{t('orders.detail.paymentsTable.code')}</th>
                <th>{t('orders.detail.paymentsTable.product')}</th>
                <th>{t('orders.detail.paymentsTable.amount')}</th>
                <th></th>
                <th></th>
                <th>{t('orders.detail.paymentsTable.date')}</th>
              </tr>
            </thead>
          </table>
        </div>

        {/* Cuerpo scrolleable */}
        <div ref={paymentScrollRef} className="order-detail__table-scroll order-detail__table-scroll--fixed">
          <table className="order-detail__payments-table">
            <Colgroup />
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="order-detail__payments-empty">
                    {t('orders.detail.noPayments')}
                  </td>
                </tr>
              ) : (
                sorted.map((payment, i) => (
                  <tr
                    key={payment.id}
                    className={focusedPaymentRow === i ? 'order-detail__product-row--focused' : ''}
                    onClick={() => onRowClick(i)}
                  >
                    <td>
                      {typeof payment.itemIndex === 'number' && items[payment.itemIndex]?.sku ? (
                        <span className="order-detail__sku">
                          {items[payment.itemIndex].sku}
                        </span>
                      ) : '-'}
                    </td>
                    <td title={typeof payment.itemIndex === 'number' && items[payment.itemIndex] ? items[payment.itemIndex].name : undefined}>
                      {typeof payment.itemIndex === 'number' && items[payment.itemIndex] ? (
                        <span className="order-detail__payment-author">{items[payment.itemIndex].name}</span>
                      ) : (
                        <span className="order-detail__general-label">{t('orders.detail.generalPayment')}</span>
                      )}
                    </td>
                    <td>
                      {editingPaymentId === payment.id ? (
                        <div className="order-detail__payment-edit" onClick={e => e.stopPropagation()}>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            autoFocus
                            value={editingPaymentValue}
                            onChange={e => onEditValueChange(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') onEditConfirm(payment.id);
                              if (e.key === 'Escape') onEditCancel();
                            }}
                          />
                          <button className="order-detail__payment-edit-confirm" onClick={() => onEditConfirm(payment.id)} title={t('common.confirm')}>
                            <PiCheckBold size={14} />
                          </button>
                          <button className="order-detail__payment-edit-cancel" onClick={onEditCancel} title={t('common.cancel')}>
                            <PiXBold size={14} />
                          </button>
                        </div>
                      ) : (
                        <span>{format(payment.amount)}</span>
                      )}
                    </td>
                    <td>
                      {payment.originalAmount && (
                        <span
                          className="order-detail__payment-edited"
                          title={`${format(payment.originalAmount)}${payment.editedAt ? ` · ${formatDate(payment.editedAt)}` : ''}`}
                        >
                          {t('common.edit')}
                        </span>
                      )}
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      {editingPaymentId !== payment.id && (
                        <button
                          className="order-detail__payment-edit-btn"
                          title={t('common.edit')}
                          disabled={status === 'delivered' || archived}
                          onClick={() => onEditStart(payment.id, payment.amount)}
                        >
                          <PiPencilSimpleBold size={14} />
                        </button>
                      )}
                    </td>
                    <td>{formatDate(payment.date)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrderPaymentsTable;
