import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { QueryDocumentSnapshot } from 'firebase/firestore';
import { PiMagnifyingGlassBold, PiDownloadSimpleBold } from 'react-icons/pi';
import type { Order } from '../types/Order';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useClients } from '../hooks/useClients';
import { getCountryCode } from '../data/countryCodes';
import { getArchivedOrders } from '../services/orderService';
import { exportToCSV } from '../utils/formatters';
import MainLayout from '../layouts/MainLayout';
import OrdersTable from '../components/orders/OrdersTable';
import './Archive.scss';

type SortOption = 'date_desc' | 'date_asc' | 'total_desc' | 'total_asc' | 'name_asc';
type DateFilter = 'all' | 'week' | 'month' | 'quarter';

const Archive = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { clients } = useClients();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const lastDocRef = useRef<QueryDocumentSnapshot | null>(null);

  const SORT_OPTIONS: Record<SortOption, string> = {
    date_desc: t('archive.sortNewest'),
    date_asc: t('archive.sortOldest'),
    total_desc: t('archive.sortTotalDesc'),
    total_asc: t('archive.sortTotalAsc'),
    name_asc: t('archive.sortName'),
  };

  const DATE_FILTERS: Record<DateFilter, string> = {
    all: t('archive.allTime'),
    week: t('archive.lastWeek'),
    month: t('archive.lastMonth'),
    quarter: t('archive.lastQuarter'),
  };

  const fetchArchived = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const result = await getArchivedOrders(user.uid);
      setOrders(result.orders);
      setHasMore(result.hasMore);
      lastDocRef.current = result.lastDoc;
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.loadArchivedOrdersError'));
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    fetchArchived();
  }, [fetchArchived]);

  const loadMore = async () => {
    if (!user || !hasMore || !lastDocRef.current) return;
    try {
      setLoadingMore(true);
      const result = await getArchivedOrders(user.uid, lastDocRef.current);
      setOrders((prev) => [...prev, ...result.orders]);
      setHasMore(result.hasMore);
      lastDocRef.current = result.lastDoc;
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.loadArchivedOrdersError'));
    } finally {
      setLoadingMore(false);
    }
  };

  const filteredAndSortedOrders = useMemo(() => {
    let result = [...orders];

    if (dateFilter !== 'all') {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      result = result.filter((order) => {
        const orderDate = new Date(order.createdAt);

        switch (dateFilter) {
          case 'week': {
            const weekAgo = new Date(startOfDay);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return orderDate >= weekAgo;
          }
          case 'month': {
            const monthAgo = new Date(startOfDay);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return orderDate >= monthAgo;
          }
          case 'quarter': {
            const quarterAgo = new Date(startOfDay);
            quarterAgo.setMonth(quarterAgo.getMonth() - 3);
            return orderDate >= quarterAgo;
          }
          default:
            return true;
        }
      });
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (order) =>
          order.clientName.toLowerCase().includes(term) ||
          order.clientPhone.toLowerCase().includes(term) ||
          (order.orderNumber?.toLowerCase().includes(term) ?? false)
      );
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'date_asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'total_desc':
          return b.total - a.total;
        case 'total_asc':
          return a.total - b.total;
        case 'name_asc':
          return a.clientName.localeCompare(b.clientName);
        default:
          return 0;
      }
    });

    return result;
  }, [orders, searchTerm, sortBy, dateFilter]);

  const handleExport = () => {
    if (filteredAndSortedOrders.length === 0) {
      showToast(t('archive.noExport'), 'warning');
      return;
    }
    const ordersWithCode = filteredAndSortedOrders.map(o => ({
      ...o,
      clientCountryCode: getCountryCode(clients.find(c => c.phone === o.clientPhone)?.phoneCountryCode ?? '')?.code
    }));
    exportToCSV(ordersWithCode, 'archived_orders');
    showToast(t('archive.exportSuccess'), 'success');
  };

  return (
    <MainLayout>
      <div className="archive">
        <div className="archive__header">
          <h1>{t('archive.title')}</h1>
          <div className="archive__header-actions">
            <button
              onClick={handleExport}
              className="btn btn--secondary"
              disabled={orders.length === 0}
            >
              <PiDownloadSimpleBold size={18} />
              {t('common.exportCsv')}
            </button>
          </div>
        </div>

        <div className="archive__controls">
          <div className="archive__search">
            <PiMagnifyingGlassBold size={16} className="archive__search-icon" />
            <input
              type="text"
              placeholder={t('archive.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
            />
          </div>

          <div className="archive__selects">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilter)}
              className="select"
            >
              {(Object.keys(DATE_FILTERS) as DateFilter[]).map((filter) => (
                <option key={filter} value={filter}>
                  {DATE_FILTERS[filter]}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="select"
            >
              {(Object.keys(SORT_OPTIONS) as SortOption[]).map((option) => (
                <option key={option} value={option}>
                  {SORT_OPTIONS[option]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <OrdersTable
          orders={filteredAndSortedOrders}
          loading={loading}
          error={error}
          searchTerm={searchTerm}
        />
        {hasMore && !searchTerm.trim() && (
          <div className="archive__load-more">
            <button
              className="btn btn--outline"
              onClick={loadMore}
              disabled={loadingMore}
            >
              {loadingMore ? t('dashboard.loadingMore') : t('dashboard.loadMore')}
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Archive;
