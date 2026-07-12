import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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

type SortOption = 'fecha_desc' | 'fecha_asc' | 'total_desc' | 'total_asc' | 'nombre_asc';
type DateFilter = 'todos' | 'semana' | 'mes' | 'trimestre';

const Archive = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { clients } = useClients();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('fecha_desc');
  const [dateFilter, setDateFilter] = useState<DateFilter>('todos');

  const SORT_OPTIONS: Record<SortOption, string> = {
    fecha_desc: t('archive.sortNewest'),
    fecha_asc: t('archive.sortOldest'),
    total_desc: t('archive.sortTotalDesc'),
    total_asc: t('archive.sortTotalAsc'),
    nombre_asc: t('archive.sortName'),
  };

  const DATE_FILTERS: Record<DateFilter, string> = {
    todos: t('archive.allTime'),
    semana: t('archive.lastWeek'),
    mes: t('archive.lastMonth'),
    trimestre: t('archive.lastQuarter'),
  };

  const fetchArchived = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const result = await getArchivedOrders(user.uid);
      setOrders(result.orders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar pedidos archivados');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchArchived();
  }, [fetchArchived]);

  const filteredAndSortedOrders = useMemo(() => {
    let result = [...orders];

    if (dateFilter !== 'todos') {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      result = result.filter((order) => {
        const orderDate = new Date(order.createdAt);

        switch (dateFilter) {
          case 'semana': {
            const weekAgo = new Date(startOfDay);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return orderDate >= weekAgo;
          }
          case 'mes': {
            const monthAgo = new Date(startOfDay);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return orderDate >= monthAgo;
          }
          case 'trimestre': {
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
        case 'fecha_desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'fecha_asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'total_desc':
          return b.total - a.total;
        case 'total_asc':
          return a.total - b.total;
        case 'nombre_asc':
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
      <div className="archivo">
        <div className="archivo__header">
          <h1>{t('archive.title')}</h1>
          <div className="archivo__header-actions">
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

        <div className="archivo__controls">
          <div className="archivo__search">
            <PiMagnifyingGlassBold size={16} className="archivo__search-icon" />
            <input
              type="text"
              placeholder={t('archive.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
            />
          </div>

          <div className="archivo__selects">
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
      </div>
    </MainLayout>
  );
};

export default Archive;
