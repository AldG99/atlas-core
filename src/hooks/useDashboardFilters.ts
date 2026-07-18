import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Order, OrderStatus } from '../types/Order';

// Nota: los valores de SortOption son también las llaves de i18next en
// dashboard.sortOptions.* (en los 4 locales) — se mantienen en español
// intencionalmente para no tener que retocar las traducciones.
export type SortOption = 'fecha_desc' | 'fecha_asc' | 'total_desc' | 'total_asc' | 'nombre_asc' | 'nombre_desc';
export type DateFilter = 'all' | 'today' | 'week' | 'month';
export type StatusFilter = OrderStatus | 'all' | 'pendingPayment';

const DAYS_PAYMENT_NO_ACTIVITY = 3;

const daysSincePayment = (date: Date): number =>
  Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));

interface UseDashboardFiltersOptions {
  orders: Order[];
  allOrders: Order[];
  fetchOrders: () => Promise<void>;
  fetchByStatus: (status: OrderStatus) => Promise<void>;
}

export const useDashboardFilters = ({
  orders,
  allOrders,
  fetchOrders,
  fetchByStatus,
}: UseDashboardFiltersOptions) => {
  const { t } = useTranslation();
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('fecha_desc');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  const SORT_OPTIONS: Record<SortOption, string> = {
    fecha_desc: t('dashboard.sortOptions.fecha_desc'),
    fecha_asc: t('dashboard.sortOptions.fecha_asc'),
    total_desc: t('dashboard.sortOptions.total_desc'),
    total_asc: t('dashboard.sortOptions.total_asc'),
    nombre_asc: t('dashboard.sortOptions.nombre_asc'),
    nombre_desc: t('dashboard.sortOptions.nombre_desc'),
  };

  const DATE_FILTERS: Record<DateFilter, string> = {
    all: t('dashboard.allDates'),
    today: t('dashboard.today'),
    week: t('dashboard.thisWeek'),
    month: t('dashboard.thisMonth'),
  };

  const statusCounts = useMemo(() => ({
    pending: allOrders.filter((o) => o.status === 'pending').length,
    preparing: allOrders.filter((o) => o.status === 'preparing').length,
    delivered: allOrders.filter((o) => o.status === 'delivered').length,
  }), [allOrders]);

  const todaySummary = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const ordersToday = allOrders.filter((o) => new Date(o.createdAt) >= startOfDay);
    const totalSales = ordersToday.reduce((sum, o) => sum + o.total, 0);
    const deliveredOrders = ordersToday.filter((o) => o.status === 'delivered');
    return {
      orderCount: ordersToday.length,
      totalSales,
      deliveredCount: deliveredOrders.length,
      deliveredSales: deliveredOrders.reduce((sum, o) => sum + o.total, 0),
    };
  }, [allOrders]);

  const filteredAndSortedOrders = useMemo(() => {
    let result = filterStatus === 'pendingPayment' ? [...allOrders] : [...orders];

    // Filtro por fecha
    if (dateFilter !== 'all') {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      result = result.filter((order) => {
        const orderDate = new Date(order.createdAt);
        switch (dateFilter) {
          case 'today':
            return orderDate >= startOfDay;
          case 'week': {
            const startOfWeek = new Date(startOfDay);
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
            return orderDate >= startOfWeek;
          }
          case 'month': {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            return orderDate >= startOfMonth;
          }
          default:
            return true;
        }
      });
    }

    // Filtro por abono pendiente
    if (filterStatus === 'pendingPayment') {
      result = result.filter((o) => {
        const payments = o.payments || [];
        if (payments.length === 0) return false;
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        if (totalPaid <= 0 || totalPaid >= o.total) return false;
        const lastPayment = payments.reduce((max, p) =>
          new Date(p.date) > new Date(max.date) ? p : max
        );
        return daysSincePayment(lastPayment.date) >= DAYS_PAYMENT_NO_ACTIVITY;
      });
    }

    // Filtro por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (o) =>
          o.clientName.toLowerCase().includes(term) ||
          o.clientPhone.toLowerCase().includes(term) ||
          (o.orderNumber?.toLowerCase().includes(term) ?? false)
      );
    }

    // Ordenamiento
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
        case 'nombre_desc':
          return b.clientName.localeCompare(a.clientName);
        default:
          return 0;
      }
    });

    return result;
  }, [orders, allOrders, searchTerm, sortBy, dateFilter, filterStatus]);

  const handleFilterChange = async (status: StatusFilter) => {
    setFilterStatus(status);
    if (status === 'all') {
      await fetchOrders();
    } else if (status !== 'pendingPayment') {
      await fetchByStatus(status as OrderStatus);
    }
  };

  return {
    filterStatus,
    setFilterStatus,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    dateFilter,
    setDateFilter,
    statusCounts,
    todaySummary,
    filteredAndSortedOrders,
    handleFilterChange,
    SORT_OPTIONS,
    DATE_FILTERS,
  };
};
