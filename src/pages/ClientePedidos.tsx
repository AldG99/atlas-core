import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PiArrowLeftBold,
  PiPlusBold,
  PiMagnifyingGlassBold,
  PiArrowRightBold
} from 'react-icons/pi';
import type { Pedido, PedidoStatus } from '../types/Pedido';
import type { Cliente } from '../types/Cliente';
import { getClienteById } from '../services/clienteService';
import { getPedidosByClientPhone } from '../services/pedidoService';
import { PEDIDO_STATUS, PEDIDO_STATUS_COLORS } from '../constants/pedidoStatus';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import MainLayout from '../layouts/MainLayout';
import './ClientePedidos.scss';

type SortOption = 'recientes' | 'antiguos' | 'mayor_total' | 'menor_total';
type DateFilter = 'todo' | 'semana' | 'mes' | '3meses';

const ClientePedidos = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros y ordenamiento
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<PedidoStatus | 'todos'>('todos');
  const [filtroFecha, setFiltroFecha] = useState<DateFilter>('todo');
  const [ordenamiento, setOrdenamiento] = useState<SortOption>('antiguos');
  const fetchData = useCallback(async () => {
    if (!id || !user) return;
    try {
      setLoading(true);
      const clienteData = await getClienteById(id);
      if (!clienteData) {
        showToast('Cliente no encontrado', 'error');
        navigate(-1);
        return;
      }
      setCliente(clienteData);
      const pedidosData = await getPedidosByClientPhone(user.uid, clienteData.telefono);
      setPedidos(pedidosData);
    } catch (err) {
      console.error('Error al cargar pedidos del cliente:', err);
      showToast('Error al cargar los datos', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, user, navigate, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(date));

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

  const formatRelativeDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'hoy';
    if (days === 1) return 'ayer';
    if (days < 7) return `hace ${days} días`;
    if (days < 30) {
      const weeks = Math.floor(days / 7);
      return `hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
    }
    const months = Math.floor(days / 30);
    return `hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
  };

  // Stats
  const stats = useMemo(() => {
    const totalGastado = pedidos.reduce((sum, p) => sum + p.total, 0);
    const cantidadPedidos = pedidos.length;
    const ticketPromedio = cantidadPedidos > 0 ? totalGastado / cantidadPedidos : 0;

    const productoCantidades: Record<string, number> = {};
    pedidos.forEach(p => {
      p.productos.forEach(prod => {
        productoCantidades[prod.nombre] = (productoCantidades[prod.nombre] || 0) + prod.cantidad;
      });
    });
    const productoFavorito = Object.entries(productoCantidades).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

    return { totalGastado, cantidadPedidos, ticketPromedio, productoFavorito };
  }, [pedidos]);

  // Filtrado
  const pedidosFiltrados = useMemo(() => {
    let resultado = [...pedidos];

    // Búsqueda
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      resultado = resultado.filter(p =>
        p.productos.some(prod =>
          prod.nombre.toLowerCase().includes(q) ||
          (prod.clave && prod.clave.toLowerCase().includes(q))
        )
      );
    }

    // Estado
    if (filtroEstado !== 'todos') {
      resultado = resultado.filter(p => p.estado === filtroEstado);
    }

    // Fecha
    if (filtroFecha !== 'todo') {
      const ahora = new Date();
      let desde: Date;
      switch (filtroFecha) {
        case 'semana':
          desde = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'mes':
          desde = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '3meses':
          desde = new Date(ahora.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
      }
      resultado = resultado.filter(p => new Date(p.fechaCreacion) >= desde);
    }

    // Ordenamiento
    resultado.sort((a, b) => {
      switch (ordenamiento) {
        case 'recientes':
          return new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime();
        case 'antiguos':
          return new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime();
        case 'mayor_total':
          return b.total - a.total;
        case 'menor_total':
          return a.total - b.total;
        default:
          return 0;
      }
    });

    return resultado;
  }, [pedidos, busqueda, filtroEstado, filtroFecha, ordenamiento]);

  // Acumulado global sobre TODOS los pedidos (no cambia con filtros)
  const acumuladoMap = useMemo(() => {
    const sorted = [...pedidos].sort(
      (a, b) => new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime()
    );
    const map = new Map<string, number>();
    let acumulado = 0;
    sorted.forEach(p => {
      acumulado += p.total;
      map.set(p.id, acumulado);
    });
    return map;
  }, [pedidos]);

  const handleNuevoPedido = () => {
    navigate('/pedido/nuevo', { state: { cliente } });
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="cliente-pedidos">
          <p className="cliente-pedidos__loading">Cargando historial...</p>
        </div>
      </MainLayout>
    );
  }

  if (!cliente) return null;

  return (
    <MainLayout>
      <div className="cliente-pedidos">
        {/* Top Bar */}
        <div className="cliente-pedidos__top-bar">
          <div className="cliente-pedidos__top-bar-inner">
            <button
              className="cliente-pedidos__icon-btn cliente-pedidos__icon-btn--back"
              onClick={() => navigate(`/cliente/${id}`)}
              title="Volver al cliente"
            >
              <PiArrowLeftBold size={20} />
            </button>
            <div className="cliente-pedidos__top-bar-title">
              <span className="cliente-pedidos__top-bar-name">{cliente.nombre} {cliente.apellido}</span>
              <span className="cliente-pedidos__top-bar-subtitle">Historial de pedidos</span>
            </div>
            <button
              className="cliente-pedidos__btn-nuevo"
              onClick={handleNuevoPedido}
            >
              <PiPlusBold size={16} />
              Nuevo pedido
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="cliente-pedidos__summary">
          <div className="cliente-pedidos__summary-item">
            <span className="cliente-pedidos__summary-label">Total gastado</span>
            <span className="cliente-pedidos__summary-value">{formatCurrency(stats.totalGastado)}</span>
          </div>
          <div className="cliente-pedidos__summary-item">
            <span className="cliente-pedidos__summary-label">Pedidos</span>
            <span className="cliente-pedidos__summary-value">{stats.cantidadPedidos}</span>
          </div>
          <div className="cliente-pedidos__summary-item">
            <span className="cliente-pedidos__summary-label">Ticket promedio</span>
            <span className="cliente-pedidos__summary-value">{formatCurrency(stats.ticketPromedio)}</span>
          </div>
          <div className="cliente-pedidos__summary-item">
            <span className="cliente-pedidos__summary-label">Producto favorito</span>
            <span className="cliente-pedidos__summary-value">{stats.productoFavorito}</span>
          </div>
        </div>

        {/* Content */}
        <div className="cliente-pedidos__content">
          {/* Filtros */}
          <div className="cliente-pedidos__filters">
            <div className="cliente-pedidos__search">
              <PiMagnifyingGlassBold size={16} />
              <input
                type="text"
                placeholder="Buscar producto o clave..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />
            </div>
            <select
              value={filtroEstado}
              onChange={e => setFiltroEstado(e.target.value as PedidoStatus | 'todos')}
            >
              <option value="todos">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="en_preparacion">En preparación</option>
              <option value="entregado">Entregado</option>
            </select>
            <select
              value={filtroFecha}
              onChange={e => setFiltroFecha(e.target.value as DateFilter)}
            >
              <option value="todo">Todo el tiempo</option>
              <option value="semana">Última semana</option>
              <option value="mes">Último mes</option>
              <option value="3meses">Últimos 3 meses</option>
            </select>
            <select
              value={ordenamiento}
              onChange={e => setOrdenamiento(e.target.value as SortOption)}
            >
              <option value="recientes">Más recientes</option>
              <option value="antiguos">Más antiguos</option>
              <option value="mayor_total">Mayor total</option>
              <option value="menor_total">Menor total</option>
            </select>
          </div>

          <div className="cliente-pedidos__table-wrapper">
            <div className="cliente-pedidos__table-header">
              <table className="cliente-pedidos__table">
                <colgroup>
                  <col style={{ width: '22%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '7%' }} />
                  <col style={{ width: '5%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Productos</th>
                    <th>Cant.</th>
                    <th>Total</th>
                    <th>Acumulado</th>
                    <th>Estado</th>
                    <th />
                  </tr>
                </thead>
              </table>
            </div>
            <div className="cliente-pedidos__table-container">
              <table className="cliente-pedidos__table">
                <colgroup>
                  <col style={{ width: '22%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '7%' }} />
                  <col style={{ width: '5%' }} />
                </colgroup>
                <tbody>
                  {pedidosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="cliente-pedidos__table-empty">
                        {pedidos.length === 0 ? 'Este cliente no tiene pedidos' : 'No se encontraron pedidos con los filtros aplicados'}
                      </td>
                    </tr>
                  ) : pedidosFiltrados.map((pedido) => (
                    <tr key={pedido.id} className="cliente-pedidos__table-row">
                      <td>
                        <div className="cliente-pedidos__table-date">
                          <span className="cliente-pedidos__table-date-main">{formatDate(pedido.fechaCreacion)}</span>
                          <span className="cliente-pedidos__table-date-rel">{formatRelativeDate(pedido.fechaCreacion)}</span>
                        </div>
                      </td>
                      <td>
                        <span className="cliente-pedidos__table-products" title={pedido.productos.map(p => p.nombre).join(', ')}>
                          {pedido.productos.map(p => p.nombre).join(', ')}
                        </span>
                      </td>
                      <td>
                        <span className="cliente-pedidos__table-qty">
                          {pedido.productos.reduce((sum, p) => sum + p.cantidad, 0)}
                        </span>
                      </td>
                      <td>
                        <span className="cliente-pedidos__table-total">{formatCurrency(pedido.total)}</span>
                      </td>
                      <td>
                        <span className="cliente-pedidos__table-acumulado">{formatCurrency(acumuladoMap.get(pedido.id) ?? 0)}</span>
                      </td>
                      <td>
                        <span
                          className="cliente-pedidos__table-status"
                          style={{ backgroundColor: PEDIDO_STATUS_COLORS[pedido.estado] }}
                          title={PEDIDO_STATUS[pedido.estado]}
                        />
                      </td>
                      <td>
                        <button
                          className="cliente-pedidos__table-detail-btn"
                          onClick={() => navigate(`/pedido/${pedido.id}`, { state: { from: `/cliente/${id}/pedidos` } })}
                          title="Ver detalle del pedido"
                        >
                          <PiArrowRightBold size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="cliente-pedidos__table-footer">
              <span className="cliente-pedidos__table-footer-info">
                {pedidosFiltrados.length} {pedidosFiltrados.length === 1 ? 'pedido' : 'pedidos'}
              </span>
            </div>
          </div>
        </div>

      </div>
    </MainLayout>
  );
};

export default ClientePedidos;
