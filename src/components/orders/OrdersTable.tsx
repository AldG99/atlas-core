import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Star, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';

const PAGE_SIZE = 50;
import type { Order } from '../../types/Order';
import type { Client } from '../../types/Client';
import { ORDER_STATUS_COLORS } from '../../constants/orderStatus';
import { formatShortDate, formatPhone, getTotalPaid } from '../../utils/formatters';
import { getCountryCode } from '../../data/countryCodes';
import { useClients } from '../../hooks/useClients';
import { useCurrency } from '../../hooks/useCurrency';
import './OrdersTable.scss';

// Gris neutro ($color-gray-400, "íconos/placeholders") para el ícono de
// estado cuando la tabla está en modo `muted` — evita el mismo verde de
// $color-success que en la vista activa comunica "entregado".
const STATUS_COLOR_MUTED = '#ada9a1';

interface OrdersTableProps {
  orders: Order[];
  loading?: boolean;
  error?: string | null;
  searchTerm?: string;
  // Vista de solo lectura (p. ej. Archivados): apaga el verde de "abonado"/"total"
  // saldado y del ícono de estado "entregado" a un gris neutro, ya que ahí no
  // comunican una acción pendiente como en el Dashboard.
  muted?: boolean;
}

const OrdersTable = ({ orders, loading, error, searchTerm, muted = false }: OrdersTableProps) => {
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

  const getClientFavorite = (order: Order): boolean => {
    return clientMap.get(order.clientPhone)?.favorite ?? false;
  };

  const getClientPhoneCountryCode = (order: Order): string | undefined => {
    return clientMap.get(order.clientPhone)?.phoneCountryCode;
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
    <div className="orders-table-wrapper">
      <div className="orders-table-header">
        <table className="orders-table">
          <colgroup>
            <col style={{ width: '20%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '7%' }} />
            <col style={{ width: '12%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>{t('orders.table.client')}</th>
              <th>{t('clients.table.phone')}</th>
              <th>{t('orders.table.folio')}</th>
              <th>{t('orders.paid')}</th>
              <th>{t('orders.table.total')}</th>
              <th>{t('orders.table.status')}</th>
              <th>{t('orders.table.date')}</th>
            </tr>
          </thead>
        </table>
      </div>
      <div ref={tableContainerRef} className="orders-table-container">
        <table className={`orders-table${muted ? ' orders-table--muted' : ''}`}>
          <colgroup>
            <col style={{ width: '20%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '7%' }} />
            <col style={{ width: '12%' }} />
          </colgroup>
          <tbody>
          {loading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <tr key={i} className="orders-table__skeleton-row">
                <td><span className="orders-table__skeleton orders-table__skeleton--name" /></td>
                <td><span className="orders-table__skeleton orders-table__skeleton--short" /></td>
                <td><span className="orders-table__skeleton orders-table__skeleton--order-number" /></td>
                <td style={{ textAlign: 'right' }}><span className="orders-table__skeleton orders-table__skeleton--medium" /></td>
                <td style={{ textAlign: 'right' }}><span className="orders-table__skeleton orders-table__skeleton--medium" /></td>
                <td style={{ textAlign: 'center' }}><span className="orders-table__skeleton orders-table__skeleton--status" /></td>
                <td style={{ textAlign: 'right' }}><span className="orders-table__skeleton orders-table__skeleton--medium" /></td>
              </tr>
            ))
          ) : error ? (
            <tr>
              <td colSpan={7} className="orders-table__empty orders-table__empty--error">
                {error}
              </td>
            </tr>
          ) : orders.length === 0 ? (
            <tr>
              <td colSpan={7} className="orders-table__empty">
                {searchTerm?.trim() ? t('orders.table.emptySearch', { term: searchTerm }) : t('orders.table.empty')}
              </td>
            </tr>
          ) : paginatedOrders.map((order, index) => {
            const favorite = getClientFavorite(order);
            return (
            <tr
              key={order.id}
              className={`orders-table__row${focusedRow === index ? ' orders-table__row--focused' : ''}`}
              onClick={() => navigate(`/orders/${order.id}`, { state: { from: location.pathname } })}
              onMouseEnter={() => setFocusedRow(index)}
            >
              <td>
                <div className="orders-table__client">
                  <span className="orders-table__name" title={order.clientName}>
                    {order.clientName}
                  </span>
                  {favorite && <Star fill="currentColor" size={14} className="orders-table__fav-icon" />}
                </div>
              </td>
              <td>
                {(() => {
                  const phoneCountryCode = getClientPhoneCountryCode(order);
                  return (
                    <span className="orders-table__phone">
                      {phoneCountryCode
                        ? `${getCountryCode(phoneCountryCode)?.code ?? ''} ${formatPhone(order.clientPhone)}`
                        : formatPhone(order.clientPhone)}
                    </span>
                  );
                })()}
              </td>
              <td>
                <span className="orders-table__order-number">
                  {order.orderNumber || '-'}
                </span>
              </td>
              <td>
                {(() => {
                  const paid = getTotalPaid(order);
                  const percentage = order.total > 0 ? Math.round((paid / order.total) * 100) : 0;
                  const status = paid >= order.total ? 'paid' : paid > 0 ? 'partial' : 'pending';
                  return (
                    <div className={`orders-table__paid orders-table__paid--${status}`}>
                      <span className="orders-table__paid-amount">{format(paid)}</span>
                      <span className="orders-table__paid-percent">{percentage}%</span>
                    </div>
                  );
                })()}
              </td>
              <td>
                {(() => {
                  const paid = getTotalPaid(order);
                  const totalClass = paid >= order.total
                    ? 'orders-table__total--paid'
                    : paid > 0
                      ? 'orders-table__total--pending'
                      : '';
                  return (
                    <span className={`orders-table__total ${totalClass}`}>
                      {format(order.total)}
                    </span>
                  );
                })()}
              </td>
              <td>
                <ShoppingBag
                  size={18}
                  style={{ color: muted ? STATUS_COLOR_MUTED : ORDER_STATUS_COLORS[order.status], display: 'block', margin: '0 auto' }}
                  aria-hidden="true"
                />
                <span className="sr-only">{t(`orders.status.${order.status}`)}</span>
              </td>
              <td>
                <span className="orders-table__date">{formatShortDate(order.createdAt)}</span>
              </td>
            </tr>
            );
          })}
        </tbody>
        </table>
      </div>

      {!loading && (
        <div className="orders-table__pagination">
          <span className="orders-table__page-info orders-table__page-info--total">
            {orders.length === 0
              ? `0 ${t('nav.orders').toLowerCase()}`
              : `${page * PAGE_SIZE + 1}-${Math.min((page + 1) * PAGE_SIZE, orders.length)} ${t('common.of')} ${orders.length} ${t('nav.orders').toLowerCase()}`}
          </span>
          <button
            className="orders-table__page-btn"
            onClick={() => { setPage(p => p - 1); setFocusedRow(null); }}
            disabled={page === 0}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            className="orders-table__page-btn"
            onClick={() => { setPage(p => p + 1); setFocusedRow(null); }}
            disabled={page >= totalPages - 1}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default OrdersTable;
