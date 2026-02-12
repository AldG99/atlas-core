import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PiArrowLeftBold,
  PiWhatsappLogoBold,
  PiCopyBold,
  PiPencilBold,
  PiCheckBold,
  PiPlusBold,
  PiEyeBold,
  PiXBold,
  PiPackageBold,
  PiTrashBold,
  PiMinusBold,
} from 'react-icons/pi';
import type { Pedido, PedidoStatus, ProductoItem } from '../types/Pedido';
import type { Producto, Etiqueta } from '../types/Producto';
import { PEDIDO_STATUS, PEDIDO_STATUS_COLORS } from '../constants/pedidoStatus';
import { ETIQUETA_ICONS } from '../constants/etiquetaIcons';
import {
  formatPedidoForWhatsApp,
  openWhatsApp,
  copyToClipboard,
} from '../utils/formatters';
import {
  getPedidoById,
  updatePedidoStatus,
  updatePedido,
  addAbono,
  deletePedido,
} from '../services/pedidoService';
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
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(
    null
  );

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editProductos, setEditProductos] = useState<ProductoItem[]>([]);
  const [editNotas, setEditNotas] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

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

  // Close product dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);

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

  // Editing helpers
  const startEditing = () => {
    if (!pedido) return;
    setEditProductos(pedido.productos.map(p => ({ ...p })));
    setEditNotas(pedido.notas || '');
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditProductos([]);
    setEditNotas('');
    setProductSearchTerm('');
    setShowProductDropdown(false);
  };

  const handleSave = async () => {
    if (!pedido) return;
    if (editProductos.length === 0) {
      showToast('El pedido debe tener al menos un producto', 'error');
      return;
    }
    try {
      setSaving(true);
      const newTotal = editProductos.reduce((sum, p) => sum + p.subtotal, 0);
      const data = {
        productos: editProductos,
        total: newTotal,
        notas: editNotas || undefined,
      };
      await updatePedido(pedido.id, data);
      setPedido({
        ...pedido,
        productos: editProductos,
        total: newTotal,
        notas: editNotas || undefined,
      });
      setIsEditing(false);
      setProductSearchTerm('');
      setShowProductDropdown(false);
      showToast('Pedido actualizado correctamente', 'success');
    } catch {
      showToast('Error al actualizar el pedido', 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateProductoCantidad = (index: number, delta: number) => {
    setEditProductos(prev => {
      const updated = [...prev];
      const p = { ...updated[index] };
      const newCant = Math.max(1, p.cantidad + delta);
      p.cantidad = newCant;
      p.subtotal = newCant * p.precioUnitario;
      updated[index] = p;
      return updated;
    });
  };

  const removeProducto = (index: number) => {
    setEditProductos(prev => prev.filter((_, i) => i !== index));
  };

  const addProductoToEdit = (producto: Producto) => {
    const existing = editProductos.findIndex(p => p.clave === producto.clave);
    if (existing >= 0) {
      updateProductoCantidad(existing, 1);
    } else {
      setEditProductos(prev => [
        ...prev,
        {
          nombre: producto.nombre,
          clave: producto.clave,
          cantidad: 1,
          precioUnitario: producto.precio,
          subtotal: producto.precio,
        },
      ]);
    }
    setProductSearchTerm('');
    setShowProductDropdown(false);
  };

  const isDescuentoActivo = (p: Producto): boolean => {
    if (!p.descuento || p.descuento <= 0) return false;
    if (!p.fechaFinDescuento) return false;
    return new Date(p.fechaFinDescuento) >= new Date(new Date().toDateString());
  };

  const getPrecioConDescuento = (precio: number, descuento: number): number => {
    return precio * (1 - descuento / 100);
  };

  const filteredProducts = productSearchTerm.trim()
    ? catalogoProductos.filter(
        p =>
          p.nombre.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
          p.clave.toLowerCase().includes(productSearchTerm.toLowerCase())
      )
    : [];

  const editTotal = editProductos.reduce((sum, p) => sum + p.subtotal, 0);

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

  const handleDelete = async () => {
    if (!pedido) return;
    if (
      !window.confirm(
        '¿Estás seguro de eliminar este pedido? Esta acción no se puede deshacer.'
      )
    )
      return;
    try {
      await deletePedido(pedido.id);
      showToast('Pedido eliminado', 'success');
      navigate(ROUTES.DASHBOARD);
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
    const restante = pedido.total - totalPagado;

    if (restante <= 0) {
      setAbonoError('Este pedido ya está completamente pagado');
      return;
    }

    if (monto > restante) {
      setAbonoError(
        `El monto excede el saldo restante (${formatCurrency(restante)})`
      );
      return;
    }

    try {
      const productoIndex =
        abonoProducto === 'general' ? undefined : parseInt(abonoProducto, 10);
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
  const productosActuales = isEditing ? editProductos : pedido.productos;
  const asignadoPorProducto: number[] = productosActuales.map(() => 0);
  const abonosGenerales: number[] = [];
  abonos.forEach(a => {
    if (
      typeof a.productoIndex === 'number' &&
      a.productoIndex >= 0 &&
      a.productoIndex < productosActuales.length
    ) {
      asignadoPorProducto[a.productoIndex] += a.monto;
    } else {
      abonosGenerales.push(a.monto);
    }
  });
  const cobertura = [...asignadoPorProducto];
  let generalPool = abonosGenerales.reduce((s, m) => s + m, 0);
  productosActuales.forEach((p, idx) => {
    const falta = Math.max(0, p.subtotal - cobertura[idx]);
    const porcion = Math.min(generalPool, falta);
    cobertura[idx] += porcion;
    generalPool -= porcion;
  });

  const totalActual = isEditing ? editTotal : pedido.total;
  const restante = totalActual - pagado;
  const liquidado = pagado >= totalActual;
  const puedeMarcarEntregado = pedido.estado === 'en_preparacion';

  return (
    <MainLayout>
      <div className="pedido-detail">
        {/* Fixed Top Bar */}
        <div className="pedido-detail__top-bar">
          <div className="pedido-detail__top-bar-inner">
            <button
              className="pedido-detail__icon-btn pedido-detail__icon-btn--back"
              onClick={() => navigate(ROUTES.DASHBOARD)}
              title="Volver"
            >
              <PiArrowLeftBold size={20} />
            </button>
            {isEditing ? (
              <div className="pedido-detail__top-bar-actions">
                <button
                  onClick={cancelEditing}
                  className="btn btn--outline btn--sm"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="btn btn--primary btn--sm"
                  disabled={saving || editProductos.length === 0}
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            ) : (
              <>
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
                <span className="pedido-detail__top-divider" />
                <button
                  onClick={startEditing}
                  className="pedido-detail__icon-btn pedido-detail__icon-btn--primary"
                  title="Editar pedido"
                >
                  <PiPencilBold size={20} />
                </button>
                <button
                  onClick={handleDelete}
                  className="pedido-detail__icon-btn pedido-detail__icon-btn--danger"
                  title="Eliminar pedido"
                >
                  <PiTrashBold size={20} />
                </button>
                {!pedido.archivado && (
                  <>
                    <span className="pedido-detail__top-divider" />
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
              </>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="pedido-detail__content">
          <div className="pedido-detail__header">
            <div className="pedido-detail__client">
              <div className="pedido-detail__avatar">
                {getClienteFoto(pedido) ? (
                  <img
                    src={getClienteFoto(pedido)}
                    alt={pedido.clienteNombre}
                  />
                ) : (
                  <span>{pedido.clienteNombre.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="pedido-detail__client-info">
                <h1 className="pedido-detail__name">{pedido.clienteNombre}</h1>
                <span className="pedido-detail__phone">
                  {pedido.clienteTelefono}
                </span>
              </div>
            </div>
            <div className="pedido-detail__header-right">
              <span
                className="pedido-detail__status"
                style={{ backgroundColor: PEDIDO_STATUS_COLORS[pedido.estado] }}
              >
                {PEDIDO_STATUS[pedido.estado]}
              </span>
              <span className="pedido-detail__date">
                {formatDate(pedido.fechaCreacion)}
              </span>
            </div>
          </div>

          <div className="pedido-detail__section">
            <div className="pedido-detail__section-header">
              <strong>Productos y pagos</strong>
              <span className="pedido-detail__payment-info">
                {formatCurrency(pagado)} de {formatCurrency(totalActual)}
              </span>
            </div>

            {isEditing && (
              <div className="pedido-detail__product-search" ref={searchRef}>
                <input
                  type="text"
                  placeholder="Buscar producto para agregar..."
                  value={productSearchTerm}
                  onChange={e => {
                    setProductSearchTerm(e.target.value);
                    setShowProductDropdown(e.target.value.trim().length > 0);
                  }}
                  onFocus={() => {
                    if (productSearchTerm.trim()) setShowProductDropdown(true);
                  }}
                  className="pedido-detail__product-search-input"
                />
                {showProductDropdown && filteredProducts.length > 0 && (
                  <div className="pedido-detail__product-dropdown">
                    {filteredProducts.map(p => (
                      <button
                        key={p.id}
                        className="pedido-detail__product-dropdown-item"
                        onClick={() => addProductoToEdit(p)}
                      >
                        <span className="pedido-detail__clave">{p.clave}</span>
                        <span>{p.nombre}</span>
                        {isDescuentoActivo(p) ? (
                          <span className="pedido-detail__product-dropdown-discount">
                            <span className="pedido-detail__product-dropdown-badge">-{p.descuento}%</span>
                            <span className="pedido-detail__product-dropdown-original">{formatCurrency(p.precio)}</span>
                            <span className="pedido-detail__product-dropdown-final">{formatCurrency(getPrecioConDescuento(p.precio, p.descuento!))}</span>
                          </span>
                        ) : (
                          <span className="pedido-detail__product-dropdown-price">
                            {formatCurrency(p.precio)}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {showProductDropdown &&
                  productSearchTerm.trim() &&
                  filteredProducts.length === 0 && (
                    <div className="pedido-detail__product-dropdown">
                      <div className="pedido-detail__product-dropdown-empty">
                        Sin resultados
                      </div>
                    </div>
                  )}
              </div>
            )}

            <table className="pedido-detail__products-table">
              <thead>
                <tr>
                  <th>Clave</th>
                  <th>Cant.</th>
                  <th>Producto</th>
                  <th>Etiquetas</th>
                  {!isEditing && <th>Abonado</th>}
                  <th>Subtotal</th>
                  {!isEditing && <th>Estado</th>}
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productosActuales.map((p, index) => {
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
                      className={`pedido-detail__product-row--${status}`}
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
                      <td>
                        {isEditing ? (
                          <div className="pedido-detail__cantidad-edit">
                            <button
                              onClick={() => updateProductoCantidad(index, -1)}
                              disabled={p.cantidad <= 1}
                            >
                              <PiMinusBold size={12} />
                            </button>
                            <span>{p.cantidad}</span>
                            <button
                              onClick={() => updateProductoCantidad(index, 1)}
                            >
                              <PiPlusBold size={12} />
                            </button>
                          </div>
                        ) : (
                          p.cantidad
                        )}
                      </td>
                      <td>
                        <div className="pedido-detail__product-name-cell">
                          <span>{p.nombre}</span>
                          {p.descuento && p.descuento > 0 && p.precioOriginal && (
                            <div className="pedido-detail__product-discount-info">
                              <span className="pedido-detail__product-discount-badge">-{p.descuento}%</span>
                              <span className="pedido-detail__product-discount-original">
                                {formatCurrency(p.precioOriginal)}
                              </span>
                              <span className="pedido-detail__product-discount-arrow">&rarr;</span>
                              <span className="pedido-detail__product-discount-final">
                                {formatCurrency(p.precioUnitario)}
                              </span>
                            </div>
                          )}
                        </div>
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
                      {!isEditing && (
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
                      )}
                      <td>
                        {p.precioOriginal && p.descuento ? (
                          <div className="pedido-detail__product-subtotal-discount">
                            <span className="pedido-detail__product-subtotal-original">
                              {formatCurrency(p.precioOriginal * p.cantidad)}
                            </span>
                            <span>{formatCurrency(p.subtotal)}</span>
                          </div>
                        ) : (
                          formatCurrency(p.subtotal)
                        )}
                      </td>
                      {!isEditing && (
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
                      )}
                      <td>
                        {isEditing ? (
                          <button
                            className="pedido-detail__product-remove"
                            title="Eliminar producto"
                            onClick={() => removeProducto(index)}
                          >
                            <PiTrashBold size={16} />
                          </button>
                        ) : (
                          <button
                            className="pedido-detail__product-eye"
                            title="Ver detalles"
                            onClick={() => {
                              const found = catalogoProductos.find(
                                cp => cp.clave === p.clave
                              );
                              if (found) setSelectedProducto(found);
                            }}
                          >
                            <PiEyeBold size={20} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                <tr className="pedido-detail__product-total-row">
                  <td>
                    <strong>Total</strong>
                  </td>
                  <td></td>
                  <td></td>
                  <td></td>
                  {!isEditing && (
                    <td>
                      <strong>{formatCurrency(pagado)}</strong>
                    </td>
                  )}
                  <td>
                    <strong>{formatCurrency(totalActual)}</strong>
                  </td>
                  {!isEditing && (
                    <td>
                      <strong
                        className={
                          pagado >= totalActual
                            ? 'pedido-detail__product-status--paid'
                            : pagado > 0
                              ? 'pedido-detail__product-status--partial'
                              : 'pedido-detail__product-status--pending'
                        }
                      >
                        {pagado >= totalActual
                          ? 'Liquidado'
                          : formatCurrency(totalActual - pagado)}
                      </strong>
                    </td>
                  )}
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>

          {isEditing ? (
            <div className="pedido-detail__section">
              <div className="pedido-detail__section-header">
                <strong>Notas</strong>
              </div>
              <textarea
                value={editNotas}
                onChange={e => setEditNotas(e.target.value)}
                placeholder="Notas del pedido..."
                className="pedido-detail__textarea"
                rows={3}
              />
            </div>
          ) : (
            pedido.notas && (
              <div className="pedido-detail__section">
                <div className="pedido-detail__notes">
                  <strong>Notas:</strong> {pedido.notas}
                </div>
              </div>
            )
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
                  {[...abonos]
                    .sort(
                      (a, b) =>
                        new Date(b.fecha).getTime() -
                        new Date(a.fecha).getTime()
                    )
                    .map((abono, i) => (
                      <tr key={i}>
                        <td>
                          {typeof abono.productoIndex === 'number' &&
                          pedido.productos[abono.productoIndex]?.clave ? (
                            <span className="pedido-detail__clave">
                              {pedido.productos[abono.productoIndex].clave}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td>
                          {typeof abono.productoIndex === 'number' &&
                          pedido.productos[abono.productoIndex] ? (
                            pedido.productos[abono.productoIndex].nombre
                          ) : (
                            <span className="pedido-detail__general-label">
                              General
                            </span>
                          )}
                        </td>
                        <td>{formatCurrency(abono.monto)}</td>
                        <td>{formatDate(abono.fecha)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {/* End Scrollable Content */}

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
                  {restante <= 0 ? 'Liquidado' : formatCurrency(restante)}
                </span>
              </div>
              {pedido.estado !== 'entregado' && (
                <button
                  onClick={() => handleChangeStatus('entregado')}
                  className={`pedido-detail__btn-entregado ${puedeMarcarEntregado && !isEditing ? 'pedido-detail__btn-entregado--active' : ''}`}
                  disabled={!puedeMarcarEntregado || isEditing}
                  title={
                    !puedeMarcarEntregado
                      ? 'Solo disponible cuando el pedido está en preparación'
                      : ''
                  }
                >
                  Entregado
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedProducto && (
        <div
          className="pedido-detail__modal-overlay"
          onClick={() => setSelectedProducto(null)}
        >
          <div
            className="pedido-detail__modal"
            onClick={e => e.stopPropagation()}
          >
            <div className="pedido-detail__modal-header">
              <h3>Detalles del producto</h3>
              <button
                className="pedido-detail__modal-close"
                onClick={() => setSelectedProducto(null)}
              >
                <PiXBold size={18} />
              </button>
            </div>
            <div className="pedido-detail__modal-body">
              <div className="pedido-detail__modal-image">
                {selectedProducto.imagen ? (
                  <img
                    src={selectedProducto.imagen}
                    alt={selectedProducto.nombre}
                  />
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
                    <span className="pedido-detail__modal-value">
                      {selectedProducto.clave}
                    </span>
                  </div>
                  <div className="pedido-detail__modal-row">
                    <span className="pedido-detail__modal-label">Nombre</span>
                    <span className="pedido-detail__modal-value">
                      {selectedProducto.nombre}
                    </span>
                  </div>
                  <div className="pedido-detail__modal-row">
                    <span className="pedido-detail__modal-label">Precio</span>
                    {isDescuentoActivo(selectedProducto) ? (
                      <span className="pedido-detail__modal-price-discount">
                        <span className="pedido-detail__modal-price-badge">-{selectedProducto.descuento}%</span>
                        <span className="pedido-detail__modal-price-original">{formatCurrency(selectedProducto.precio)}</span>
                        <span className="pedido-detail__modal-value">{formatCurrency(getPrecioConDescuento(selectedProducto.precio, selectedProducto.descuento!))}</span>
                      </span>
                    ) : (
                      <span className="pedido-detail__modal-value">
                        {formatCurrency(selectedProducto.precio)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="pedido-detail__modal-section">
                <h4>Descripción</h4>
                <p>{selectedProducto.descripcion || 'Sin descripción'}</p>
              </div>
            </div>
            <div className="pedido-detail__modal-footer">
              <button
                className="btn btn--secondary btn--sm"
                onClick={() => setSelectedProducto(null)}
              >
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
