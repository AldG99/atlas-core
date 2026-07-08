import { useTranslation } from 'react-i18next';
import { PiCheckBold, PiXBold, PiPencilSimpleBold } from 'react-icons/pi';
import type { Payment, OrderItem, CreatedBy, OrderStatus } from '../../types/Order';
import { formatDate } from '../../utils/formatters';

interface Props {
  payments: Payment[];
  items: OrderItem[];
  focusedPaymentRow: number | null;
  editingPaymentId: string | null;
  editingPaymentValue: string;
  role: string;
  status: OrderStatus;
  archived: boolean;
  paymentScrollRef: React.RefObject<HTMLDivElement | null>;
  format: (n: number) => string;
  createdBy?: CreatedBy;
  deliveredBy?: CreatedBy;
  onRowClick: (index: number) => void;
  onEditStart: (id: string, amount: number) => void;
  onEditConfirm: (id: string) => void;
  onEditCancel: () => void;
  onEditValueChange: (value: string) => void;
}

const Colgroup = () => (
  <colgroup>
    <col style={{ width: '8%' }} />
    <col style={{ width: '27%' }} />
    <col style={{ width: '14%' }} />
    <col style={{ width: '6%' }} />
    <col style={{ width: '8%' }} />
    <col style={{ width: '17%' }} />
    <col style={{ width: '20%' }} />
  </colgroup>
);

const OrderPaymentsTable: React.FC<Props> = ({
  payments,
  items,
  focusedPaymentRow,
  editingPaymentId,
  editingPaymentValue,
  role,
  status,
  archived,
  paymentScrollRef,
  format,
  createdBy,
  deliveredBy,
  onRowClick,
  onEditStart,
  onEditConfirm,
  onEditCancel,
  onEditValueChange,
}) => {
  const { t } = useTranslation();
  const sorted = [...payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="pedido-detail__section pedido-detail__section--no-pad">
      <div className="pedido-detail__table-wrapper">
        {/* Header fijo */}
        <div className="pedido-detail__table-head">
          <table className="pedido-detail__abonos-table">
            <Colgroup />
            <thead>
              <tr>
                <th>{t('orders.detail.paymentsTable.code')}</th>
                <th>{t('orders.detail.paymentsTable.product')}</th>
                <th>{t('orders.detail.paymentsTable.amount')}</th>
                <th></th>
                <th></th>
                <th>{t('orders.detail.paymentsTable.by')}</th>
                <th>{t('orders.detail.paymentsTable.date')}</th>
              </tr>
            </thead>
          </table>
        </div>

        {/* Cuerpo scrolleable */}
        <div ref={paymentScrollRef} className="pedido-detail__table-scroll pedido-detail__table-scroll--fixed">
          <table className="pedido-detail__abonos-table">
            <Colgroup />
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="pedido-detail__abonos-empty">
                    {t('orders.detail.noPayments')}
                  </td>
                </tr>
              ) : (
                sorted.map((payment, i) => (
                  <tr
                    key={payment.id}
                    className={focusedPaymentRow === i ? 'pedido-detail__product-row--focused' : ''}
                    onClick={() => onRowClick(i)}
                  >
                    <td>
                      {typeof payment.itemIndex === 'number' && items[payment.itemIndex]?.sku ? (
                        <span className="pedido-detail__clave">
                          {items[payment.itemIndex].sku}
                        </span>
                      ) : '-'}
                    </td>
                    <td title={typeof payment.itemIndex === 'number' && items[payment.itemIndex] ? items[payment.itemIndex].name : undefined}>
                      {typeof payment.itemIndex === 'number' && items[payment.itemIndex] ? (
                        <span className="pedido-detail__abono-autor">{items[payment.itemIndex].name}</span>
                      ) : (
                        <span className="pedido-detail__general-label">{t('orders.detail.generalPayment')}</span>
                      )}
                    </td>
                    <td>
                      {editingPaymentId === payment.id ? (
                        <div className="pedido-detail__abono-edit" onClick={e => e.stopPropagation()}>
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
                          <button className="pedido-detail__abono-edit-confirm" onClick={() => onEditConfirm(payment.id)} title={t('common.confirm')}>
                            <PiCheckBold size={14} />
                          </button>
                          <button className="pedido-detail__abono-edit-cancel" onClick={onEditCancel} title={t('common.cancel')}>
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
                          className="pedido-detail__abono-editado"
                          title={`${format(payment.originalAmount)}${payment.editedAt ? ` · ${formatDate(payment.editedAt)}` : ''}`}
                        >
                          {t('common.edit')}
                        </span>
                      )}
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      {role === 'admin' && editingPaymentId !== payment.id && (
                        <button
                          className="pedido-detail__abono-edit-btn"
                          title={t('common.edit')}
                          disabled={status === 'delivered' || archived}
                          onClick={() => onEditStart(payment.id, payment.amount)}
                        >
                          <PiPencilSimpleBold size={14} />
                        </button>
                      )}
                    </td>
                    <td>
                      {payment.createdBy && (
                        <span className="pedido-detail__abono-autor" title={payment.createdBy.name}>
                          {payment.createdBy.name}
                        </span>
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

      {createdBy && (
        <div className="pedido-detail__creado-por-row">
          {t('orders.detail.createdBy')} <span>{createdBy.name}</span>
        </div>
      )}
      <hr className="pedido-detail__info-divider" />
      <div className="pedido-detail__creado-por-row">
        {t('orders.detail.deliveredBy')} <span>{deliveredBy ? deliveredBy.name : t('orders.detail.notDeliveredYet')}</span>
      </div>
    </div>
  );
};

export default OrderPaymentsTable;
