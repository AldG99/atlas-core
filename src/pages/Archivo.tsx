import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PiArchiveBold, PiCurrencyDollarBold, PiUsersBold } from 'react-icons/pi';
import type { Pedido } from '../types/Pedido';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { getArchivedPedidos, unarchivePedido, deletePedido } from '../services/pedidoService';
import { exportToCSV, formatCurrency } from '../utils/formatters';
import { ROUTES } from '../config/routes';
import MainLayout from '../layouts/MainLayout';
import PedidosTable from '../components/pedidos/PedidosTable';
import './Archivo.scss';

type SortOption = 'fecha_desc' | 'fecha_asc' | 'total_desc' | 'total_asc' | 'nombre_asc';
type DateFilter = 'todos' | 'semana' | 'mes' | 'trimestre';

const SORT_OPTIONS: Record<SortOption, string> = {
  fecha_desc: 'Más recientes',
  fecha_asc: 'Más antiguos',
  total_desc: 'Mayor total',
  total_asc: 'Menor total',
  nombre_asc: 'Nombre A-Z'
};

const DATE_FILTERS: Record<DateFilter, string> = {
  todos: 'Todo el tiempo',
  semana: 'Última semana',
  mes: 'Último mes',
  trimestre: 'Últimos 3 meses'
};

const Archivo = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('fecha_desc');
  const [dateFilter, setDateFilter] = useState<DateFilter>('todos');

  const fetchArchived = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getArchivedPedidos(user.uid);
      setPedidos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar pedidos archivados');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchArchived();
  }, [fetchArchived]);

  const stats = useMemo(() => {
    const total = pedidos.length;
    const valorTotal = pedidos.reduce((sum, p) => sum + p.total, 0);
    const clientesUnicos = new Set(pedidos.map(p => p.clienteNombre.toLowerCase().trim())).size;

    return { total, valorTotal, clientesUnicos };
  }, [pedidos]);

  const filteredAndSortedPedidos = useMemo(() => {
    let result = [...pedidos];

    // Filtro por fecha
    if (dateFilter !== 'todos') {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      result = result.filter((pedido) => {
        const pedidoDate = new Date(pedido.fechaCreacion);

        switch (dateFilter) {
          case 'semana': {
            const weekAgo = new Date(startOfDay);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return pedidoDate >= weekAgo;
          }
          case 'mes': {
            const monthAgo = new Date(startOfDay);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return pedidoDate >= monthAgo;
          }
          case 'trimestre': {
            const quarterAgo = new Date(startOfDay);
            quarterAgo.setMonth(quarterAgo.getMonth() - 3);
            return pedidoDate >= quarterAgo;
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
          pedido.clienteTelefono.toLowerCase().includes(term) ||
          pedido.productos.toLowerCase().includes(term)
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
        default:
          return 0;
      }
    });

    return result;
  }, [pedidos, searchTerm, sortBy, dateFilter]);

  const handleRestore = async (id: string) => {
    try {
      await unarchivePedido(id);
      setPedidos((prev) => prev.filter((p) => p.id !== id));
      showToast('Pedido restaurado correctamente', 'success');
    } catch {
      showToast('Error al restaurar el pedido', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este pedido permanentemente? Esta acción no se puede deshacer.')) {
      try {
        await deletePedido(id);
        setPedidos((prev) => prev.filter((p) => p.id !== id));
        showToast('Pedido eliminado permanentemente', 'success');
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
    exportToCSV(filteredAndSortedPedidos, 'pedidos_archivados');
    showToast('Archivo exportado correctamente', 'success');
  };

  const handleRestoreAll = async () => {
    if (filteredAndSortedPedidos.length === 0) {
      showToast('No hay pedidos para restaurar', 'warning');
      return;
    }

    if (!window.confirm(`¿Restaurar ${filteredAndSortedPedidos.length} pedidos?`)) {
      return;
    }

    try {
      await Promise.all(filteredAndSortedPedidos.map(p => unarchivePedido(p.id)));
      setPedidos((prev) => prev.filter(p => !filteredAndSortedPedidos.some(fp => fp.id === p.id)));
      showToast(`${filteredAndSortedPedidos.length} pedidos restaurados`, 'success');
    } catch {
      showToast('Error al restaurar los pedidos', 'error');
    }
  };

  // Dummy handler for onChangeStatus (required by PedidosTable but not used in archive)
  const handleChangeStatus = () => {};

  return (
    <MainLayout>
      <div className="archivo">
        <div className="archivo__header">
          <h1>Archivo</h1>
          <div className="archivo__header-actions">
            <button
              onClick={handleExport}
              className="btn btn--secondary"
              disabled={pedidos.length === 0}
            >
              Exportar CSV
            </button>
            <Link to={ROUTES.DASHBOARD} className="btn btn--primary">
              Ver pedidos activos
            </Link>
          </div>
        </div>

        {!loading && pedidos.length > 0 && (
          <div className="archivo__stats">
            <div className="archivo__stat">
              <div className="archivo__stat-icon">
                <PiArchiveBold size={24} />
              </div>
              <div className="archivo__stat-content">
                <span className="archivo__stat-value">{stats.total}</span>
                <span className="archivo__stat-label">Pedidos archivados</span>
              </div>
            </div>
            <div className="archivo__stat">
              <div className="archivo__stat-icon archivo__stat-icon--money">
                <PiCurrencyDollarBold size={24} />
              </div>
              <div className="archivo__stat-content">
                <span className="archivo__stat-value">{formatCurrency(stats.valorTotal)}</span>
                <span className="archivo__stat-label">Valor total</span>
              </div>
            </div>
            <div className="archivo__stat">
              <div className="archivo__stat-icon archivo__stat-icon--clients">
                <PiUsersBold size={24} />
              </div>
              <div className="archivo__stat-content">
                <span className="archivo__stat-value">{stats.clientesUnicos}</span>
                <span className="archivo__stat-label">Clientes únicos</span>
              </div>
            </div>
          </div>
        )}

        {!loading && pedidos.length > 0 && (
          <div className="archivo__controls">
            <div className="archivo__search">
              <input
                type="text"
                placeholder="Buscar por cliente, teléfono o productos..."
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

              <button
                onClick={handleRestoreAll}
                className="btn btn--outline"
                disabled={filteredAndSortedPedidos.length === 0}
              >
                Restaurar todos ({filteredAndSortedPedidos.length})
              </button>
            </div>
          </div>
        )}

        {loading && <p className="archivo__loading">Cargando archivo...</p>}

        {error && <p className="archivo__error">{error}</p>}

        {!loading && !error && pedidos.length === 0 && (
          <div className="archivo__empty">
            <div className="archivo__empty-icon">
              <PiArchiveBold size={24} />
            </div>
            <h2>El archivo está vacío</h2>
            <p>Los pedidos que archives aparecerán aquí</p>
            <Link to={ROUTES.DASHBOARD} className="btn btn--primary">
              Ir a pedidos
            </Link>
          </div>
        )}

        {!loading && !error && pedidos.length > 0 && filteredAndSortedPedidos.length === 0 && (
          <div className="archivo__empty">
            <p>No se encontraron pedidos para "{searchTerm}"</p>
            <button onClick={() => setSearchTerm('')} className="btn btn--secondary">
              Limpiar búsqueda
            </button>
          </div>
        )}

        {!loading && !error && filteredAndSortedPedidos.length > 0 && (
          <PedidosTable
            pedidos={filteredAndSortedPedidos}
            onChangeStatus={handleChangeStatus}
            onDelete={handleDelete}
            onRestore={handleRestore}
            isArchived={true}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default Archivo;
