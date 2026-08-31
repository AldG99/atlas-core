import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { X, DownloadCloud } from 'lucide-react';
import type { Product, DiscountHistory } from '../../types/Product';
import { isDiscountActive } from '../../utils/discount';
import { csvValue } from '../../utils/formatters';
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
      // Active discount — solo si la fecha de fin no ha pasado.
      if (isDiscountActive(product)) {
        result.push({
          sku: product.sku,
          name: product.name,
          percentage: product.discount!,
          endDate: product.discountEndDate!,
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
    const csv = [headers, ...csvRows]
      .map(row => row.map(csvValue).join(','))
      .join('\n');
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
              className="btn btn--secondary"
              onClick={handleExportCSV}
              disabled={rows.length === 0}
            >
              <DownloadCloud size={18} />
              {t('products.discountModal.export')}
            </button>
            <button className="modal__close" onClick={onClose}>
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="modal__body">
          {rows.length === 0 ? (
            <p className="history-modal__empty">{t('products.discountModal.empty')}</p>
          ) : (
            <div className="history-modal__table-wrapper">
              <table className="history-modal__table">
                <colgroup>
                  <col style={{ width: '13%' }} />
                  <col style={{ width: '24%' }} />
                  <col style={{ width: '13%' }} />
                  <col style={{ width: '16%' }} />
                  <col style={{ width: '16%' }} />
                  <col style={{ width: '18%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col">{t('products.table.code')}</th>
                    <th scope="col">{t('products.discountModal.table.product')}</th>
                    <th scope="col">{t('products.discountModal.table.discount')}</th>
                    <th scope="col">{t('products.discountModal.table.endDate')}</th>
                    <th scope="col">{t('products.discountModal.table.closeDate')}</th>
                    <th scope="col">{t('products.discountModal.table.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={`${row.sku}-${row.reason}-${row.closedAt?.getTime() ?? 'active'}-${idx}`}>
                      <td>
                        <span className="history-modal__sku" title={row.sku}>{row.sku}</span>
                      </td>
                      <td className="history-modal__name" title={row.name}>{row.name}</td>
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
