import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { OrderItem } from '../../types/Order';
import type { Product, Label } from '../../types/Product';
import { LABEL_ICONS } from '../../constants/labelIcons';

interface Props {
  items: OrderItem[];
  coverage: number[];
  focusedRow: number | null;
  tableScrollRef: React.RefObject<HTMLDivElement | null>;
  format: (n: number) => string;
  paid: number;
  total: number;
  productCatalog: Product[];
  allLabels: Label[];
  onRowClick: (index: number) => void;
}

const Colgroup = () => (
  <colgroup>
    <col style={{ width: '7%' }} />   {/* Clave */}
    <col style={{ width: '6%' }} />   {/* Cant. */}
    <col style={{ width: '15%' }} />  {/* Producto */}
    <col style={{ width: '8%' }} />   {/* Etiquetas */}
    <col style={{ width: '12%' }} />  {/* Precio */}
    <col style={{ width: '11%' }} />  {/* Abonado */}
    <col style={{ width: '17%' }} />  {/* Subtotal */}
    <col style={{ width: '12%' }} />  {/* Ganancia */}
    <col style={{ width: '12%' }} />  {/* Estado */}
  </colgroup>
);

const itemProfit = (p: OrderItem): number | undefined =>
  p.unitCost !== undefined ? (p.unitPrice - p.unitCost) * p.quantity : undefined;

const OrderItemsTable: React.FC<Props> = ({
  items,
  coverage,
  focusedRow,
  tableScrollRef,
  format,
  paid,
  total,
  productCatalog,
  allLabels,
  onRowClick,
}) => {
  const { t } = useTranslation();
  const totalProfit = items.reduce((sum, p) => sum + (itemProfit(p) ?? 0), 0);
  const hasIncompleteCost = items.some(p => p.unitCost === undefined);
  const labelsBySku = useMemo(() => {
    const map = new Map<string, Label[]>();
    for (const cp of productCatalog) {
      if (!cp.sku || !cp.labels?.length) continue;
      map.set(cp.sku, cp.labels
        .map(labelId => allLabels.find(l => l.id === labelId))
        .filter((l): l is Label => !!l));
    }
    return map;
  }, [productCatalog, allLabels]);

  const getLabelsForSku = (sku?: string): Label[] =>
    sku ? (labelsBySku.get(sku) ?? []) : [];

  return (
    <div className="order-detail__section order-detail__section--grow">
      <div className="order-detail__table-wrapper">
        {/* Header fijo */}
        <div className="order-detail__table-head">
          <table className="order-detail__products-table">
            <Colgroup />
            <thead>
              <tr>
                <th>{t('orders.code')}</th>
                <th>{t('orders.quantity')}</th>
                <th>{t('orders.product')}</th>
                <th>{t('orders.labels')}</th>
                <th>{t('orders.price')}</th>
                <th>{t('orders.paid')}</th>
                <th className="order-detail__col--right">{t('orders.subtotal')}</th>
                <th className="order-detail__col--right">{t('orders.detail.profit')}</th>
                <th>{t('orders.status_col')}</th>
              </tr>
            </thead>
          </table>
        </div>

        {/* Cuerpo scrolleable */}
        <div ref={tableScrollRef} className="order-detail__table-scroll order-detail__table-scroll--grow">
          <table className="order-detail__products-table">
            <Colgroup />
            <tbody>
              {items.map((p, index) => {
                const covered = Math.min(coverage[index] || 0, p.subtotal);
                const percentage = p.subtotal > 0 ? (covered / p.subtotal) * 100 : 0;
                const status = percentage >= 100 ? 'paid' : percentage > 0 ? 'partial' : 'pending';
                const profit = itemProfit(p);
                return (
                  <tr
                    key={index}
                    className={`order-detail__product-row--${status}${focusedRow === index ? ' order-detail__product-row--focused' : ''}`}
                    onClick={() => onRowClick(index)}
                  >
                    <td>
                      {p.sku ? <span className="order-detail__sku">{p.sku}</span> : '-'}
                    </td>
                    <td>{p.quantity}</td>
                    <td title={p.name}>
                      <span className="order-detail__product-name">{p.name}</span>
                    </td>
                    <td>
                      <div className="order-detail__labels">
                        {getLabelsForSku(p.sku).map(label => {
                          const iconData = LABEL_ICONS[label.icon];
                          const Icon = iconData?.icon;
                          return (
                            <span key={label.id} className="order-detail__label" style={{ backgroundColor: label.color }} title={label.name}>
                              {Icon && <Icon size={12} />}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td>
                      {p.originalPrice && p.discount ? (
                        <div className="order-detail__product-subtotal-discount">
                          <span className="order-detail__product-subtotal-original">{format(p.originalPrice)}</span>
                          <span>{format(p.unitPrice)}</span>
                        </div>
                      ) : (
                        format(p.unitPrice)
                      )}
                    </td>
                    <td>
                      <div className="order-detail__product-paid-cell">
                        <span>{format(covered)}</span>
                      </div>
                    </td>
                    <td className="order-detail__col--right">
                      {p.originalPrice && p.discount ? (
                        <div className="order-detail__product-subtotal-discount">
                          <span className="order-detail__product-discount-badge">-{p.discount}%</span>
                          <span className="order-detail__product-subtotal-original">{format(p.originalPrice * p.quantity)}</span>
                          <span>{format(p.subtotal)}</span>
                        </div>
                      ) : (
                        format(p.subtotal)
                      )}
                    </td>
                    <td className="order-detail__col--right">
                      {profit !== undefined ? (
                        <span className="order-detail__product-profit">{format(profit)}</span>
                      ) : (
                        <span className="order-detail__product-profit order-detail__product-profit--unknown" title={t('orders.detail.profitUnknownHint')}>—</span>
                      )}
                    </td>
                    <td>
                      <span className={`order-detail__product-status order-detail__product-status--${status}`}>
                        {status === 'paid' ? t('orders.detail.statusPaid') : status === 'partial' ? `${Math.round(percentage)}%` : t('orders.detail.statusPending')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pie fijo (total) */}
        <div className="order-detail__table-foot">
          <table className="order-detail__products-table">
            <Colgroup />
            <tfoot className="order-detail__products-tfoot">
              <tr className="order-detail__product-total-row">
                <td><strong>{t('common.total')}</strong></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td>
                  <div className="order-detail__product-paid-cell">
                    <strong>{format(paid)}</strong>
                  </div>
                </td>
                <td><strong>{format(total)}</strong></td>
                <td>
                  <strong className="order-detail__product-profit">{format(totalProfit)}</strong>
                  {hasIncompleteCost && (
                    <span className="order-detail__product-profit-warning" title={t('orders.detail.profitUnknownHint')}>*</span>
                  )}
                </td>
                <td>
                  <strong className={
                    paid >= total
                      ? 'order-detail__product-status--paid'
                      : paid > 0
                        ? 'order-detail__product-status--partial'
                        : 'order-detail__product-status--pending'
                  }>
                    {paid >= total ? t('orders.detail.statusLiquidated') : format(total - paid)}
                  </strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrderItemsTable;
