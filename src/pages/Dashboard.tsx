import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PiShoppingBagBold, PiCurrencyDollarBold, PiCheckCircleBold, PiCloudArrowUpBold, PiMagnifyingGlassBold, PiDownloadSimpleBold, PiPlusBold } from 'react-icons/pi';
import { usePedidos } from '../hooks/usePedidos';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useClientes } from '../hooks/useClientes';
import { useDashboardFilters, type StatusFilter } from '../hooks/useDashboardFilters';
import { getCodigoPais } from '../data/codigosPais';
import type { PedidoStatus } from '../types/Pedido';
import { PEDIDO_STATUS_COLORS } from '../constants/pedidoStatus';
import { ROUTES } from '../config/routes';
import { archiveAllDelivered } from '../services/pedidoService';
import { exportToCSV, generateCSVContent } from '../utils/formatters';
import { uploadCSVToDrive } from '../services/googleDriveService';
import MainLayout from '../layouts/MainLayout';
import PedidosTable from '../components/pedidos/PedidosTable';
import './Dashboard.scss';

const PEDIDO_STATUS_KEYS: PedidoStatus[] = ['pendiente', 'en_preparacion', 'entregado'];
const FILTER_ORDER: StatusFilter[] = ['todos', ...PEDIDO_STATUS_KEYS];

const Dashboard = () => {
  const { t } = useTranslation();
  const {
    pedidos,
    allPedidos,
    loading,
    error,
    hasMore,
    fetchPedidos,
    fetchByStatus,
    loadMore
  } = usePedidos();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { clientes } = useClientes();
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
    filteredAndSortedPedidos,
    handleFilterChange,
    SORT_OPTIONS,
    DATE_FILTERS,
  } = useDashboardFilters({ pedidos, allPedidos, fetchPedidos, fetchByStatus });

  // Apply filter from notification navigation
  useEffect(() => {
    const state = location.state as Record<string, unknown> | null;
    if (!state?.filterStatus) return;
    const status = state.filterStatus as StatusFilter;
    setFilterStatus(status);
    if (status !== 'todos' && status !== 'abono_pendiente') {
      fetchByStatus(status as PedidoStatus);
    }
  }, []);

  // Auto-archivar pedidos entregados hace más de 48 horas (solo una vez por sesión)
  const hasArchivedRef = useRef(false);
  useEffect(() => {
    if (!user || loading || hasArchivedRef.current) return;
    hasArchivedRef.current = true;
    archiveAllDelivered(user.uid).then((count) => {
      if (count > 0) {
        showToast(t('dashboard.autoArchived', { count }), 'success');
        fetchPedidos();
      }
    }).catch(() => {});
  }, [user, loading, showToast, fetchPedidos]);

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
    if (filteredAndSortedPedidos.length === 0) {
      showToast(t('dashboard.noOrdersExport'), 'warning');
      return;
    }
    setUploadingDrive(true);
    try {
      const pedidosConCodigo = filteredAndSortedPedidos.map(p => ({
        ...p,
        clienteCodigoPais: getCodigoPais(clientes.find(c => c.telefono === p.clienteTelefono)?.telefonoCodigoPais ?? '')?.codigo
      }));
      const csvContent = generateCSVContent(pedidosConCodigo);
      const fileName = `pedidos_${new Date().toISOString().split('T')[0]}.csv`;
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
    if (filteredAndSortedPedidos.length === 0) {
      showToast(t('dashboard.noOrdersExport'), 'warning');
      return;
    }
    const pedidosConCodigo = filteredAndSortedPedidos.map(p => ({
      ...p,
      clienteCodigoPais: getCodigoPais(clientes.find(c => c.telefono === p.clienteTelefono)?.telefonoCodigoPais ?? '')?.codigo
    }));
    exportToCSV(pedidosConCodigo);
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
              disabled={pedidos.length === 0}
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
            <Link to={ROUTES.NEW_PEDIDO} className="btn btn--primary">
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
                <span className="dashboard__summary-value">{todaySummary.cantidadPedidos}</span>
              </div>
            </div>
            <div className="dashboard__summary-card">
              <div className="dashboard__summary-icon dashboard__summary-icon--primary">
                <PiCurrencyDollarBold size={20} />
              </div>
              <div className="dashboard__summary-content">
                <span className="dashboard__summary-label">{t('dashboard.salesToday')}</span>
                <span className="dashboard__summary-value">
                  ${todaySummary.totalVentas.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
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
                  ${todaySummary.ventasEntregadas.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
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
            <span className="dashboard__filter-count">{allPedidos.length}</span>
          </button>
          {PEDIDO_STATUS_KEYS.map((status) => (
            <button
              key={status}
              className={`dashboard__filter ${filterStatus === status ? 'dashboard__filter--active' : ''}`}
              onClick={() => handleFilterChange(status)}
            >
              <span
                className="dashboard__filter-dot"
                style={{ backgroundColor: PEDIDO_STATUS_COLORS[status] }}
              />
              {t(`orders.status.${status}`)}
              <span className="dashboard__filter-count">{statusCounts[status]}</span>
            </button>
          ))}
        </div>

        <PedidosTable
          pedidos={filteredAndSortedPedidos}
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
