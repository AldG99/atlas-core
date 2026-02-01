import { useState, useEffect, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { PiArchiveBold, PiTrashBold, PiArrowCounterClockwiseBold, PiCaretDownBold, PiWhatsappLogoBold, PiCopyBold, PiPencilBold, PiPlusBold } from 'react-icons/pi';
import type { Pedido, PedidoStatus } from '../../types/Pedido';
import { PEDIDO_STATUS, PEDIDO_STATUS_COLORS } from '../../constants/pedidoStatus';
import { formatPedidoForWhatsApp, openWhatsApp, copyToClipboard } from '../../utils/formatters';
import { useClientes } from '../../hooks/useClientes';
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
  const [statusMenuOpen, setStatusMenuOpen] = useState<string | null>(null);
  const { clientes } = useClientes();
  const statusOptions: PedidoStatus[] = ['pendiente', 'en_preparacion', 'entregado'];

  const handleStatusClick = (pedidoId: string) => {
    setStatusMenuOpen(statusMenuOpen === pedidoId ? null : pedidoId);
  };

  const handleStatusChange = (pedidoId: string, status: PedidoStatus) => {
    onChangeStatus(pedidoId, status);
    setStatusMenuOpen(null);
  };

  useEffect(() => {
    const handleClickOutside = () => {
      if (statusMenuOpen) {
        setStatusMenuOpen(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [statusMenuOpen]);

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
  };

  const getTotalPagado = (pedido: Pedido) =>
    (pedido.abonos || []).reduce((sum, a) => sum + a.monto, 0);

  const handleAddAbono = (pedidoId: string) => {
    const monto = parseFloat(abonoInput);
    if (!monto || monto <= 0 || !onAddAbono) return;
    const productoIndex = abonoProducto === 'general' ? undefined : parseInt(abonoProducto, 10);
    onAddAbono(pedidoId, monto, productoIndex);
    setAbonoInput('');
    setAbonoProducto('general');
  };

  return (
    <div className="pedidos-table-container">
      <table className="pedidos-table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>C.P.</th>
            <th>Abonado</th>
            <th>Total</th>
            <th>Estado</th>
            <th>Fecha</th>
            <th>Acciones</th>
            <th></th>
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
                    <div className="pedidos-table__status-wrapper">
                      <button
                        className="pedidos-table__status pedidos-table__status--clickable"
                        style={{ backgroundColor: PEDIDO_STATUS_COLORS[pedido.estado] }}
                        onClick={(e) => {
                          e.stopPropagation();
                          !isArchived && handleStatusClick(pedido.id);
                        }}
                        disabled={isArchived}
                      >
                        {PEDIDO_STATUS[pedido.estado]}
                        {!isArchived && (
                          <PiCaretDownBold size={12} />
                        )}
                      </button>
                      {statusMenuOpen === pedido.id && (
                        <div className="pedidos-table__status-menu" onClick={(e) => e.stopPropagation()}>
                          {statusOptions.map((status) => (
                            <button
                              key={status}
                              className={`pedidos-table__status-option ${pedido.estado === status ? 'pedidos-table__status-option--active' : ''}`}
                              onClick={() => handleStatusChange(pedido.id, status)}
                            >
                              <span
                                className="pedidos-table__status-dot"
                                style={{ backgroundColor: PEDIDO_STATUS_COLORS[status] }}
                              />
                              {PEDIDO_STATUS[status]}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="pedidos-table__date">{formatDate(pedido.fechaCreacion)}</span>
                  </td>
                  <td>
                    <div className="pedidos-table__actions">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleWhatsApp(pedido); }}
                        className="btn-icon btn-icon--whatsapp"
                        title="Enviar por WhatsApp"
                      >
                        <PiWhatsappLogoBold size={18} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(pedido.id); }}
                        className="btn-icon btn-icon--danger"
                        title="Eliminar pedido"
                      >
                        <PiTrashBold size={18} />
                      </button>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`pedidos-table__expand-icon ${isExpanded ? 'pedidos-table__expand-icon--open' : ''}`}
                      onClick={() => toggleExpanded(pedido.id)}
                    >
                      <PiCaretDownBold size={16} />
                    </span>
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
                                <thead>
                                  <tr>
                                    <th>Clave</th>
                                    <th>Cant.</th>
                                    <th>Producto</th>
                                    <th>Subtotal</th>
                                    <th>Abonado</th>
                                    <th>Estado</th>
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
                                        <td>{formatCurrency(p.subtotal)}</td>
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
                                        <td>
                                          <span className={`pedidos-table__product-status pedidos-table__product-status--${status}`}>
                                            {status === 'paid' ? 'Pagado' : status === 'partial' ? `${Math.round(porcentaje)}%` : 'Pendiente'}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                  <tr className="pedidos-table__product-total-row">
                                    <td colSpan={3}><strong>Total</strong></td>
                                    <td><strong>{formatCurrency(pedido.total)}</strong></td>
                                    <td><strong>{formatCurrency(pagado)}</strong></td>
                                    <td>
                                      <strong className={pagado >= pedido.total ? 'pedidos-table__product-status--paid' : pagado > 0 ? 'pedidos-table__product-status--partial' : 'pedidos-table__product-status--pending'}>
                                        {pagado >= pedido.total ? 'Liquidado' : formatCurrency(pedido.total - pagado) + ' restante'}
                                      </strong>
                                    </td>
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
                                    <ul className="pedidos-table__payment-list">
                                      {abonos.map((abono, i) => (
                                        <li key={i}>
                                          {formatCurrency(abono.monto)} — {formatDate(abono.fecha)}
                                          {typeof abono.productoIndex === 'number' && pedido.productos[abono.productoIndex] && (
                                            <span className="pedidos-table__payment-label"> → {pedido.productos[abono.productoIndex].clave && <span className="pedidos-table__products-clave">{pedido.productos[abono.productoIndex].clave}</span>} {pedido.productos[abono.productoIndex].nombre}</span>
                                          )}
                                        </li>
                                      ))}
                                    </ul>
                                  </>
                                )}
                                {onAddAbono && !isArchived && (
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
                                      onChange={(e) => setAbonoInput(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddAbono(pedido.id);
                                      }}
                                    />
                                    <button
                                      className="btn btn--primary btn--sm"
                                      onClick={() => handleAddAbono(pedido.id)}
                                    >
                                      <PiPlusBold size={14} />
                                      Agregar abono
                                    </button>
                                  </div>
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
    </div>
  );
};

export default PedidosTable;
