import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  PiArrowLeftBold,
  PiWhatsappLogoBold,
  PiCopyBold,
  PiPencilBold,
  PiCheckBold,
  PiArchiveBold,
  PiPlusBold,
  PiEyeBold,
  PiXBold,
  PiPackageBold
} from 'react-icons/pi';
import type { Pedido, PedidoStatus } from '../types/Pedido';
import type { Producto, Etiqueta } from '../types/Producto';
import { PEDIDO_STATUS, PEDIDO_STATUS_COLORS } from '../constants/pedidoStatus';
import { ETIQUETA_ICONS } from '../constants/etiquetaIcons';
import { formatPedidoForWhatsApp, openWhatsApp, copyToClipboard } from '../utils/formatters';
import { getPedidoById, updatePedidoStatus, addAbono, archivePedido } from '../services/pedidoService';
import { useClientes } from '../hooks/useClientes';
import { useProductos } from '../hooks/useProductos';
import { useEtiquetas } from '../hooks/useEtiquetas';
import { useToast } from '../hooks/useToast';
import { ROUTES } from '../config/routes';
import MainLayout from '../layouts/MainLayout';
import './PedidoDetail.scss';

const PedidoDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { clientes } = useClientes();
  const { productos: catalogoProductos } = useProductos();
  const { etiquetas: todasEtiquetas } = useEtiquetas();

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(false);
  const [abonoInput, setAbonoInput] = useState('');
  const [abonoProducto, setAbonoProducto] = useState('general');
  const [abonoError, setAbonoError] = useState<string | null>(null);
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);

  const fetchPedido = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await getPedidoById(id);
      if (!data) {
        showToast('Pedido no encontrado', 'error');
        navigate(ROUTES.DASHBOARD);
        return;
      }
      setPedido(data);
    } catch {
      showToast('Error al cargar el pedido', 'error');
      navigate(ROUTES.DASHBOARD);
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showToast]);

  useEffect(() => {
    fetchPedido();
  }, [fetchPedido]);

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

  const getTotalPagado = (p: Pedido) =>
    (p.abonos || []).reduce((sum, a) => sum + a.monto, 0);

  const getClienteFoto = (p: Pedido): string | undefined => {
    if (p.clienteFoto) return p.clienteFoto;
    const cliente = clientes.find(c => c.telefono === p.clienteTelefono);
    return cliente?.fotoPerfil;
  };

  const getEtiquetasForClave = (clave?: string): Etiqueta[] => {
    if (!clave) return [];
    const producto = catalogoProductos.find(cp => cp.clave === clave);
    if (!producto?.etiquetas) return [];
    return producto.etiquetas
      .map(etId => todasEtiquetas.find(e => e.id === etId))
      .filter((e): e is Etiqueta => !!e);
  };

  const handleCopy = async () => {
    if (!pedido) return;
    const message = formatPedidoForWhatsApp(pedido);
    const success = await copyToClipboard(message);
    if (success) {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleWhatsApp = () => {
    if (!pedido) return;
    const message = formatPedidoForWhatsApp(pedido);
    openWhatsApp(pedido.clienteTelefono, message);
  };

  const handleChangeStatus = async (status: PedidoStatus) => {
    if (!pedido) return;
    try {
      await updatePedidoStatus(pedido.id, status);
      setPedido({ ...pedido, estado: status });
      showToast(`Estado cambiado a "${PEDIDO_STATUS[status]}"`, 'success');
    } catch {
      showToast('Error al cambiar el estado', 'error');
    }
  };

  const handleArchive = async () => {
    if (!pedido) return;
    try {
      await archivePedido(pedido.id);
      showToast('Pedido archivado', 'success');
      navigate(ROUTES.DASHBOARD);
    } catch {
      showToast('Error al archivar el pedido', 'error');
    }
  };

  const handleAddAbono = async () => {
    if (!pedido) return;
    const monto = parseFloat(abonoInput);
    if (!monto || monto <= 0) return;
    setAbonoError(null);

    const totalPagado = getTotalPagado(pedido);
    const restante = pedido.total - totalPagado;

    if (restante <= 0) {
      setAbonoError('Este pedido ya está completamente pagado');
      return;
    }

    if (monto > restante) {
      setAbonoError(`El monto excede el saldo restante (${formatCurrency(restante)})`);
      return;
    }

    try {
      const productoIndex = abonoProducto === 'general' ? undefined : parseInt(abonoProducto, 10);
      const nuevoAbono = await addAbono(pedido.id, monto, productoIndex);
      const updatedAbonos = [...(pedido.abonos || []), nuevoAbono];
      const nuevoPagado = updatedAbonos.reduce((sum, a) => sum + a.monto, 0);
      let nuevoEstado = pedido.estado;
      if (nuevoPagado >= pedido.total && pedido.estado === 'pendiente') {
        nuevoEstado = 'en_preparacion';
        await updatePedidoStatus(pedido.id, nuevoEstado);
      }
      setPedido({ ...pedido, abonos: updatedAbonos, estado: nuevoEstado });
      setAbonoInput('');
      setAbonoProducto('general');
      showToast('Abono registrado', 'success');
    } catch {
      showToast('Error al registrar abono', 'error');
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="pedido-detail">
          <p className="pedido-detail__loading">Cargando pedido...</p>
        </div>
      </MainLayout>
    );
  }

  if (!pedido) return null;

  const pagado = getTotalPagado(pedido);
  const abonos = pedido.abonos || [];

  // Calculate coverage per product
  const asignadoPorProducto: number[] = pedido.productos.map(() => 0);
  const abonosGenerales: number[] = [];
  abonos.forEach((a) => {
    if (typeof a.productoIndex === 'number' && a.productoIndex >= 0 && a.productoIndex < pedido.productos.length) {
      asignadoPorProducto[a.productoIndex] += a.monto;
    } else {
      abonosGenerales.push(a.monto);
    }
  });
  const cobertura = [...asignadoPorProducto];
  let generalPool = abonosGenerales.reduce((s, m) => s + m, 0);
  pedido.productos.forEach((p, idx) => {
    const falta = Math.max(0, p.subtotal - cobertura[idx]);
    const porcion = Math.min(generalPool, falta);
    cobertura[idx] += porcion;
    generalPool -= porcion;
  });

  return (
    <MainLayout>
      <div className="pedido-detail">
        <div className="pedido-detail__top-bar">
          <button className="pedido-detail__back" onClick={() => navigate(ROUTES.DASHBOARD)}>
            <PiArrowLeftBold size={18} />
            Volver
          </button>
          <div className="pedido-detail__top-actions">
            <button onClick={handleWhatsApp} className="btn btn--outline btn--sm pedido-detail__action-btn--whatsapp">
              <PiWhatsappLogoBold size={16} />
              WhatsApp
            </button>
            <button onClick={handleCopy} className="btn btn--outline btn--sm">
              <PiCopyBold size={16} />
              {copiedId ? 'Copiado!' : 'Copiar'}
            </button>
            <Link to={`/pedido/${pedido.id}/editar`} className="btn btn--primary btn--sm">
              <PiPencilBold size={16} />
              Editar
            </Link>
            {!pedido.archivado && (
              <button onClick={handleArchive} className="btn btn--secondary btn--sm">
                <PiArchiveBold size={16} />
                Archivar
              </button>
            )}
          </div>
        </div>

        <div className="pedido-detail__header">
          <div className="pedido-detail__client">
            <div className="pedido-detail__avatar">
              {getClienteFoto(pedido) ? (
                <img src={getClienteFoto(pedido)} alt={pedido.clienteNombre} />
              ) : (
                <span>{pedido.clienteNombre.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="pedido-detail__client-info">
              <h1 className="pedido-detail__name">{pedido.clienteNombre}</h1>
              <span className="pedido-detail__phone">{pedido.clienteTelefono}</span>
              {pedido.clienteCodigoPostal && (
                <span className="pedido-detail__cp">C.P. {pedido.clienteCodigoPostal}</span>
              )}
            </div>
          </div>
          <div className="pedido-detail__header-right">
            <span
              className="pedido-detail__status"
              style={{ backgroundColor: PEDIDO_STATUS_COLORS[pedido.estado] }}
            >
              {PEDIDO_STATUS[pedido.estado]}
            </span>
            <span className="pedido-detail__date">{formatDate(pedido.fechaCreacion)}</span>
          </div>
        </div>

        <div className="pedido-detail__section">
          <div className="pedido-detail__section-header">
            <strong>Productos y pagos</strong>
            <span className="pedido-detail__payment-info">
              {formatCurrency(pagado)} de {formatCurrency(pedido.total)}
            </span>
          </div>
          <table className="pedido-detail__products-table">
            <thead>
              <tr>
                <th>Clave</th>
                <th>Cant.</th>
                <th>Producto</th>
                <th>Etiquetas</th>
                <th>Abonado</th>
                <th>Subtotal</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pedido.productos.map((p, index) => {
                const cubierto = Math.min(cobertura[index], p.subtotal);
                const porcentaje = p.subtotal > 0 ? (cubierto / p.subtotal) * 100 : 0;
                const status = porcentaje >= 100 ? 'paid' : porcentaje > 0 ? 'partial' : 'pending';
                return (
                  <tr key={index} className={`pedido-detail__product-row--${status}`}>
                    <td>{p.clave ? <span className="pedido-detail__clave">{p.clave}</span> : '-'}</td>
                    <td>{p.cantidad}</td>
                    <td>{p.nombre}</td>
                    <td>
                      <div className="pedido-detail__etiquetas">
                        {getEtiquetasForClave(p.clave).map(et => {
                          const iconData = ETIQUETA_ICONS[et.icono];
                          const Icon = iconData?.icon;
                          return (
                            <span
                              key={et.id}
                              className="pedido-detail__etiqueta"
                              style={{ backgroundColor: et.color }}
                              title={et.nombre}
                            >
                              {Icon && <Icon size={12} />}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td>
                      <div className="pedido-detail__product-paid-cell">
                        <span>{formatCurrency(cubierto)}</span>
                        <div className="pedido-detail__product-bar">
                          <div
                            className={`pedido-detail__product-bar-fill pedido-detail__product-bar-fill--${status}`}
                            style={{ width: `${porcentaje}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>{formatCurrency(p.subtotal)}</td>
                    <td>
                      <span className={`pedido-detail__product-status pedido-detail__product-status--${status}`}>
                        {status === 'paid' ? 'Pagado' : status === 'partial' ? `${Math.round(porcentaje)}%` : 'Pendiente'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="pedido-detail__product-eye"
                        title="Ver detalles"
                        onClick={() => {
                          const found = catalogoProductos.find(cp => cp.clave === p.clave);
                          if (found) setSelectedProducto(found);
                        }}
                      >
                        <PiEyeBold size={20} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              <tr className="pedido-detail__product-total-row">
                <td><strong>Total</strong></td>
                <td></td>
                <td></td>
                <td></td>
                <td><strong>{formatCurrency(pagado)}</strong></td>
                <td><strong>{formatCurrency(pedido.total)}</strong></td>
                <td>
                  <strong className={pagado >= pedido.total ? 'pedido-detail__product-status--paid' : pagado > 0 ? 'pedido-detail__product-status--partial' : 'pedido-detail__product-status--pending'}>
                    {pagado >= pedido.total ? 'Liquidado' : formatCurrency(pedido.total - pagado) + ' restante'}
                  </strong>
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        {pedido.notas && (
          <div className="pedido-detail__section">
            <div className="pedido-detail__notes">
              <strong>Notas:</strong> {pedido.notas}
            </div>
          </div>
        )}

        {abonos.length > 0 && (
          <div className="pedido-detail__section">
            <div className="pedido-detail__section-header">
              <strong>Historial de abonos</strong>
            </div>
            <table className="pedido-detail__abonos-table">
              <thead>
                <tr>
                  <th>Clave</th>
                  <th>Producto</th>
                  <th>Monto</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {abonos.map((abono, i) => (
                  <tr key={i}>
                    <td>
                      {typeof abono.productoIndex === 'number' && pedido.productos[abono.productoIndex]?.clave ? (
                        <span className="pedido-detail__clave">{pedido.productos[abono.productoIndex].clave}</span>
                      ) : '-'}
                    </td>
                    <td>
                      {typeof abono.productoIndex === 'number' && pedido.productos[abono.productoIndex]
                        ? pedido.productos[abono.productoIndex].nombre
                        : <span className="pedido-detail__general-label">General</span>}
                    </td>
                    <td>{formatCurrency(abono.monto)}</td>
                    <td>{formatDate(abono.fecha)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!pedido.archivado && (
          <div className="pedido-detail__section">
            <div className="pedido-detail__section-header">
              <strong>Agregar abono</strong>
            </div>
            <div className="pedido-detail__abono-form">
              <select
                value={abonoProducto}
                onChange={(e) => setAbonoProducto(e.target.value)}
              >
                <option value="general">General</option>
                {pedido.productos.map((p, idx) => (
                  <option key={idx} value={idx}>{p.nombre}</option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="$0.00"
                value={abonoInput}
                onChange={(e) => { setAbonoInput(e.target.value); setAbonoError(null); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddAbono(); }}
              />
              <button className="btn btn--primary btn--sm" onClick={handleAddAbono}>
                <PiPlusBold size={14} />
                Agregar abono
              </button>
            </div>
            {abonoError && <span className="pedido-detail__abono-error">{abonoError}</span>}
          </div>
        )}

        {pedido.estado !== 'entregado' && (
          <div className="pedido-detail__actions">
            <button
              onClick={() => handleChangeStatus('entregado')}
              className={`pedido-detail__btn-entregado ${pedido.estado === 'en_preparacion' ? 'pedido-detail__btn-entregado--active' : ''}`}
              disabled={pedido.estado !== 'en_preparacion'}
            >
              <PiCheckBold size={16} />
              Marcar como entregado
            </button>
          </div>
        )}
      </div>

      {selectedProducto && (
        <div className="pedido-detail__modal-overlay" onClick={() => setSelectedProducto(null)}>
          <div className="pedido-detail__modal" onClick={(e) => e.stopPropagation()}>
            <div className="pedido-detail__modal-header">
              <h3>Detalles del producto</h3>
              <button className="pedido-detail__modal-close" onClick={() => setSelectedProducto(null)}>
                <PiXBold size={18} />
              </button>
            </div>
            <div className="pedido-detail__modal-body">
              <div className="pedido-detail__modal-image">
                {selectedProducto.imagen ? (
                  <img src={selectedProducto.imagen} alt={selectedProducto.nombre} />
                ) : (
                  <div className="pedido-detail__modal-placeholder">
                    <PiPackageBold size={48} />
                    <span>Sin imagen</span>
                  </div>
                )}
              </div>
              <div className="pedido-detail__modal-section">
                <h4>Información</h4>
                <div className="pedido-detail__modal-info">
                  <div className="pedido-detail__modal-row">
                    <span className="pedido-detail__modal-label">Clave</span>
                    <span className="pedido-detail__modal-value">{selectedProducto.clave}</span>
                  </div>
                  <div className="pedido-detail__modal-row">
                    <span className="pedido-detail__modal-label">Nombre</span>
                    <span className="pedido-detail__modal-value">{selectedProducto.nombre}</span>
                  </div>
                  <div className="pedido-detail__modal-row">
                    <span className="pedido-detail__modal-label">Precio</span>
                    <span className="pedido-detail__modal-value">{formatCurrency(selectedProducto.precio)}</span>
                  </div>
                </div>
              </div>
              <div className="pedido-detail__modal-section">
                <h4>Descripción</h4>
                <p>{selectedProducto.descripcion || 'Sin descripción'}</p>
              </div>
            </div>
            <div className="pedido-detail__modal-footer">
              <button className="btn btn--secondary btn--sm" onClick={() => setSelectedProducto(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default PedidoDetail;
