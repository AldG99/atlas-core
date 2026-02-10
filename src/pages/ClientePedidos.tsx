import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PiArrowLeftBold,
  PiArchiveBold,
  PiClipboardTextBold,
  PiPlusBold,
  PiArrowsClockwiseBold,
  PiCurrencyDollarBold,
  PiShoppingCartBold,
  PiReceiptBold,
  PiStarBold,
  PiMagnifyingGlassBold
} from 'react-icons/pi';
import type { Pedido, PedidoStatus } from '../types/Pedido';
import type { Cliente } from '../types/Cliente';
import { PEDIDO_STATUS, PEDIDO_STATUS_COLORS } from '../constants/pedidoStatus';
import { getClienteById } from '../services/clienteService';
import { getPedidosByClientPhone } from '../services/pedidoService';
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
  const [ordenamiento, setOrdenamiento] = useState<SortOption>('recientes');

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

  const pedidosActivos = pedidosFiltrados.filter(p => !p.archivado);
  const pedidosArchivados = pedidosFiltrados.filter(p => p.archivado);

  const handleNuevoPedido = () => {
    navigate('/pedido/nuevo', { state: { cliente } });
  };

  const handleRepetir = (pedido: Pedido, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/pedido/nuevo', {
      state: {
        cliente,
        productos: pedido.productos
      }
    });
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

  const renderCard = (pedido: Pedido, archived = false) => {
    const pagado = (pedido.abonos || []).reduce((s, a) => s + a.monto, 0);
    const porcentajePago = pedido.total > 0 ? Math.min((pagado / pedido.total) * 100, 100) : 0;
    const liquidado = pagado >= pedido.total;

    return (
      <div
        key={pedido.id}
        className={`cliente-pedidos__card${archived ? ' cliente-pedidos__card--archived' : ''}`}
        onClick={() => navigate(`/pedido/${pedido.id}`)}
      >
        <div className="cliente-pedidos__card-top">
          <span
            className="cliente-pedidos__status"
            style={{ backgroundColor: PEDIDO_STATUS_COLORS[pedido.estado] }}
          >
            {PEDIDO_STATUS[pedido.estado]}
          </span>
          <span className="cliente-pedidos__date">{formatDate(pedido.fechaCreacion)}</span>
        </div>
        <div className="cliente-pedidos__card-body">
          <span className="cliente-pedidos__productos">
            {pedido.productos.map(p => `${p.cantidad}x ${p.nombre}`).join(', ')}
          </span>
        </div>

        {/* Barra de progreso de pago */}
        <div className="cliente-pedidos__pago">
          <div className="cliente-pedidos__pago-bar">
            <div
              className={`cliente-pedidos__pago-fill${liquidado ? ' cliente-pedidos__pago-fill--complete' : ''}`}
              style={{ width: `${porcentajePago}%` }}
            />
          </div>
          <span className="cliente-pedidos__pago-text">
            {liquidado
              ? 'Liquidado'
              : `${formatCurrency(pagado)} de ${formatCurrency(pedido.total)} — faltan ${formatCurrency(pedido.total - pagado)}`}
          </span>
        </div>

        <div className="cliente-pedidos__card-bottom">
          <span className="cliente-pedidos__total">{formatCurrency(pedido.total)}</span>
          {!archived && (
            <button
              className="cliente-pedidos__btn-repetir"
              onClick={(e) => handleRepetir(pedido, e)}
              title="Repetir pedido"
            >
              <PiArrowsClockwiseBold size={14} />
              Repetir
            </button>
          )}
        </div>
      </div>
    );
  };

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

        {/* Content */}
        <div className="cliente-pedidos__content">
          {/* Stats */}
          <div className="cliente-pedidos__stats">
            <div className="cliente-pedidos__stat-card">
              <div className="cliente-pedidos__stat-icon cliente-pedidos__stat-icon--green">
                <PiCurrencyDollarBold size={18} />
              </div>
              <div className="cliente-pedidos__stat-info">
                <span className="cliente-pedidos__stat-value">{formatCurrency(stats.totalGastado)}</span>
                <span className="cliente-pedidos__stat-label">Total gastado</span>
              </div>
            </div>
            <div className="cliente-pedidos__stat-card">
              <div className="cliente-pedidos__stat-icon cliente-pedidos__stat-icon--blue">
                <PiShoppingCartBold size={18} />
              </div>
              <div className="cliente-pedidos__stat-info">
                <span className="cliente-pedidos__stat-value">{stats.cantidadPedidos}</span>
                <span className="cliente-pedidos__stat-label">Pedidos</span>
              </div>
            </div>
            <div className="cliente-pedidos__stat-card">
              <div className="cliente-pedidos__stat-icon cliente-pedidos__stat-icon--amber">
                <PiReceiptBold size={18} />
              </div>
              <div className="cliente-pedidos__stat-info">
                <span className="cliente-pedidos__stat-value">{formatCurrency(stats.ticketPromedio)}</span>
                <span className="cliente-pedidos__stat-label">Ticket promedio</span>
              </div>
            </div>
            <div className="cliente-pedidos__stat-card">
              <div className="cliente-pedidos__stat-icon cliente-pedidos__stat-icon--purple">
                <PiStarBold size={18} />
              </div>
              <div className="cliente-pedidos__stat-info">
                <span className="cliente-pedidos__stat-value cliente-pedidos__stat-value--text">{stats.productoFavorito}</span>
                <span className="cliente-pedidos__stat-label">Producto favorito</span>
              </div>
            </div>
          </div>

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

          {pedidosFiltrados.length === 0 ? (
            <div className="cliente-pedidos__empty">
              <PiClipboardTextBold size={48} />
              <p>{pedidos.length === 0 ? 'Este cliente no tiene pedidos' : 'No se encontraron pedidos con los filtros aplicados'}</p>
            </div>
          ) : (
            <>
              {/* Pedidos activos */}
              {pedidosActivos.length > 0 && (
                <div className="cliente-pedidos__group">
                  <div className="cliente-pedidos__group-header">
                    <PiClipboardTextBold size={16} />
                    <span>Activos ({pedidosActivos.length})</span>
                  </div>
                  <div className="cliente-pedidos__list">
                    {pedidosActivos.map(pedido => renderCard(pedido))}
                  </div>
                </div>
              )}

              {/* Pedidos archivados */}
              {pedidosArchivados.length > 0 && (
                <div className="cliente-pedidos__group">
                  <div className="cliente-pedidos__group-header cliente-pedidos__group-header--archived">
                    <PiArchiveBold size={16} />
                    <span>Archivados ({pedidosArchivados.length})</span>
                  </div>
                  <div className="cliente-pedidos__list">
                    {pedidosArchivados.map(pedido => renderCard(pedido, true))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ClientePedidos;
