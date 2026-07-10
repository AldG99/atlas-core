import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PiArrowRightBold, PiMagnifyingGlassBold } from 'react-icons/pi';
import type { Order } from '../../types/Order';
import type { Product, Label } from '../../types/Product';
import { LABEL_ICONS } from '../../constants/labelIcons';
import { ROUTES } from '../../config/routes';

type DateFilter = 'todo' | 'semana' | 'mes' | '3meses';

interface Props {
  clientId: string;
  orders: Order[];
  ordersLoading: boolean;
  ordersError: boolean;
  productCatalog: Product[];
  allLabels: Label[];
  format: (n: number) => string;
}

const ClientOrderHistory: React.FC<Props> = ({
  clientId,
  orders,
  ordersLoading,
  ordersError,
  productCatalog,
  allLabels,
  format,
}) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('todo');
  const [focusedRow, setFocusedRow] = useState<number | null>(null);
  const tableBodyRef = useRef<HTMLDivElement>(null);

  const formatOrderDate = (date: Date) =>
    new Intl.DateTimeFormat(i18n.language, {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(date));

  const getLabelsForSku = (sku?: string): Label[] => {
    if (!sku) return [];
    const product = productCatalog.find(cp => cp.sku === sku);
    if (!product?.labels) return [];
    return product.labels
      .map(labelId => allLabels.find(l => l.id === labelId))
      .filter((l): l is Label => !!l);
  };

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(o =>
        o.items.some(item =>
          item.name.toLowerCase().includes(q) ||
          (item.sku && item.sku.toLowerCase().includes(q))
        )
      );
    }

    result = result.filter(o => o.status === 'delivered');

    if (dateFilter !== 'todo') {
      const now = new Date();
      let since: Date;
      switch (dateFilter) {
        case 'semana': since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
        case 'mes':    since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
        case '3meses': since = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break;
      }
      result = result.filter(o => new Date(o.createdAt) >= since!);
    }

    result.sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return result;
  }, [orders, searchTerm, dateFilter]);

  const accumulatedMap = useMemo(() => {
    const sorted = [...orders]
      .filter(o => o.status === 'delivered')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const map = new Map<string, number>();
    let accumulated = 0;
    sorted.forEach(o => {
      accumulated += o.total;
      map.set(o.id, accumulated);
    });
    return map;
  }, [orders]);

  useEffect(() => {
    if (!filteredOrders.length) return;
    const totalRows = filteredOrders.reduce((sum, o) => sum + o.items.length + 2, 0);

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (['input', 'select', 'textarea'].includes(tag)) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedRow(prev => prev === null ? 0 : Math.min(prev + 1, totalRows - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedRow(prev => prev === null ? 0 : Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && focusedRow !== null) {
        e.preventDefault();
        let ri = 0;
        for (const order of filteredOrders) {
          if (focusedRow === ri) {
            navigate(ROUTES.ORDER_DETAIL.replace(':id', order.id), { state: { from: `/clients/${clientId}` } });
            break;
          }
          ri += order.items.length + 2;
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [filteredOrders, focusedRow, navigate, clientId]);

  useEffect(() => {
    if (focusedRow === null || !tableBodyRef.current) return;
    const rows = tableBodyRef.current.querySelectorAll('tr');
    const row = rows[focusedRow];
    if (row) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [focusedRow]);

  const totalAccumulated = orders.filter(o => o.status === 'delivered').reduce((s, o) => s + o.total, 0);

  return (
    <div className="cliente-detail__main">
      {/* Filtros */}
      <div className="cliente-detail__pedidos-filters">
        <div className="cliente-detail__pedidos-search">
          <PiMagnifyingGlassBold size={16} />
          <input
            type="text"
            placeholder={t('clients.detail.searchPlaceholder')}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select value={dateFilter} onChange={e => setDateFilter(e.target.value as DateFilter)}>
          <option value="todo">{t('clients.detail.allTime')}</option>
          <option value="semana">{t('clients.detail.lastWeek')}</option>
          <option value="mes">{t('clients.detail.lastMonth')}</option>
          <option value="3meses">{t('clients.detail.last3Months')}</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="cliente-detail__pedidos-table-wrapper">
        <div className="cliente-detail__pedidos-table-head">
          <table className="cliente-detail__pedidos-table">
            <colgroup>
              <col style={{ width: '10%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '34%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '18%' }} />
              <col style={{ width: '18%' }} />
            </colgroup>
            <thead>
              <tr>
                <th>{t('clients.detail.historyTable.code')}</th>
                <th>{t('clients.detail.historyTable.quantity')}</th>
                <th>{t('clients.detail.historyTable.product')}</th>
                <th>{t('clients.detail.historyTable.labels')}</th>
                <th>{t('clients.detail.historyTable.amount')}</th>
                <th>{t('clients.detail.historyTable.accumulated')}</th>
              </tr>
            </thead>
          </table>
        </div>
        <div ref={tableBodyRef} className="cliente-detail__pedidos-table-body">
          <table className="cliente-detail__pedidos-table">
            <colgroup>
              <col style={{ width: '10%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '34%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '18%' }} />
              <col style={{ width: '18%' }} />
            </colgroup>
            <tbody>
              {ordersLoading ? (
                <tr>
                  <td colSpan={6} className="cliente-detail__pedidos-table-empty">{t('clients.detail.orderHistoryLoading')}</td>
                </tr>
              ) : ordersError ? (
                <tr>
                  <td colSpan={6} className="cliente-detail__pedidos-table-empty cliente-detail__pedidos-table-empty--error">{t('clients.detail.orderHistoryError')}</td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="cliente-detail__pedidos-table-empty">
                    {orders.length === 0 ? t('clients.detail.orderHistoryEmpty') : t('clients.detail.orderHistoryNotFound')}
                  </td>
                </tr>
              ) : (() => {
                let rowIdx = 0;
                return filteredOrders.map((order) => {
                  const dateIdx = rowIdx++;
                  const productIndices = order.items.map(() => rowIdx++);
                  const totalIdx = rowIdx++;
                  return (
                    <React.Fragment key={order.id}>
                      {/* Fila de fecha del pedido */}
                      <tr
                        className={`cliente-detail__pedidos-date-row${focusedRow === dateIdx ? ' cliente-detail__pedidos-date-row--focused' : ''}`}
                        onMouseEnter={() => setFocusedRow(dateIdx)}
                      >
                        <td colSpan={6}>
                          <div className="cliente-detail__pedidos-date-row-inner">
                            {order.orderNumber && (
                              <span className="cliente-detail__pedidos-folio">{order.orderNumber}</span>
                            )}
                            <span className="cliente-detail__pedidos-date-main">{formatOrderDate(order.createdAt)}</span>
                            {order.deliveredAt && (
                              <PiArrowRightBold size={12} className="cliente-detail__pedidos-date-arrow" />
                            )}
                            {order.deliveredAt && (
                              <span className="cliente-detail__pedidos-date-entrega">
                                {formatOrderDate(order.deliveredAt)}
                              </span>
                            )}
                            <button
                              className="cliente-detail__pedidos-detail-btn"
                              onClick={() => navigate(ROUTES.ORDER_DETAIL.replace(':id', order.id), { state: { from: `/clients/${clientId}` } })}
                              title={t('clients.detail.viewOrderDetail')}
                            >
                              <PiArrowRightBold size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Filas de productos */}
                      {order.items.map((item, i) => (
                        <tr
                          key={i}
                          className={`cliente-detail__pedidos-product-row${focusedRow === productIndices[i] ? ' cliente-detail__pedidos-product-row--focused' : ''}`}
                          onMouseEnter={() => setFocusedRow(productIndices[i])}
                        >
                          <td>
                            {item.sku
                              ? <span className="cliente-detail__clave">{item.sku}</span>
                              : '—'}
                          </td>
                          <td>{item.quantity}</td>
                          <td>{item.name}</td>
                          <td>
                            <div className="cliente-detail__pedidos-etiquetas">
                              {getLabelsForSku(item.sku).map(label => {
                                const iconData = LABEL_ICONS[label.icon];
                                const Icon = iconData?.icon;
                                return (
                                  <span key={label.id} className="cliente-detail__pedidos-etiqueta" style={{ backgroundColor: label.color }} title={label.name}>
                                    {Icon && <Icon size={12} />}
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                          <td>{format(item.subtotal)}</td>
                          <td />
                        </tr>
                      ))}
                      {/* Fila de total */}
                      <tr
                        className={`cliente-detail__pedidos-total-row${focusedRow === totalIdx ? ' cliente-detail__pedidos-total-row--focused' : ''}`}
                        onMouseEnter={() => setFocusedRow(totalIdx)}
                      >
                        <td colSpan={4} className="cliente-detail__pedidos-total-label">{t('clients.detail.historyTotal')}</td>
                        <td className="cliente-detail__pedidos-total-value">{format(order.total)}</td>
                        <td className="cliente-detail__pedidos-acumulado-value">{format(accumulatedMap.get(order.id) ?? 0)}</td>
                      </tr>
                    </React.Fragment>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
        <div className="cliente-detail__pedidos-table-total">
          <table className="cliente-detail__pedidos-table">
            <colgroup>
              <col style={{ width: '10%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '34%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '18%' }} />
              <col style={{ width: '18%' }} />
            </colgroup>
            <tfoot>
              <tr>
                <td colSpan={5} className="cliente-detail__pedidos-table-total-label">{t('clients.detail.historyAccumulated')}</td>
                <td className="cliente-detail__pedidos-table-total-value">{format(totalAccumulated)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClientOrderHistory;
