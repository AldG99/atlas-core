import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PiShoppingBagBold, PiCurrencyDollarBold, PiCheckCircleBold, PiCloudArrowUpBold, PiMagnifyingGlassBold } from 'react-icons/pi';
import { usePedidos } from '../hooks/usePedidos';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useClientes } from '../hooks/useClientes';
import { getCodigoPais } from '../data/codigosPais';
import type { PedidoStatus } from '../types/Pedido';
import { PEDIDO_STATUS, PEDIDO_STATUS_COLORS } from '../constants/pedidoStatus';
import { ROUTES } from '../config/routes';
import { archiveAllDelivered } from '../services/pedidoService';
import { exportToCSV, generateCSVContent } from '../utils/formatters';
import { uploadCSVToDrive } from '../services/googleDriveService';
import MainLayout from '../layouts/MainLayout';
import PedidosTable from '../components/pedidos/PedidosTable';
import './Dashboard.scss';

type SortOption = 'fecha_desc' | 'fecha_asc' | 'total_desc' | 'total_asc' | 'nombre_asc' | 'nombre_desc';
type DateFilter = 'todos' | 'hoy' | 'semana' | 'mes';

const SORT_OPTIONS: Record<SortOption, string> = {
  fecha_desc: 'Más recientes',
  fecha_asc: 'Más antiguos',
  total_desc: 'Mayor total',
  total_asc: 'Menor total',
  nombre_asc: 'Nombre A-Z',
  nombre_desc: 'Nombre Z-A'
};

const DATE_FILTERS: Record<DateFilter, string> = {
  todos: 'Todas las fechas',
  hoy: 'Hoy',
  semana: 'Esta semana',
  mes: 'Este mes'
};

const Dashboard = () => {
  const [filterStatus, setFilterStatus] = useState<PedidoStatus | 'todos'>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('fecha_desc');
  const [dateFilter, setDateFilter] = useState<DateFilter>('todos');
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

  // Auto-archivar pedidos entregados hace más de 48 horas
  useEffect(() => {
    if (!user || loading) return;

    archiveAllDelivered(user.uid).then((count) => {
      if (count > 0) {
        showToast(`${count} pedido${count > 1 ? 's' : ''} archivado${count > 1 ? 's' : ''} automáticamente`, 'success');
        fetchPedidos();
      }
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);


  // Conteo de pedidos por estado
  const statusCounts = useMemo(() => {
    return {
      pendiente: allPedidos.filter((p) => p.estado === 'pendiente').length,
      en_preparacion: allPedidos.filter((p) => p.estado === 'en_preparacion').length,
      entregado: allPedidos.filter((p) => p.estado === 'entregado').length
    };
  }, [allPedidos]);

  // Resumen de ventas del día de hoy
  const todaySummary = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const pedidosHoy = allPedidos.filter((pedido) => {
      const pedidoDate = new Date(pedido.fechaCreacion);
      return pedidoDate >= startOfDay;
    });

    const totalVentas = pedidosHoy.reduce((sum, pedido) => sum + pedido.total, 0);
    const pedidosEntregados = pedidosHoy.filter((p) => p.estado === 'entregado');
    const ventasEntregadas = pedidosEntregados.reduce((sum, pedido) => sum + pedido.total, 0);

    return {
      cantidadPedidos: pedidosHoy.length,
      totalVentas,
      pedidosEntregados: pedidosEntregados.length,
      ventasEntregadas
    };
  }, [allPedidos]);

  const filteredAndSortedPedidos = useMemo(() => {
    let result = [...pedidos];

    // Filtro por fecha
    if (dateFilter !== 'todos') {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      result = result.filter((pedido) => {
        const pedidoDate = new Date(pedido.fechaCreacion);

        switch (dateFilter) {
          case 'hoy':
            return pedidoDate >= startOfDay;
          case 'semana': {
            const startOfWeek = new Date(startOfDay);
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
            return pedidoDate >= startOfWeek;
          }
          case 'mes': {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            return pedidoDate >= startOfMonth;
          }
          default:
            return true;
        }
      });
    }

    // Filtro por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (pedido) =>
          pedido.clienteNombre.toLowerCase().includes(term) ||
          pedido.clienteTelefono.toLowerCase().includes(term)
      );
    }

    // Ordenamiento
    result.sort((a, b) => {
      switch (sortBy) {
        case 'fecha_desc':
          return new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime();
        case 'fecha_asc':
          return new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime();
        case 'total_desc':
          return b.total - a.total;
        case 'total_asc':
          return a.total - b.total;
        case 'nombre_asc':
          return a.clienteNombre.localeCompare(b.clienteNombre);
        case 'nombre_desc':
          return b.clienteNombre.localeCompare(a.clienteNombre);
        default:
          return 0;
      }
    });

    return result;
  }, [pedidos, searchTerm, sortBy, dateFilter]);

  const handleFilterChange = async (status: PedidoStatus | 'todos') => {
    setFilterStatus(status);
    if (status === 'todos') {
      await fetchPedidos();
    } else {
      await fetchByStatus(status);
    }
  };

  const FILTER_ORDER: (PedidoStatus | 'todos')[] = ['todos', ...Object.keys(PEDIDO_STATUS) as PedidoStatus[]];

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
      if (nextIndex !== currentIndex) handleFilterChange(FILTER_ORDER[nextIndex]);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [filterStatus]);

  const [uploadingDrive, setUploadingDrive] = useState(false);

  const handleGoogleDrive = async () => {
    if (filteredAndSortedPedidos.length === 0) {
      showToast('No hay pedidos para exportar', 'warning');
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
      showToast('Archivo subido a Google Drive', 'success');
      window.open(link, '_blank');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg !== 'popup_closed_by_user') {
        showToast('Error al subir a Google Drive', 'error');
      }
    } finally {
      setUploadingDrive(false);
    }
  };

  const handleExport = () => {
    if (filteredAndSortedPedidos.length === 0) {
      showToast('No hay pedidos para exportar', 'warning');
      return;
    }
    const pedidosConCodigo = filteredAndSortedPedidos.map(p => ({
      ...p,
      clienteCodigoPais: getCodigoPais(clientes.find(c => c.telefono === p.clienteTelefono)?.telefonoCodigoPais ?? '')?.codigo
    }));
    exportToCSV(pedidosConCodigo);
    showToast('Pedidos exportados', 'success');
  };

  return (
    <MainLayout>
      <div className="dashboard">
        <div className="dashboard__header">
          <h1>Mis Pedidos</h1>
          <div className="dashboard__header-actions">
            <button
              onClick={handleGoogleDrive}
              className="btn btn--outline"
              title="Exportar a Google Drive"
              disabled={uploadingDrive}
            >
              <PiCloudArrowUpBold size={18} style={{ marginRight: '6px' }} />
              {uploadingDrive ? 'Subiendo...' : 'Google Drive'}
            </button>
            <button
              onClick={handleExport}
              className="btn btn--secondary"
              disabled={pedidos.length === 0}
            >
              Exportar CSV
            </button>
            <Link to={ROUTES.NEW_PEDIDO} className="btn btn--primary">
              Nuevo pedido
            </Link>
          </div>
        </div>

        <div className="dashboard__today-summary">
            <div className="dashboard__summary-card">
              <div className="dashboard__summary-icon">
                <PiShoppingBagBold size={20} />
              </div>
              <div className="dashboard__summary-content">
                <span className="dashboard__summary-label">Pedidos hoy</span>
                <span className="dashboard__summary-value">{todaySummary.cantidadPedidos}</span>
              </div>
            </div>
            <div className="dashboard__summary-card">
              <div className="dashboard__summary-icon dashboard__summary-icon--primary">
                <PiCurrencyDollarBold size={20} />
              </div>
              <div className="dashboard__summary-content">
                <span className="dashboard__summary-label">Ventas del día</span>
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
                <span className="dashboard__summary-label">Entregados</span>
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
              placeholder="Buscar por nombre o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
            />
          </div>

          <div className="dashboard__selects">
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

        <div className="dashboard__filters">
          <button
            className={`dashboard__filter ${filterStatus === 'todos' ? 'dashboard__filter--active' : ''}`}
            onClick={() => handleFilterChange('todos')}
          >
            Todos
            <span className="dashboard__filter-count">{allPedidos.length}</span>
          </button>
          {(Object.keys(PEDIDO_STATUS) as PedidoStatus[]).map((status) => (
            <button
              key={status}
              className={`dashboard__filter ${filterStatus === status ? 'dashboard__filter--active' : ''}`}
              onClick={() => handleFilterChange(status)}
            >
              <span
                className="dashboard__filter-dot"
                style={{ backgroundColor: PEDIDO_STATUS_COLORS[status] }}
              />
              {PEDIDO_STATUS[status]}
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
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0', flexShrink: 0 }}>
            <button
              className="btn btn--outline"
              onClick={loadMore}
              disabled={loading}
            >
              {loading ? 'Cargando...' : 'Cargar más pedidos'}
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Dashboard;
