import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PiArchiveBold, PiMagnifyingGlassBold } from 'react-icons/pi';
import type { Pedido } from '../types/Pedido';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { getArchivedPedidos } from '../services/pedidoService';
import { exportToCSV, formatCurrency, formatShortDate, getTotalPagado } from '../utils/formatters';
import { PEDIDO_STATUS, PEDIDO_STATUS_COLORS } from '../constants/pedidoStatus';
import { ROUTES } from '../config/routes';
import MainLayout from '../layouts/MainLayout';
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

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

const getProductosSummary = (pedido: Pedido): string => {
  const total = pedido.productos.length;
  if (total === 0) return 'Sin productos';
  const first = pedido.productos[0].nombre;
  if (total === 1) return first;
  return `${first} +${total - 1}`;
};

const Archivo = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
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

  const filteredAndSortedPedidos = useMemo(() => {
    let result = [...pedidos];

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

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (pedido) =>
          pedido.clienteNombre.toLowerCase().includes(term) ||
          pedido.clienteTelefono.toLowerCase().includes(term)
      );
    }

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

  const handleExport = () => {
    if (filteredAndSortedPedidos.length === 0) {
      showToast('No hay pedidos para exportar', 'warning');
      return;
    }
    exportToCSV(filteredAndSortedPedidos, 'pedidos_archivados');
    showToast('Archivo exportado correctamente', 'success');
  };

  const handleRowClick = (id: string) => {
    navigate(ROUTES.DETAIL_PEDIDO.replace(':id', id));
  };

  return (
    <MainLayout>
      <div className="archivo">
        <div className="archivo__header">
          <h1>Archivados</h1>
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
          <div className="archivo__controls">
            <div className="archivo__search">
              <PiMagnifyingGlassBold size={16} className="archivo__search-icon" />
              <input
                type="text"
                placeholder="Buscar por nombre o teléfono..."
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
        )}

        {loading && <p className="archivo__loading">Cargando archivo...</p>}

        {error && <p className="archivo__error">{error}</p>}

        {!loading && !error && pedidos.length === 0 && (
          <div className="archivo__empty">
            <div className="archivo__empty-icon">
              <PiArchiveBold />
            </div>
            <h2>El archivo está vacío</h2>
            <p>Los pedidos que archives aparecerán aquí para que puedas consultarlos o restaurarlos en cualquier momento.</p>
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
          <div className="archivo__table-wrapper">
            <div className="archivo__table-header">
              <table className="archivo__table">
                <colgroup>
                  <col style={{ width: '20%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '7%' }} />
                  <col style={{ width: '8%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '7%' }} />
                  <col style={{ width: '12%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Teléfono</th>
                    <th>C.P.</th>
                    <th>Productos</th>
                    <th>Abonado</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
              </table>
            </div>
            <div className="archivo__table-body">
              <table className="archivo__table">
                <colgroup>
                  <col style={{ width: '20%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '7%' }} />
                  <col style={{ width: '8%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '7%' }} />
                  <col style={{ width: '12%' }} />
                </colgroup>
                <tbody>
                  {filteredAndSortedPedidos.map((pedido) => {
                    const pagado = getTotalPagado(pedido);
                    const porcentaje = pedido.total > 0 ? Math.round((pagado / pedido.total) * 100) : 0;
                    const paidStatus = pagado >= pedido.total ? 'paid' : pagado > 0 ? 'partial' : 'pending';
                    const totalClass = pagado >= pedido.total
                      ? 'archivo__total--paid'
                      : pagado > 0
                        ? 'archivo__total--pending'
                        : '';
                    return (
                      <tr
                        key={pedido.id}
                        className="archivo__row"
                        onClick={() => handleRowClick(pedido.id)}
                      >
                        <td>
                          <div className="archivo__client">
                            <div className="archivo__avatar">
                              {pedido.clienteFoto ? (
                                <img src={pedido.clienteFoto} alt={pedido.clienteNombre} />
                              ) : (
                                <span>{pedido.clienteNombre.charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <span className="archivo__name" title={pedido.clienteNombre}>
                              {pedido.clienteNombre}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="archivo__phone">{pedido.clienteTelefono}</span>
                        </td>
                        <td>
                          <span className="archivo__cp">{pedido.clienteCodigoPostal || '-'}</span>
                        </td>
                        <td>
                          <div className="archivo__product-cell">
                            <span className="archivo__product-count">
                              {pedido.productos.reduce((sum, p) => sum + p.cantidad, 0)}
                            </span>
                            {pedido.productos.some(p => p.descuento && p.descuento > 0) && (
                              <span className="archivo__discount-indicator" title="Incluye descuento">%</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className={`archivo__paid archivo__paid--${paidStatus}`}>
                            <span className="archivo__paid-amount">{formatCurrency(pagado)}</span>
                            <span className="archivo__paid-percent">{porcentaje}%</span>
                          </div>
                        </td>
                        <td>
                          <span className={`archivo__total ${totalClass}`}>
                            {formatCurrency(pedido.total)}
                          </span>
                        </td>
                        <td>
                          <span
                            className="archivo__status-dot"
                            style={{ backgroundColor: PEDIDO_STATUS_COLORS[pedido.estado] }}
                            title={PEDIDO_STATUS[pedido.estado]}
                          />
                        </td>
                        <td>
                          <span className="archivo__date">{formatShortDate(new Date(pedido.fechaCreacion))}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="archivo__table-footer">
              <span className="archivo__page-info">
                {filteredAndSortedPedidos.length} {filteredAndSortedPedidos.length === 1 ? 'pedido' : 'pedidos'}
              </span>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Archivo;
