import { useState, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { PiArchiveBold, PiTrashBold, PiArrowCounterClockwiseBold, PiCaretDownBold, PiWhatsappLogoBold, PiCopyBold, PiPencilBold, PiPlusBold, PiCheckBold, PiEyeBold, PiXBold, PiPackageBold } from 'react-icons/pi';
import type { Pedido, PedidoStatus } from '../../types/Pedido';
import type { Producto, Etiqueta } from '../../types/Producto';
import { PEDIDO_STATUS, PEDIDO_STATUS_COLORS } from '../../constants/pedidoStatus';
import { ETIQUETA_ICONS } from '../../constants/etiquetaIcons';
import { formatPedidoForWhatsApp, openWhatsApp, copyToClipboard } from '../../utils/formatters';
import { useClientes } from '../../hooks/useClientes';
import { useProductos } from '../../hooks/useProductos';
import { useEtiquetas } from '../../hooks/useEtiquetas';
import './PedidosTable.scss';

interface PedidosTableProps {
  pedidos: Pedido[];
  onChangeStatus: (id: string, status: PedidoStatus) => void;
  onDelete: (id: string) => void;
  onArchive?: (id: string) => void;
  onRestore?: (id: string) => void;
  onAddAbono?: (id: string, monto: number, productoIndex?: number) => void;
  isArchived?: boolean;
}

const PedidosTable = ({ pedidos, onChangeStatus, onDelete, onArchive, onRestore, onAddAbono, isArchived = false }: PedidosTableProps) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [abonoInput, setAbonoInput] = useState<string>('');
  const [abonoProducto, setAbonoProducto] = useState<string>('general');
  const [abonoError, setAbonoError] = useState<string | null>(null);
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);
  const { clientes } = useClientes();
  const { productos: catalogoProductos } = useProductos();
  const { etiquetas: todasEtiquetas } = useEtiquetas();

  const getEtiquetasForClave = (clave?: string): Etiqueta[] => {
    if (!clave) return [];
    const producto = catalogoProductos.find(cp => cp.clave === clave);
    if (!producto?.etiquetas) return [];
    return producto.etiquetas
      .map(id => todasEtiquetas.find(e => e.id === id))
      .filter((e): e is Etiqueta => !!e);
  };

  const getClienteFoto = (pedido: Pedido): string | undefined => {
    if (pedido.clienteFoto) return pedido.clienteFoto;
    const cliente = clientes.find(c => c.telefono === pedido.clienteTelefono);
    return cliente?.fotoPerfil;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const handleCopy = async (pedido: Pedido) => {
    const message = formatPedidoForWhatsApp(pedido);
    const success = await copyToClipboard(message);
    if (success) {
      setCopiedId(pedido.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleWhatsApp = (pedido: Pedido) => {
    const message = formatPedidoForWhatsApp(pedido);
    openWhatsApp(pedido.clienteTelefono, message);
  };

  const toggleExpanded = (pedidoId: string) => {
    setExpandedId(expandedId === pedidoId ? null : pedidoId);
    setAbonoInput('');
    setAbonoProducto('general');
    setAbonoError(null);
  };

  const getTotalPagado = (pedido: Pedido) =>
    (pedido.abonos || []).reduce((sum, a) => sum + a.monto, 0);

  const handleAddAbono = (pedido: Pedido) => {
    const monto = parseFloat(abonoInput);
    if (!monto || monto <= 0 || !onAddAbono) return;
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

    const productoIndex = abonoProducto === 'general' ? undefined : parseInt(abonoProducto, 10);
    onAddAbono(pedido.id, monto, productoIndex);
    setAbonoInput('');
    setAbonoProducto('general');
  };

  return (
    <div className="pedidos-table-container">
      <table className="pedidos-table">
        <colgroup>
          <col style={{ width: '22%' }} />
          <col style={{ width: '6%' }} />
          <col style={{ width: '8%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '8%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '14%' }} />
        </colgroup>
        <thead>
          <tr>
            <th>Cliente</th>
            <th>C.P.</th>
            <th>Productos</th>
            <th>Abonado</th>
            <th>Total</th>
            <th>Estado</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((pedido) => {
            const isExpanded = expandedId === pedido.id;
            return (
              <Fragment key={pedido.id}>
                <tr
                  className={`pedidos-table__row ${isExpanded ? 'pedidos-table__row--expanded' : ''}`}
                >
                  <td>
                    <div className="pedidos-table__client">
                      <div className="pedidos-table__avatar">
                        {getClienteFoto(pedido) ? (
                          <img src={getClienteFoto(pedido)} alt={pedido.clienteNombre} />
                        ) : (
                          <span>{pedido.clienteNombre.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="pedidos-table__client-info">
                        <span className="pedidos-table__name" title={pedido.clienteNombre}>
                          {pedido.clienteNombre}
                        </span>
                        <span className="pedidos-table__phone">{pedido.clienteTelefono}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="pedidos-table__cp">{pedido.clienteCodigoPostal || '-'}</span>
                  </td>
                  <td>
                    <span className="pedidos-table__product-count">
                      {pedido.productos.reduce((sum, p) => sum + p.cantidad, 0)}
                    </span>
                  </td>
                  <td>
                    {(() => {
                      const pagado = getTotalPagado(pedido);
                      const porcentaje = pedido.total > 0 ? Math.round((pagado / pedido.total) * 100) : 0;
                      const status = pagado >= pedido.total ? 'paid' : pagado > 0 ? 'partial' : 'pending';
                      return (
                        <div className={`pedidos-table__paid pedidos-table__paid--${status}`}>
                          <span className="pedidos-table__paid-amount">{formatCurrency(pagado)}</span>
                          <span className="pedidos-table__paid-percent">{porcentaje}%</span>
                        </div>
                      );
                    })()}
                  </td>
                  <td>
                    {(() => {
                      const pagado = getTotalPagado(pedido);
                      const totalClass = pagado >= pedido.total
                        ? 'pedidos-table__total--paid'
                        : pagado > 0
                          ? 'pedidos-table__total--pending'
                          : '';
                      return (
                        <span className={`pedidos-table__total ${totalClass}`}>
                          {formatCurrency(pedido.total)}
                        </span>
                      );
                    })()}
                  </td>
                  <td>
                    <span
                      className="pedidos-table__status-dot-indicator"
                      style={{ backgroundColor: PEDIDO_STATUS_COLORS[pedido.estado] }}
                      title={PEDIDO_STATUS[pedido.estado]}
                    />
                  </td>
                  <td>
                    <span className="pedidos-table__date">{formatDate(pedido.fechaCreacion)}</span>
                  </td>
                  <td>
                    <div className="pedidos-table__actions">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleWhatsApp(pedido); }}
                        className="pedidos-table__action-btn pedidos-table__action-btn--whatsapp"
                        title="Enviar por WhatsApp"
                      >
                        <PiWhatsappLogoBold size={20} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(pedido.id); }}
                        className="pedidos-table__action-btn pedidos-table__action-btn--danger"
                        title="Eliminar pedido"
                      >
                        <PiTrashBold size={20} />
                      </button>
                      <span
                        className={`pedidos-table__expand-icon ${isExpanded ? 'pedidos-table__expand-icon--open' : ''}`}
                        onClick={() => toggleExpanded(pedido.id)}
                      >
                        <PiCaretDownBold size={16} />
                      </span>
                    </div>
                  </td>
                </tr>
                {isExpanded && (
                  <tr key={`${pedido.id}-expanded`} className="pedidos-table__expanded-row">
                    <td colSpan={8}>
                      <div className="pedidos-table__expanded-content">
                        {(() => {
                          const pagado = getTotalPagado(pedido);
                          const abonos = pedido.abonos || [];
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
                            <>
                              <div className="pedidos-table__payment-header">
                                <strong>Productos y pagos</strong>
                                <span className="pedidos-table__payment-info">
                                  {formatCurrency(pagado)} de {formatCurrency(pedido.total)}
                                </span>
                              </div>
                              <table className="pedidos-table__products-table">
                                <colgroup>
                                  <col style={{ width: '8%' }} />
                                  <col style={{ width: '6%' }} />
                                  <col style={{ width: '20%' }} />
                                  <col style={{ width: '10%' }} />
                                  <col style={{ width: '16%' }} />
                                  <col style={{ width: '14%' }} />
                                  <col style={{ width: '14%' }} />
                                  <col style={{ width: '12%' }} />
                                </colgroup>
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
                                      <tr key={index} className={`pedidos-table__product-row--${status}`}>
                                        <td>{p.clave ? <span className="pedidos-table__products-clave">{p.clave}</span> : '-'}</td>
                                        <td>{p.cantidad}</td>
                                        <td>{p.nombre}</td>
                                        <td>
                                          <div className="pedidos-table__etiquetas">
                                            {getEtiquetasForClave(p.clave).map(et => {
                                              const iconData = ETIQUETA_ICONS[et.icono];
                                              const Icon = iconData?.icon;
                                              return (
                                                <span
                                                  key={et.id}
                                                  className="pedidos-table__etiqueta"
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
                                          <div className="pedidos-table__product-paid-cell">
                                            <span>{formatCurrency(cubierto)}</span>
                                            <div className="pedidos-table__product-bar">
                                              <div
                                                className={`pedidos-table__product-bar-fill pedidos-table__product-bar-fill--${status}`}
                                                style={{ width: `${porcentaje}%` }}
                                              />
                                            </div>
                                          </div>
                                        </td>
                                        <td>{formatCurrency(p.subtotal)}</td>
                                        <td>
                                          <span className={`pedidos-table__product-status pedidos-table__product-status--${status}`}>
                                            {status === 'paid' ? 'Pagado' : status === 'partial' ? `${Math.round(porcentaje)}%` : 'Pendiente'}
                                          </span>
                                        </td>
                                        <td>
                                          <button
                                            className="pedidos-table__product-eye"
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
                                  <tr className="pedidos-table__product-total-row">
                                    <td><strong>Total</strong></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td><strong>{formatCurrency(pagado)}</strong></td>
                                    <td><strong>{formatCurrency(pedido.total)}</strong></td>
                                    <td>
                                      <strong className={pagado >= pedido.total ? 'pedidos-table__product-status--paid' : pagado > 0 ? 'pedidos-table__product-status--partial' : 'pedidos-table__product-status--pending'}>
                                        {pagado >= pedido.total ? 'Liquidado' : formatCurrency(pedido.total - pagado) + ' restante'}
                                      </strong>
                                    </td>
                                    <td></td>
                                  </tr>
                                </tbody>
                              </table>
                            </>
                          );
                        })()}

                        {pedido.notas && (
                          <div className="pedidos-table__expanded-notes">
                            <strong>Notas:</strong> {pedido.notas}
                          </div>
                        )}

                        <div className="pedidos-table__payment-section" onClick={(e) => e.stopPropagation()}>
                          {(() => {
                            const abonos = pedido.abonos || [];
                            return (
                              <>
                                {abonos.length > 0 && (
                                  <>
                                    <div className="pedidos-table__payment-header">
                                      <strong>Historial de abonos</strong>
                                    </div>
                                    <table className="pedidos-table__abonos-table">
                                      <colgroup>
                                        <col style={{ width: '10%' }} />
                                        <col style={{ width: '46%' }} />
                                        <col style={{ width: '24%' }} />
                                        <col style={{ width: '20%' }} />
                                      </colgroup>
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
                                                <span className="pedidos-table__products-clave">{pedido.productos[abono.productoIndex].clave}</span>
                                              ) : (
                                                <span>-</span>
                                              )}
                                            </td>
                                            <td>
                                              {typeof abono.productoIndex === 'number' && pedido.productos[abono.productoIndex] ? (
                                                <span>{pedido.productos[abono.productoIndex].nombre}</span>
                                              ) : (
                                                <span className="pedidos-table__payment-label--general">General</span>
                                              )}
                                            </td>
                                            <td>{formatCurrency(abono.monto)}</td>
                                            <td>{formatDate(abono.fecha)}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </>
                                )}
                                {onAddAbono && !isArchived && (
                                  <>
                                    <div className="pedidos-table__payment-form">
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
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') handleAddAbono(pedido);
                                        }}
                                      />
                                      <button
                                        className="btn btn--primary btn--sm"
                                        onClick={() => handleAddAbono(pedido)}
                                      >
                                        <PiPlusBold size={14} />
                                        Agregar abono
                                      </button>
                                    </div>
                                    {abonoError && expandedId === pedido.id && (
                                      <span className="pedidos-table__abono-error">{abonoError}</span>
                                    )}
                                  </>
                                )}
                              </>
                            );
                          })()}
                        </div>

                        <div className="pedidos-table__expanded-actions">
                          {!isArchived && (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleCopy(pedido); }}
                                className="btn btn--outline btn--sm"
                              >
                                <PiCopyBold size={16} />
                                {copiedId === pedido.id ? 'Copiado!' : 'Copiar'}
                              </button>
                              <Link
                                to={`/pedido/${pedido.id}/editar`}
                                className="btn btn--primary btn--sm"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <PiPencilBold size={16} />
                                Editar
                              </Link>
                              {pedido.estado !== 'entregado' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); onChangeStatus(pedido.id, 'entregado'); }}
                                  className={`pedidos-table__btn-entregado ${pedido.estado === 'en_preparacion' ? 'pedidos-table__btn-entregado--active' : ''}`}
                                  disabled={pedido.estado !== 'en_preparacion'}
                                >
                                  <PiCheckBold size={16} />
                                  Entregado
                                </button>
                              )}
                              {onArchive && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); onArchive(pedido.id); }}
                                  className="btn btn--secondary btn--sm"
                                >
                                  <PiArchiveBold size={16} />
                                  Archivar
                                </button>
                              )}
                            </>
                          )}
                          {isArchived && onRestore && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onRestore(pedido.id); }}
                              className="btn btn--primary btn--sm"
                            >
                              <PiArrowCounterClockwiseBold size={16} />
                              Restaurar
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>

      {selectedProducto && (
        <div className="pedidos-table__modal-overlay" onClick={() => setSelectedProducto(null)}>
          <div className="pedidos-table__modal" onClick={(e) => e.stopPropagation()}>
            <div className="pedidos-table__modal-header">
              <h3>Detalles del producto</h3>
              <button className="pedidos-table__modal-close" onClick={() => setSelectedProducto(null)}>
                <PiXBold size={18} />
              </button>
            </div>
            <div className="pedidos-table__modal-body">
              <div className="pedidos-table__modal-image">
                {selectedProducto.imagen ? (
                  <img src={selectedProducto.imagen} alt={selectedProducto.nombre} />
                ) : (
                  <div className="pedidos-table__modal-placeholder">
                    <PiPackageBold size={48} />
                    <span>Sin imagen</span>
                  </div>
                )}
              </div>
              <div className="pedidos-table__modal-section">
                <h4>Información</h4>
                <div className="pedidos-table__modal-info">
                  <div className="pedidos-table__modal-row">
                    <span className="pedidos-table__modal-label">Clave</span>
                    <span className="pedidos-table__modal-value">{selectedProducto.clave}</span>
                  </div>
                  <div className="pedidos-table__modal-row">
                    <span className="pedidos-table__modal-label">Nombre</span>
                    <span className="pedidos-table__modal-value">{selectedProducto.nombre}</span>
                  </div>
                  <div className="pedidos-table__modal-row">
                    <span className="pedidos-table__modal-label">Precio</span>
                    <span className="pedidos-table__modal-value">{formatCurrency(selectedProducto.precio)}</span>
                  </div>
                </div>
              </div>
              <div className="pedidos-table__modal-section">
                <h4>Descripción</h4>
                <p>{selectedProducto.descripcion || 'Sin descripción'}</p>
              </div>
            </div>
            <div className="pedidos-table__modal-footer">
              <button className="btn btn--secondary btn--sm" onClick={() => setSelectedProducto(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PedidosTable;
