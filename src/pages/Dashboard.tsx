import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PiShoppingBagBold, PiCurrencyDollarBold, PiCheckCircleBold, PiCloudArrowUpBold, PiMagnifyingGlassBold, PiDownloadSimpleBold, PiPlusBold } from 'react-icons/pi';
import { useOrders } from '../hooks/useOrders';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useClients } from '../hooks/useClients';
import { useCurrency } from '../hooks/useCurrency';
import { useDashboardFilters, type StatusFilter } from '../hooks/useDashboardFilters';
import { getCountryCode } from '../data/countryCodes';
import type { OrderStatus } from '../types/Order';
import { ORDER_STATUS_COLORS } from '../constants/orderStatus';
import { ROUTES } from '../config/routes';
import { archiveAllDelivered } from '../services/orderService';
import { exportToCSV, generateCSVContent } from '../utils/formatters';
import { uploadCSVToDrive } from '../services/googleDriveService';
import MainLayout from '../layouts/MainLayout';
import OrdersTable from '../components/orders/OrdersTable';
import './Dashboard.scss';

const ORDER_STATUS_KEYS: OrderStatus[] = ['pending', 'preparing', 'delivered'];
const FILTER_ORDER: StatusFilter[] = ['todos', ...ORDER_STATUS_KEYS];

const Dashboard = () => {
  const { t } = useTranslation();
  const {
    orders,
    allOrders,
    loading,
    error,
    hasMore,
    fetchOrders,
    fetchByStatus,
    loadMore
  } = useOrders();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { clients } = useClients();
  const { format } = useCurrency();
  const location = useLocation();

  const {
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
  } = useDashboardFilters({ orders, allOrders, fetchOrders, fetchByStatus });

  // Apply filter from notification navigation
  useEffect(() => {
    const state = location.state as Record<string, unknown> | null;
    if (!state?.filterStatus) return;
    const status = state.filterStatus as StatusFilter;
    setFilterStatus(status);
    if (status !== 'todos' && status !== 'abono_pendiente') {
      fetchByStatus(status as OrderStatus);
    }
  }, [location.state, setFilterStatus, fetchByStatus]);

  // Auto-archivar pedidos entregados hace más de 48 horas (solo una vez por sesión)
  const hasArchivedRef = useRef(false);
  useEffect(() => {
    if (!user || loading || hasArchivedRef.current) return;
    hasArchivedRef.current = true;
    archiveAllDelivered(user.uid).then((count) => {
      if (count > 0) {
        showToast(t('dashboard.autoArchived', { count }), 'success');
        fetchOrders();
      }
    }).catch(() => {});
  }, [user, loading, showToast, fetchOrders, t]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (['input', 'select', 'textarea'].includes(tag)) return;
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      const currentIndex = FILTER_ORDER.indexOf(filterStatus);
      const nextIndex = e.key === 'ArrowRight'
        ? Math.min(currentIndex + 1, FILTER_ORDER.length - 1)
        : Math.max(currentIndex - 1, 0);
      if (nextIndex !== currentIndex) void handleFilterChange(FILTER_ORDER[nextIndex]);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [filterStatus, handleFilterChange]);

  const [uploadingDrive, setUploadingDrive] = useState(false);

  const handleGoogleDrive = async () => {
    if (filteredAndSortedOrders.length === 0) {
      showToast(t('dashboard.noOrdersExport'), 'warning');
      return;
    }
    setUploadingDrive(true);
    try {
      const ordersWithCode = filteredAndSortedOrders.map(o => ({
        ...o,
        clientCountryCode: getCountryCode(clients.find(c => c.phone === o.clientPhone)?.phoneCountryCode ?? '')?.code
      }));
      const csvContent = generateCSVContent(ordersWithCode);
      const fileName = `orders_${new Date().toISOString().split('T')[0]}.csv`;
      const link = await uploadCSVToDrive(csvContent, fileName);
      showToast(t('dashboard.driveSuccess'), 'success');
      window.open(link, '_blank');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg !== 'popup_closed_by_user') {
        showToast(t('dashboard.driveError'), 'error');
      }
    } finally {
      setUploadingDrive(false);
    }
  };

  const handleExport = () => {
    if (filteredAndSortedOrders.length === 0) {
      showToast(t('dashboard.noOrdersExport'), 'warning');
      return;
    }
    const ordersWithCode = filteredAndSortedOrders.map(o => ({
      ...o,
      clientCountryCode: getCountryCode(clients.find(c => c.phone === o.clientPhone)?.phoneCountryCode ?? '')?.code
    }));
    exportToCSV(ordersWithCode);
    showToast(t('dashboard.exportSuccess'), 'success');
  };

  return (
    <MainLayout>
      <div className="dashboard">
        <div className="dashboard__header">
          <h1>{t('dashboard.title')}</h1>
          <div className="dashboard__header-actions">
            <button
              onClick={handleExport}
              className="btn btn--secondary"
              disabled={orders.length === 0}
            >
              <PiDownloadSimpleBold size={18} />
              {t('dashboard.exportCsv')}
            </button>
            <button
              onClick={handleGoogleDrive}
              className="btn btn--outline"
              title={t('dashboard.googleDrive')}
              disabled={uploadingDrive}
            >
              <PiCloudArrowUpBold size={18} />
              {uploadingDrive ? t('dashboard.uploading') : t('dashboard.googleDrive')}
            </button>
            <Link to={ROUTES.NEW_ORDER} className="btn btn--primary">
              <PiPlusBold size={18} />
              {t('dashboard.newOrder')}
            </Link>
          </div>
        </div>

        <div className="dashboard__today-summary">
            <div className="dashboard__summary-card">
              <div className="dashboard__summary-icon">
                <PiShoppingBagBold size={20} />
              </div>
              <div className="dashboard__summary-content">
                <span className="dashboard__summary-label">{t('dashboard.ordersToday')}</span>
                <span className="dashboard__summary-value">{todaySummary.orderCount}</span>
              </div>
            </div>
            <div className="dashboard__summary-card">
              <div className="dashboard__summary-icon dashboard__summary-icon--primary">
                <PiCurrencyDollarBold size={20} />
              </div>
              <div className="dashboard__summary-content">
                <span className="dashboard__summary-label">{t('dashboard.salesToday')}</span>
                <span className="dashboard__summary-value">
                  {format(todaySummary.totalSales)}
                </span>
              </div>
            </div>
            <div className="dashboard__summary-card">
              <div className="dashboard__summary-icon dashboard__summary-icon--success">
                <PiCheckCircleBold size={20} />
              </div>
              <div className="dashboard__summary-content">
                <span className="dashboard__summary-label">{t('dashboard.delivered')}</span>
                <span className="dashboard__summary-value">
                  {format(todaySummary.deliveredSales)}
                </span>
              </div>
            </div>
        </div>

        <div className="dashboard__controls">
          <div className="dashboard__search">
            <PiMagnifyingGlassBold size={16} className="dashboard__search-icon" />
            <input
              type="text"
              placeholder={t('dashboard.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
            />
          </div>

          <div className="dashboard__selects">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as typeof dateFilter)}
              className="select"
            >
              {(Object.keys(DATE_FILTERS) as (keyof typeof DATE_FILTERS)[]).map((filter) => (
                <option key={filter} value={filter}>
                  {DATE_FILTERS[filter]}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="select"
            >
              {(Object.keys(SORT_OPTIONS) as (keyof typeof SORT_OPTIONS)[]).map((option) => (
                <option key={option} value={option}>
                  {SORT_OPTIONS[option]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="dashboard__filters">
          <button
            className={`dashboard__filter ${filterStatus === 'todos' ? 'dashboard__filter--active' : ''}`}
            onClick={() => handleFilterChange('todos')}
          >
            {t('dashboard.allOrders')}
            <span className="dashboard__filter-count">{allOrders.length}</span>
          </button>
          {ORDER_STATUS_KEYS.map((status) => (
            <button
              key={status}
              className={`dashboard__filter ${filterStatus === status ? 'dashboard__filter--active' : ''}`}
              onClick={() => handleFilterChange(status)}
            >
              <span
                className="dashboard__filter-dot"
                style={{ backgroundColor: ORDER_STATUS_COLORS[status] }}
              />
              {t(`orders.status.${status}`)}
              <span className="dashboard__filter-count">{statusCounts[status]}</span>
            </button>
          ))}
        </div>

        <OrdersTable
          orders={filteredAndSortedOrders}
          loading={loading}
          error={error}
          searchTerm={searchTerm}
        />
        {hasMore && filterStatus === 'todos' && !searchTerm.trim() && (
          <div className="dashboard__load-more">
            <button
              className="btn btn--outline"
              onClick={loadMore}
              disabled={loading}
            >
              {loading ? t('dashboard.loadingMore') : t('dashboard.loadMore')}
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Dashboard;
