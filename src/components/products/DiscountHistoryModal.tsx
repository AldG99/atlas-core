import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PiXBold, PiDownloadSimpleBold } from 'react-icons/pi';
import type { Product, DiscountHistory } from '../../types/Product';
import './DiscountHistoryModal.scss';

interface DiscountHistoryModalProps {
  products: Product[];
  onClose: () => void;
}

type Reason = DiscountHistory['reason'] | 'active';

interface HistoryRow {
  sku: string;
  name: string;
  percentage: number;
  endDate: Date;
  closedAt: Date | null;
  reason: Reason;
}

const DiscountHistoryModal = ({ products, onClose }: DiscountHistoryModalProps) => {
  const { t, i18n } = useTranslation();

  const REASON_LABEL: Record<Reason, string> = {
    active: t('products.discountModal.statusActive'),
    cancelled: t('products.discountModal.statusCanceled'),
    expired: t('products.discountModal.statusExpired')
  };

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat(i18n.language, {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(date));

  const rows = useMemo<HistoryRow[]>(() => {
    const result: HistoryRow[] = [];

    for (const product of products) {
      // Active discount
      if (product.discount && product.discount > 0 && product.discountEndDate) {
        result.push({
          sku: product.sku,
          name: product.name,
          percentage: product.discount,
          endDate: product.discountEndDate,
          closedAt: null,
          reason: 'active'
        });
      }

      // Past discounts
      if (product.discountHistory?.length) {
        for (const entry of product.discountHistory) {
          result.push({
            sku: product.sku,
            name: product.name,
            percentage: entry.percentage,
            endDate: entry.endDate,
            closedAt: entry.closedAt,
            reason: entry.reason
          });
        }
      }
    }

    // Active first, then by closedAt descending
    result.sort((a, b) => {
      if (a.reason === 'active' && b.reason !== 'active') return -1;
      if (b.reason === 'active' && a.reason !== 'active') return 1;
      const dateA = a.closedAt ? new Date(a.closedAt).getTime() : 0;
      const dateB = b.closedAt ? new Date(b.closedAt).getTime() : 0;
      return dateB - dateA;
    });

    return result;
  }, [products]);

  const handleExportCSV = () => {
    const headers = [t('orders.code'), t('orders.product'), t('products.discountModal.table.discount'), t('products.discountModal.table.endDate'), t('products.discountModal.table.closeDate'), t('products.discountModal.table.status')];
    const csvRows = rows.map(r => [
      r.sku,
      r.name,
      `-${r.percentage}%`,
      formatDate(r.endDate),
      r.closedAt ? formatDate(r.closedAt) : '',
      REASON_LABEL[r.reason],
    ]);
    const csv = [headers, ...csvRows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `discounts_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--large history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>{t('products.discountModal.title')}</h2>
          <div className="modal__header-actions">
            <button
              className="btn btn--secondary btn--sm"
              onClick={handleExportCSV}
              disabled={rows.length === 0}
            >
              <PiDownloadSimpleBold size={15} />
              {t('products.discountModal.export')}
            </button>
            <button className="modal__close" onClick={onClose}>
              <PiXBold size={24} />
            </button>
          </div>
        </div>

        <div className="modal__body">
          {rows.length === 0 ? (
            <p className="history-modal__empty">{t('products.discountModal.empty')}</p>
          ) : (
            <div className="history-modal__table-wrapper">
              <table className="history-modal__table">
                <thead>
                  <tr>
                    <th>{t('products.discountModal.table.product')}</th>
                    <th>{t('products.discountModal.table.discount')}</th>
                    <th>{t('products.discountModal.table.endDate')}</th>
                    <th>{t('products.discountModal.table.closeDate')}</th>
                    <th>{t('products.discountModal.table.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={idx}>
                      <td>
                        <span className="history-modal__sku">{row.sku}</span>
                        <span className="history-modal__name">{row.name}</span>
                      </td>
                      <td className="history-modal__percentage">-{row.percentage}%</td>
                      <td>{formatDate(row.endDate)}</td>
                      <td>{row.closedAt ? formatDate(row.closedAt) : '—'}</td>
                      <td>
                        <span className={`history-modal__reason history-modal__reason--${row.reason}`}>
                          {REASON_LABEL[row.reason]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiscountHistoryModal;
