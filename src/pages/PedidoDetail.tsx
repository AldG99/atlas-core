import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  PiArrowLeftBold,
  PiArrowRightBold,
  PiWhatsappLogoBold,
  PiCopyBold,
  PiCheckBold,
  PiEyeBold,
  PiXBold,
  PiTrashBold,
  PiStarFill,
  PiDownloadSimpleBold,
  PiPencilSimpleBold,
} from 'react-icons/pi';
import { toPng } from 'html-to-image';
import PedidoCaptura from '../components/pedidos/PedidoCaptura';
import type { Pedido, PedidoStatus } from '../types/Pedido';
import type { Producto, Etiqueta } from '../types/Producto';
import { PEDIDO_STATUS, PEDIDO_STATUS_COLORS } from '../constants/pedidoStatus';
import { ETIQUETA_ICONS } from '../constants/etiquetaIcons';
import {
  formatDate,
  getTotalPagado,
  formatPedidoForWhatsApp,
  openWhatsApp,
  copyToClipboard,
  formatTelefono,
} from '../utils/formatters';
import { useCurrency } from '../hooks/useCurrency';
import { getCodigoPais } from '../data/codigosPais';
import {
  getPedidoById,
  updatePedidoStatus,
  addAbono,
  updateAbono,
  deletePedido,
} from '../services/pedidoService';
import { useAuth } from '../hooks/useAuth';
import { useClientes } from '../hooks/useClientes';
import { useProductos } from '../hooks/useProductos';
import { useEtiquetas } from '../hooks/useEtiquetas';
import { useToast } from '../hooks/useToast';
import { ROUTES } from '../config/routes';
import ProductoDetalleModal from '../components/productos/ProductoDetalleModal';
import MainLayout from '../layouts/MainLayout';
import './PedidoDetail.scss';

const PedidoDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const backRoute = (location.state as { from?: string })?.from || ROUTES.DASHBOARD;
  const { user } = useAuth();
  const { showToast } = useToast();
  const { clientes } = useClientes();
  const { productos: catalogoProductos } = useProductos();
  const { etiquetas: todasEtiquetas } = useEtiquetas();
  const { simbolo, format } = useCurrency();

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [abonoInput, setAbonoInput] = useState('');
  const [abonoProducto, setAbonoProducto] = useState('general');
  const [abonoError, setAbonoError] = useState<string | null>(null);
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(
    null
  );
  const [focusedRow, setFocusedRow] = useState<number | null>(null);
  const [focusedAbonoRow, setFocusedAbonoRow] = useState<number | null>(null);
  const [editingAbonoId, setEditingAbonoId] = useState<string | null>(null);
  const [editingAbonoValue, setEditingAbonoValue] = useState('');
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const abonoScrollRef = useRef<HTMLDivElement>(null);
  const capturaRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [fechaDescarga, setFechaDescarga] = useState<Date | null>(null);

  const fetchPedido = useCallback(async () => {
    if (!id || !user) return;
    try {
      setLoading(true);
      const data = await getPedidoById(id, user.uid);
      if (!data) {
        showToast('Pedido no encontrado', 'error');
        navigate(backRoute);
        return;
      }
      setPedido(data);
    } catch {
      showToast('Error al cargar el pedido', 'error');
      navigate(backRoute);
    } finally {
      setLoading(false);
    }
  }, [id, user, navigate, showToast]);

  useEffect(() => {
    fetchPedido();
  }, [fetchPedido]);

  useEffect(() => {
    if (!pedido) return;
    const productosLen = pedido.productos.length;
    const abonosLen = (pedido.abonos || []).length;

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (['input', 'select', 'textarea'].includes(tag)) return;

      const updateProductoModal = (newIndex: number) => {
        if (!selectedProducto) return;
        const p = pedido.productos[newIndex];
        const found = p?.clave ? catalogoProductos.find(cp => cp.clave === p.clave) : undefined;
        setSelectedProducto(found ?? null);
      };

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (focusedAbonoRow !== null) {
          setFocusedAbonoRow(prev => Math.min((prev ?? 0) + 1, abonosLen - 1));
        } else if (focusedRow === productosLen - 1 && abonosLen > 0) {
          setFocusedRow(null);
          setFocusedAbonoRow(0);
          setSelectedProducto(null);
        } else {
          const newRow = focusedRow === null ? 0 : Math.min(focusedRow + 1, productosLen - 1);
          setFocusedRow(newRow);
          updateProductoModal(newRow);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (focusedAbonoRow === 0) {
          setFocusedAbonoRow(null);
          setFocusedRow(productosLen - 1);
        } else if (focusedAbonoRow !== null) {
          setFocusedAbonoRow(prev => Math.max((prev ?? 0) - 1, 0));
        } else {
          const newRow = focusedRow === null ? 0 : Math.max(focusedRow - 1, 0);
          setFocusedRow(newRow);
          updateProductoModal(newRow);
        }
      } else if (e.key === 'Enter' && focusedRow !== null) {
        e.preventDefault();
        if (selectedProducto) {
          setSelectedProducto(null);
        } else {
          const p = pedido.productos[focusedRow];
          const found = p.clave
            ? catalogoProductos.find(cp => cp.clave === p.clave)
            : undefined;
          if (found) {
            setSelectedProducto(found);
          } else {
            showToast('Producto no disponible en el catálogo', 'warning');
          }
        }
      } else if (e.key === 'Escape' && selectedProducto) {
        setSelectedProducto(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [pedido, focusedRow, focusedAbonoRow, selectedProducto, catalogoProductos, showToast]);

  useEffect(() => {
    if (focusedRow === null || !tableScrollRef.current) return;
    const rows = tableScrollRef.current.querySelectorAll('tr');
    const row = rows[focusedRow];
    if (row) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [focusedRow]);

  useEffect(() => {
    if (focusedAbonoRow === null || !abonoScrollRef.current) return;
    const rows = abonoScrollRef.current.querySelectorAll('tr');
    const row = rows[focusedAbonoRow];
    if (row) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [focusedAbonoRow]);

  const cobertura = useMemo(() => {
    if (!pedido) return [] as number[];
    const abonos = pedido.abonos || [];
    const asignadoPorProducto: number[] = pedido.productos.map(() => 0);
    let generalPool = 0;
    abonos.forEach(a => {
      if (
        typeof a.productoIndex === 'number' &&
        a.productoIndex >= 0 &&
        a.productoIndex < pedido.productos.length
      ) {
        asignadoPorProducto[a.productoIndex] += a.monto;
      } else {
        generalPool += a.monto;
      }
    });
    const result = [...asignadoPorProducto];
    pedido.productos.forEach((p, idx) => {
      const falta = Math.max(0, p.subtotal - result[idx]);
      const porcion = Math.min(generalPool, falta);
      result[idx] += porcion;
      generalPool -= porcion;
    });
    return result;
  }, [pedido]);

  const getEtiquetasForClave = (clave?: string): Etiqueta[] => {
    if (!clave) return [];
    const producto = catalogoProductos.find(cp => cp.clave === clave);
    if (!producto?.etiquetas) return [];
    return producto.etiquetas
      .map(etId => todasEtiquetas.find(e => e.id === etId))
      .filter((e): e is Etiqueta => !!e);
  };


  const handleDownload = async () => {
    if (!capturaRef.current || !pedido) return;
    setDownloading(true);
    setFechaDescarga(new Date());
    await new Promise(resolve => setTimeout(resolve, 50));
    try {
      const dataUrl = await toPng(capturaRef.current, { pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `${pedido.folio || pedido.id}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      showToast('Error al generar imagen', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const handleCopy = async () => {
    if (!pedido) return;
    const message = formatPedidoForWhatsApp(pedido, simbolo);
    const success = await copyToClipboard(message);
    if (success) {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleWhatsApp = () => {
    if (!pedido) return;
    const message = formatPedidoForWhatsApp(pedido, simbolo);
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

  const handleDelete = () => {
    if (!pedido) return;
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!pedido) return;
    setShowDeleteModal(false);
    try {
      await deletePedido(pedido.id);
      showToast('Pedido eliminado', 'success');
      navigate(backRoute);
    } catch {
      showToast('Error al eliminar el pedido', 'error');
    }
  };

  const handleAddAbono = async () => {
    if (!pedido) return;
    const monto = parseFloat(abonoInput);
    if (!monto || monto <= 0) return;
    setAbonoError(null);

    const totalPagado = getTotalPagado(pedido);
    const restante = Math.round((pedido.total - totalPagado) * 100) / 100;

    if (restante <= 0) {
      setAbonoError('Este pedido ya está completamente pagado');
      return;
    }

    if (Math.round(monto * 100) / 100 > restante) {
      setAbonoError(
        `El monto excede el saldo restante (${format(restante)})`
      );
      return;
    }

    try {
      const productoIndex =
        abonoProducto === 'general' ? undefined : parseInt(abonoProducto, 10);
      const { abono: nuevoAbono, nuevoEstado } = await addAbono(pedido.id, monto, productoIndex, {
        total: pedido.total,
        estadoActual: pedido.estado,
        pagadoHastaAhora: totalPagado
      });
      const updatedAbonos = [...(pedido.abonos || []), nuevoAbono];
      setPedido({ ...pedido, abonos: updatedAbonos, estado: nuevoEstado ?? pedido.estado });
      setAbonoInput('');
      setAbonoProducto('general');
      showToast('Abono registrado', 'success');
    } catch {
      showToast('Error al registrar abono', 'error');
    }
  };

  const handleUpdateAbono = async (abonoId: string) => {
    if (!pedido) return;
    const nuevoMonto = parseFloat(editingAbonoValue);
    if (!nuevoMonto || nuevoMonto <= 0) return;
    try {
      const updatedAbonos = await updateAbono(pedido.id, abonoId, nuevoMonto);
      setPedido({ ...pedido, abonos: updatedAbonos });
      setEditingAbonoId(null);
      showToast('Abono corregido', 'success');
    } catch {
      showToast('Error al corregir el abono', 'error');
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
  const clienteData = clientes.find(c => c.telefono === pedido.clienteTelefono);
  const clienteFoto = pedido.clienteFoto ?? clienteData?.fotoPerfil;
  const clienteFavorito = clienteData?.favorito ?? false;
  const abonos = pedido.abonos || [];

  const restante = pedido.total - pagado;
  const liquidado = pagado >= pedido.total;
  const puedeMarcarEntregado = pedido.estado === 'en_preparacion';

  return (
    <MainLayout>
      <div className="pedido-detail">
        {/* Fixed Top Bar */}
        <div className="pedido-detail__top-bar">
          <div className="pedido-detail__top-bar-inner">
            <button
              className="pedido-detail__icon-btn pedido-detail__icon-btn--back"
              onClick={() => navigate(backRoute)}
              title="Volver"
            >
              <PiArrowLeftBold size={20} />
            </button>
            <button
              onClick={handleWhatsApp}
              className="pedido-detail__icon-btn pedido-detail__icon-btn--whatsapp"
              title="Enviar por WhatsApp"
            >
              <PiWhatsappLogoBold size={20} />
            </button>
            <button
              onClick={handleCopy}
              className={`pedido-detail__icon-btn ${copiedId ? 'pedido-detail__icon-btn--success' : ''}`}
              title={copiedId ? 'Copiado!' : 'Copiar al portapapeles'}
            >
              {copiedId ? (
                <PiCheckBold size={20} />
              ) : (
                <PiCopyBold size={20} />
              )}
            </button>
            <button
              onClick={handleDownload}
              className="pedido-detail__icon-btn"
              title="Descargar imagen"
              disabled={downloading}
            >
              <PiDownloadSimpleBold size={20} />
            </button>
            <span className="pedido-detail__top-divider" />
            <button
              onClick={handleDelete}
              className="pedido-detail__icon-btn pedido-detail__icon-btn--danger"
              title="Eliminar pedido"
            >
              <PiTrashBold size={20} />
            </button>
            {!pedido.archivado && (
              <>
                <div className="pedido-detail__top-bar-abono">
                  <select
                    value={abonoProducto}
                    onChange={e => setAbonoProducto(e.target.value)}
                    disabled={liquidado}
                  >
                    <option value="general">General</option>
                    {pedido.productos.map((p, idx) => (
                      <option key={idx} value={idx}>
                        {p.clave ? `[${p.clave}] ` : ''}
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="$0.00"
                    value={abonoInput}
                    onChange={e => {
                      setAbonoInput(e.target.value);
                      setAbonoError(null);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleAddAbono();
                    }}
                    disabled={liquidado}
                  />
                  <button
                    className="btn btn--primary btn--sm"
                    onClick={handleAddAbono}
                    disabled={liquidado}
                  >
                    Abonar
                  </button>
                </div>
                {abonoError && (
                  <span className="pedido-detail__top-bar-abono-error">
                    {abonoError}
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="pedido-detail__content">
          <div className="pedido-detail__card">
          <div className="pedido-detail__header">
            <div className="pedido-detail__client">
              <div className="pedido-detail__avatar">
                {clienteFoto ? (
                  <img src={clienteFoto} alt={pedido.clienteNombre} />
                ) : (
                  <span>{pedido.clienteNombre.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="pedido-detail__client-info">
                <div className="pedido-detail__name-row">
                  <h1 className="pedido-detail__name">{pedido.clienteNombre}</h1>
                  {clienteFavorito && <PiStarFill size={14} className="pedido-detail__fav-icon" />}
                </div>
                <span className="pedido-detail__phone">
                  {clienteData?.telefonoCodigoPais
                    ? `${getCodigoPais(clienteData.telefonoCodigoPais)?.codigo ?? ''} ${formatTelefono(pedido.clienteTelefono)}`
                    : formatTelefono(pedido.clienteTelefono)}
                </span>
              </div>
            </div>
            <div className="pedido-detail__header-right">
              {pedido.folio && (
                <span className="pedido-detail__folio">{pedido.folio}</span>
              )}
              <div className="pedido-detail__date-status-row">
                <span className="pedido-detail__date">
                  {formatDate(pedido.fechaCreacion)}
                </span>
                {pedido.fechaEntrega && (
                  <>
                    <PiArrowRightBold size={12} className="pedido-detail__date-arrow" />
                    <span className="pedido-detail__date pedido-detail__date--entrega">
                      {formatDate(pedido.fechaEntrega)}
                    </span>
                  </>
                )}
                <span
                  className="pedido-detail__status-dot"
                  style={{ backgroundColor: PEDIDO_STATUS_COLORS[pedido.estado] }}
                  title={PEDIDO_STATUS[pedido.estado]}
                />
              </div>
            </div>
          </div>

          <div className="pedido-detail__section pedido-detail__section--grow">
            <div className="pedido-detail__table-wrapper">
              {/* Header fijo */}
              <div className="pedido-detail__table-head">
                <table className="pedido-detail__products-table">
                  <colgroup>
                    <col style={{ width: '8%' }} />
                    <col style={{ width: '7%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '9%' }} />
                    <col style={{ width: '14%' }} />
                    <col style={{ width: '13%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '10%' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Clave</th>
                      <th>Cant.</th>
                      <th>Producto</th>
                      <th>Etiquetas</th>
                      <th>Precio</th>
                      <th>Abonado</th>
                      <th className="pedido-detail__col--right">Subtotal</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                </table>
              </div>
              {/* Cuerpo scrolleable */}
              <div ref={tableScrollRef} className="pedido-detail__table-scroll pedido-detail__table-scroll--grow">
                <table className="pedido-detail__products-table">
                  <colgroup>
                    <col style={{ width: '8%' }} />
                    <col style={{ width: '7%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '9%' }} />
                    <col style={{ width: '14%' }} />
                    <col style={{ width: '13%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '10%' }} />
                  </colgroup>
                  <tbody>
                    {pedido.productos.map((p, index) => {
                      const cubierto = Math.min(cobertura[index] || 0, p.subtotal);
                      const porcentaje =
                        p.subtotal > 0 ? (cubierto / p.subtotal) * 100 : 0;
                      const status =
                        porcentaje >= 100
                          ? 'paid'
                          : porcentaje > 0
                            ? 'partial'
                            : 'pending';
                      return (
                        <tr
                          key={index}
                          className={`pedido-detail__product-row--${status}${focusedRow === index ? ' pedido-detail__product-row--focused' : ''}`}
                          onClick={() => { setFocusedRow(index); setFocusedAbonoRow(null); }}
                        >
                          <td>
                            {p.clave ? (
                              <span className="pedido-detail__clave">
                                {p.clave}
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td>{p.cantidad}</td>
                          <td>
                            <span className="pedido-detail__product-name">{p.nombre}</span>
                          </td>
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
                            {p.precioOriginal && p.descuento ? (
                              <div className="pedido-detail__product-subtotal-discount">
                                <span className="pedido-detail__product-subtotal-original">
                                  {format(p.precioOriginal)}
                                </span>
                                <span>{format(p.precioUnitario)}</span>
                              </div>
                            ) : (
                              format(p.precioUnitario)
                            )}
                          </td>
                          <td>
                            <div className="pedido-detail__product-paid-cell">
                              <span>{format(cubierto)}</span>
                            </div>
                          </td>
                          <td className="pedido-detail__col--right">
                            {p.precioOriginal && p.descuento ? (
                              <div className="pedido-detail__product-subtotal-discount">
                                <span className="pedido-detail__product-discount-badge">
                                  -{p.descuento}%
                                </span>
                                <span className="pedido-detail__product-subtotal-original">
                                  {format(p.precioOriginal * p.cantidad)}
                                </span>
                                <span>{format(p.subtotal)}</span>
                              </div>
                            ) : (
                              format(p.subtotal)
                            )}
                          </td>
                          <td>
                            <span
                              className={`pedido-detail__product-status pedido-detail__product-status--${status}`}
                            >
                              {status === 'paid'
                                ? 'Pagado'
                                : status === 'partial'
                                  ? `${Math.round(porcentaje)}%`
                                  : 'Pendiente'}
                            </span>
                          </td>
                          <td>
                            <button
                              className="pedido-detail__product-eye"
                              title="Ver detalles"
                              onClick={() => {
                                const found = p.clave
                                  ? catalogoProductos.find(cp => cp.clave === p.clave)
                                  : undefined;
                                if (found) {
                                  setSelectedProducto(found);
                                } else {
                                  showToast('Producto no disponible en el catálogo', 'warning');
                                }
                              }}
                            >
                              <PiEyeBold size={20} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Pie fijo (total) */}
              <div className="pedido-detail__table-foot">
                <table className="pedido-detail__products-table">
                  <colgroup>
                    <col style={{ width: '8%' }} />
                    <col style={{ width: '7%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '9%' }} />
                    <col style={{ width: '14%' }} />
                    <col style={{ width: '13%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '10%' }} />
                  </colgroup>
                  <tfoot className="pedido-detail__products-tfoot">
                    <tr className="pedido-detail__product-total-row">
                      <td>
                        <strong>Total</strong>
                      </td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td>
                        <div className="pedido-detail__product-paid-cell">
                          <strong>{format(pagado)}</strong>
                        </div>
                      </td>
                      <td>
                        <strong>{format(pedido.total)}</strong>
                      </td>
                      <td>
                        <strong
                          className={
                            pagado >= pedido.total
                              ? 'pedido-detail__product-status--paid'
                              : pagado > 0
                                ? 'pedido-detail__product-status--partial'
                                : 'pedido-detail__product-status--pending'
                          }
                        >
                          {pagado >= pedido.total
                            ? 'Liquidado'
                            : format(pedido.total - pagado)}
                        </strong>
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          <div className="pedido-detail__section pedido-detail__section--notes">
            <div className="pedido-detail__notes">
              <strong>Notas:</strong>{' '}
              {pedido.notas ? pedido.notas : <span className="pedido-detail__notes--empty">Sin comentarios</span>}
            </div>
          </div>

          <div className="pedido-detail__section pedido-detail__section--no-pad">
              <div className="pedido-detail__table-wrapper">
                {/* Header fijo */}
                <div className="pedido-detail__table-head">
                  <table className="pedido-detail__abonos-table">
                    <colgroup>
                      <col style={{ width: '10%' }} />
                      <col style={{ width: '33%' }} />
                      <col style={{ width: '16%' }} />
                      <col style={{ width: '7%' }} />
                      <col style={{ width: '14%' }} />
                      <col style={{ width: '20%' }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th>Clave</th>
                        <th>Producto</th>
                        <th>Monto</th>
                        <th></th>
                        <th></th>
                        <th>Fecha</th>
                      </tr>
                    </thead>
                  </table>
                </div>
                {/* Cuerpo scrolleable */}
                <div ref={abonoScrollRef} className="pedido-detail__table-scroll pedido-detail__table-scroll--fixed">
                  <table className="pedido-detail__abonos-table">
                    <colgroup>
                      <col style={{ width: '10%' }} />
                      <col style={{ width: '33%' }} />
                      <col style={{ width: '16%' }} />
                      <col style={{ width: '7%' }} />
                      <col style={{ width: '14%' }} />
                      <col style={{ width: '20%' }} />
                    </colgroup>
                    <tbody>
                      {abonos.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="pedido-detail__abonos-empty">
                            Sin abonos registrados
                          </td>
                        </tr>
                      ) : (
                        [...abonos]
                          .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                          .map((abono, i) => (
                            <tr
                              key={abono.id}
                              className={focusedAbonoRow === i ? 'pedido-detail__product-row--focused' : ''}
                              onClick={() => { setFocusedAbonoRow(i); setFocusedRow(null); }}
                            >
                              <td>
                                {typeof abono.productoIndex === 'number' &&
                                pedido.productos[abono.productoIndex]?.clave ? (
                                  <span className="pedido-detail__clave">
                                    {pedido.productos[abono.productoIndex].clave}
                                  </span>
                                ) : '-'}
                              </td>
                              <td>
                                {typeof abono.productoIndex === 'number' &&
                                pedido.productos[abono.productoIndex] ? (
                                  pedido.productos[abono.productoIndex].nombre
                                ) : (
                                  <span className="pedido-detail__general-label">General</span>
                                )}
                              </td>
                              <td>
                                {editingAbonoId === abono.id ? (
                                  <div className="pedido-detail__abono-edit" onClick={e => e.stopPropagation()}>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      autoFocus
                                      value={editingAbonoValue}
                                      onChange={e => setEditingAbonoValue(e.target.value)}
                                      onKeyDown={e => {
                                        if (e.key === 'Enter') handleUpdateAbono(abono.id);
                                        if (e.key === 'Escape') setEditingAbonoId(null);
                                      }}
                                    />
                                    <button className="pedido-detail__abono-edit-confirm" onClick={() => handleUpdateAbono(abono.id)} title="Confirmar">
                                      <PiCheckBold size={14} />
                                    </button>
                                    <button className="pedido-detail__abono-edit-cancel" onClick={() => setEditingAbonoId(null)} title="Cancelar">
                                      <PiXBold size={14} />
                                    </button>
                                  </div>
                                ) : (
                                  <span>{format(abono.monto)}</span>
                                )}
                              </td>
                              <td>
                                {abono.montoOriginal && (
                                  <span
                                    className="pedido-detail__abono-editado"
                                    title={`Corregido de ${format(abono.montoOriginal)}${abono.editadoEn ? ` · ${formatDate(abono.editadoEn)}` : ''}`}
                                  >
                                    Editado
                                  </span>
                                )}
                              </td>
                              <td onClick={e => e.stopPropagation()}>
                                {editingAbonoId !== abono.id && (
                                  <button
                                    className="pedido-detail__abono-edit-btn"
                                    title={pedido.estado === 'entregado' || pedido.archivado ? 'No se puede editar un pedido entregado' : 'Corregir monto'}
                                    disabled={pedido.estado === 'entregado' || pedido.archivado}
                                    onClick={() => {
                                      setEditingAbonoId(abono.id);
                                      setEditingAbonoValue(String(abono.monto));
                                    }}
                                  >
                                    <PiPencilSimpleBold size={14} />
                                  </button>
                                )}
                              </td>
                              <td>{formatDate(abono.fecha)}</td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Bottom Bar */}
        {!pedido.archivado && (
          <div className="pedido-detail__bottom-bar">
            <div className="pedido-detail__bottom-bar-inner">
              <div className="pedido-detail__bottom-bar-info">
                <span className="pedido-detail__bottom-bar-label">
                  Restante:
                </span>
                <span
                  className={`pedido-detail__bottom-bar-amount ${restante <= 0 ? 'pedido-detail__bottom-bar-amount--paid' : ''}`}
                >
                  {restante <= 0 ? 'Liquidado' : format(restante)}
                </span>
              </div>
              <button
                onClick={() => handleChangeStatus('entregado')}
                className={`pedido-detail__btn-entregado ${puedeMarcarEntregado ? 'pedido-detail__btn-entregado--active' : ''} ${pedido.estado === 'entregado' ? 'pedido-detail__btn-entregado--done' : ''}`}
                disabled={!puedeMarcarEntregado}
                title={
                  pedido.estado === 'entregado'
                    ? 'Pedido ya entregado'
                    : !puedeMarcarEntregado
                      ? 'Solo disponible cuando el pedido está en preparación'
                      : ''
                }
              >
                Entregado
              </button>
            </div>
          </div>
        )}
      </div>

      {showDeleteModal && (
        <div
          className="pedido-detail__modal-overlay"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="pedido-detail__modal pedido-detail__modal--confirm"
            onClick={e => e.stopPropagation()}
          >
            <div className="pedido-detail__modal-header">
              <h3>Eliminar pedido</h3>
              <button
                className="pedido-detail__modal-close"
                onClick={() => setShowDeleteModal(false)}
              >
                <PiXBold size={18} />
              </button>
            </div>
            <div className="pedido-detail__modal-body pedido-detail__modal-body--confirm">
              <p>¿Estás seguro de eliminar este pedido? Esta acción no se puede deshacer.</p>
            </div>
            <div className="pedido-detail__modal-footer">
              <button
                className="btn btn--secondary btn--sm"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancelar
              </button>
              <button
                className="btn btn--danger btn--sm"
                onClick={confirmDelete}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedProducto && (
        <ProductoDetalleModal
          producto={selectedProducto}
          etiquetas={todasEtiquetas}
          onClose={() => setSelectedProducto(null)}
        />
      )}
      {/* Componente de captura fuera de pantalla */}
      <div style={{ position: 'fixed', top: '-9999px', left: '-9999px', zIndex: -1 }}>
        <PedidoCaptura ref={capturaRef} pedido={pedido} cobertura={cobertura} telefonoCodigoPais={clienteData?.telefonoCodigoPais} fechaDescarga={fechaDescarga} />
      </div>
    </MainLayout>
  );
};

export default PedidoDetail;
