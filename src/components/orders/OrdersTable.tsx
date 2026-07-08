import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PiStarFill, PiCaretLeftBold, PiCaretRightBold, PiShoppingBagBold } from 'react-icons/pi';

const PAGE_SIZE = 20;
import type { Order } from '../../types/Order';
import type { Client } from '../../types/Client';
import { ORDER_STATUS_COLORS } from '../../constants/orderStatus';
import { formatShortDate, getTotalPaid } from '../../utils/formatters';
import { useClients } from '../../hooks/useClients';
import { useCurrency } from '../../hooks/useCurrency';
import Avatar from '../ui/Avatar';
import './OrdersTable.scss';

interface OrdersTableProps {
  orders: Order[];
  loading?: boolean;
  error?: string | null;
  searchTerm?: string;
}

const OrdersTable = ({ orders, loading, error, searchTerm }: OrdersTableProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { clients } = useClients();
  const { format } = useCurrency();
  const [focusedRow, setFocusedRow] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [prevOrders, setPrevOrders] = useState(orders);

  if (prevOrders !== orders) {
    setPrevOrders(orders);
    if (page !== 0) setPage(0);
    if (focusedRow !== null) setFocusedRow(null);
  }

  const totalPages = Math.ceil(orders.length / PAGE_SIZE);
  const paginatedOrders = orders.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const clientMap = useMemo(() => {
    const map = new Map<string, Client>();
    for (const client of clients) {
      map.set(client.phone, client);
    }
    return map;
  }, [clients]);

  const getClientPhoto = (order: Order): string | undefined => {
    if (order.clientPhoto) return order.clientPhoto;
    return clientMap.get(order.clientPhone)?.profilePhoto;
  };

  const getClientFavorite = (order: Order): boolean => {
    return clientMap.get(order.clientPhone)?.favorite ?? false;
  };

  useEffect(() => {
    if (!paginatedOrders.length) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (['input', 'select', 'textarea'].includes(tag)) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedRow(prev => prev === null ? 0 : Math.min(prev + 1, paginatedOrders.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedRow(prev => prev === null ? 0 : Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && focusedRow !== null) {
        e.preventDefault();
        navigate(`/orders/${paginatedOrders[focusedRow].id}`, { state: { from: location.pathname } });
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [paginatedOrders, focusedRow, navigate, location.pathname]);

  useEffect(() => {
    if (focusedRow === null || !tableContainerRef.current) return;
    const rows = tableContainerRef.current.querySelectorAll('tr');
    const row = rows[focusedRow];
    if (row) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [focusedRow]);

  return (
    <div className="pedidos-table-wrapper">
      <div className="pedidos-table-header">
        <table className="pedidos-table">
          <colgroup>
            <col style={{ width: '20%' }} />
            <col style={{ width: '7%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '6%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '7%' }} />
            <col style={{ width: '12%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>{t('orders.table.client')}</th>
              <th>{t('clients.table.postal')}</th>
              <th>{t('orders.table.folio')}</th>
              <th>{t('orders.table.products')}</th>
              <th>{t('orders.paid')}</th>
              <th>{t('orders.table.total')}</th>
              <th>{t('orders.table.status')}</th>
              <th>{t('orders.table.date')}</th>
            </tr>
          </thead>
        </table>
      </div>
      <div ref={tableContainerRef} className="pedidos-table-container">
        <table className="pedidos-table">
          <colgroup>
            <col style={{ width: '20%' }} />
            <col style={{ width: '7%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '6%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '7%' }} />
            <col style={{ width: '12%' }} />
          </colgroup>
          <tbody>
          {loading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <tr key={i} className="pedidos-table__skeleton-row">
                <td><span className="pedidos-table__skeleton pedidos-table__skeleton--name" /></td>
                <td><span className="pedidos-table__skeleton pedidos-table__skeleton--short" /></td>
                <td><span className="pedidos-table__skeleton pedidos-table__skeleton--folio" /></td>
                <td style={{ textAlign: 'center' }}><span className="pedidos-table__skeleton pedidos-table__skeleton--short" /></td>
                <td style={{ textAlign: 'right' }}><span className="pedidos-table__skeleton pedidos-table__skeleton--medium" /></td>
                <td style={{ textAlign: 'right' }}><span className="pedidos-table__skeleton pedidos-table__skeleton--medium" /></td>
                <td style={{ textAlign: 'center' }}><span className="pedidos-table__skeleton pedidos-table__skeleton--status" /></td>
                <td><span className="pedidos-table__skeleton pedidos-table__skeleton--medium" /></td>
              </tr>
            ))
          ) : error ? (
            <tr>
              <td colSpan={8} className="pedidos-table__empty pedidos-table__empty--error">
                {error}
              </td>
            </tr>
          ) : orders.length === 0 ? (
            <tr>
              <td colSpan={8} className="pedidos-table__empty">
                {searchTerm?.trim() ? t('orders.table.emptySearch', { term: searchTerm }) : t('orders.table.empty')}
              </td>
            </tr>
          ) : paginatedOrders.map((order, index) => {
            const photo = getClientPhoto(order);
            const favorite = getClientFavorite(order);
            return (
            <tr
              key={order.id}
              className={`pedidos-table__row${focusedRow === index ? ' pedidos-table__row--focused' : ''}`}
              onClick={() => navigate(`/orders/${order.id}`, { state: { from: location.pathname } })}
              onMouseEnter={() => setFocusedRow(index)}
            >
              <td>
                <div className="pedidos-table__client">
                  <div className="pedidos-table__avatar">
                    <Avatar
                      src={photo}
                      initials={(() => { const c = clientMap.get(order.clientPhone); return c ? `${c.firstName[0]}${c.lastName?.[0] ?? ''}`.toUpperCase() : order.clientName[0].toUpperCase(); })()}
                      alt={order.clientName}
                    />
                  </div>
                  <span className="pedidos-table__name" title={order.clientName}>
                    {order.clientName}
                  </span>
                  {favorite && <PiStarFill size={14} className="pedidos-table__fav-icon" />}
                </div>
              </td>
              <td>
                <span className="pedidos-table__cp">{order.clientPostalCode || '-'}</span>
              </td>
              <td>
                <span className="pedidos-table__folio">
                  {order.orderNumber || '-'}
                </span>
              </td>
              <td>
                <div className="pedidos-table__product-cell">
                  <span className="pedidos-table__product-count">
                    {order.items.reduce((sum, p) => sum + p.quantity, 0)}
                  </span>
                  {order.items.some(p => p.discount && p.discount > 0) && (
                    <span className="pedidos-table__discount-indicator" title="Incluye descuento">%</span>
                  )}
                </div>
              </td>
              <td>
                {(() => {
                  const paid = getTotalPaid(order);
                  const percentage = order.total > 0 ? Math.round((paid / order.total) * 100) : 0;
                  const status = paid >= order.total ? 'paid' : paid > 0 ? 'partial' : 'pending';
                  return (
                    <div className={`pedidos-table__paid pedidos-table__paid--${status}`}>
                      <span className="pedidos-table__paid-amount">{format(paid)}</span>
                      <span className="pedidos-table__paid-percent">{percentage}%</span>
                    </div>
                  );
                })()}
              </td>
              <td>
                {(() => {
                  const paid = getTotalPaid(order);
                  const totalClass = paid >= order.total
                    ? 'pedidos-table__total--paid'
                    : paid > 0
                      ? 'pedidos-table__total--pending'
                      : '';
                  return (
                    <span className={`pedidos-table__total ${totalClass}`}>
                      {format(order.total)}
                    </span>
                  );
                })()}
              </td>
              <td>
                <PiShoppingBagBold
                  size={18}
                  style={{ color: ORDER_STATUS_COLORS[order.status], display: 'block', margin: '0 auto' }}
                  aria-hidden="true"
                />
                <span className="sr-only">{t(`orders.status.${order.status}`)}</span>
              </td>
              <td>
                <span className="pedidos-table__date">{formatShortDate(order.createdAt)}</span>
              </td>
            </tr>
            );
          })}
        </tbody>
        </table>
      </div>

      {!loading && (
        <div className="pedidos-table__pagination">
          <span className="pedidos-table__page-info pedidos-table__page-info--total">
            {orders.length} {t('nav.orders').toLowerCase()}
          </span>
          {totalPages > 1 && (
            <>
              <button
                className="pedidos-table__page-btn"
                onClick={() => { setPage(p => p - 1); setFocusedRow(null); }}
                disabled={page === 0}
              >
                <PiCaretLeftBold size={14} />
              </button>
              <span className="pedidos-table__page-info">
                {page + 1} / {totalPages}
              </span>
              <button
                className="pedidos-table__page-btn"
                onClick={() => { setPage(p => p + 1); setFocusedRow(null); }}
                disabled={page === totalPages - 1}
              >
                <PiCaretRightBold size={14} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default OrdersTable;
