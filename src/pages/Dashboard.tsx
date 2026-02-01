import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PiShoppingBagBold, PiCurrencyDollarBold, PiCheckCircleBold, PiCloudArrowUpBold } from 'react-icons/pi';
import { usePedidos } from '../hooks/usePedidos';
import { useToast } from '../hooks/useToast';
import type { Pedido, PedidoStatus } from '../types/Pedido';
import { PEDIDO_STATUS, PEDIDO_STATUS_COLORS } from '../constants/pedidoStatus';
import { ROUTES } from '../config/routes';
import { exportToCSV } from '../utils/formatters';
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
  const [allPedidos, setAllPedidos] = useState<Pedido[]>([]);
  const {
    pedidos,
    loading,
    error,
    changeStatus,
    removePedido,
    fetchPedidos,
    fetchByStatus,
    registrarAbono
  } = usePedidos();
  const { showToast } = useToast();

  // Guardar todos los pedidos cuando el filtro es 'todos'
  useEffect(() => {
    if (filterStatus === 'todos') {
      setAllPedidos(pedidos);
    }
  }, [pedidos, filterStatus]);

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

  const handleChangeStatus = async (id: string, status: PedidoStatus) => {
    try {
      await changeStatus(id, status);
      showToast(`Estado cambiado a "${PEDIDO_STATUS[status]}"`, 'success');
    } catch {
      showToast('Error al cambiar el estado', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este pedido?')) {
      try {
        await removePedido(id);
        showToast('Pedido eliminado', 'success');
      } catch {
        showToast('Error al eliminar el pedido', 'error');
      }
    }
  };

  const handleExport = () => {
    if (filteredAndSortedPedidos.length === 0) {
      showToast('No hay pedidos para exportar', 'warning');
      return;
    }
    exportToCSV(filteredAndSortedPedidos);
    showToast('Pedidos exportados', 'success');
  };

  return (
    <MainLayout>
      <div className="dashboard">
        <div className="dashboard__header">
          <h1>Mis Pedidos</h1>
          <div className="dashboard__header-actions">
            <button
              onClick={() => {}}
              className="btn btn--outline"
              title="Exportar a Google Drive"
            >
              <PiCloudArrowUpBold size={18} style={{ marginRight: '6px' }} />
              Google Drive
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

        {loading && <p className="dashboard__loading">Cargando pedidos...</p>}

        {error && <p className="dashboard__error">{error}</p>}

        {!loading && !error && pedidos.length === 0 && (
          <div className="dashboard__empty">
            <p>No hay pedidos</p>
            <Link to={ROUTES.NEW_PEDIDO} className="btn btn--primary">
              Crear primer pedido
            </Link>
          </div>
        )}

        {!loading && !error && pedidos.length > 0 && filteredAndSortedPedidos.length === 0 && (
          <div className="dashboard__empty">
            <p>No se encontraron pedidos para "{searchTerm}"</p>
          </div>
        )}

        {!loading && !error && filteredAndSortedPedidos.length > 0 && (
          <PedidosTable
            pedidos={filteredAndSortedPedidos}
            onChangeStatus={handleChangeStatus}
            onDelete={handleDelete}
            onAddAbono={registrarAbono}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default Dashboard;
