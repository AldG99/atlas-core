import { useState, useEffect, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { PiArchiveBold, PiTrashBold, PiArrowCounterClockwiseBold, PiCaretDownBold, PiWhatsappLogoBold, PiCopyBold, PiPencilBold } from 'react-icons/pi';
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
  isArchived?: boolean;
}

const PedidosTable = ({ pedidos, onChangeStatus, onDelete, onArchive, onRestore, isArchived = false }: PedidosTableProps) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
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
  };

  return (
    <div className="pedidos-table-container">
      <table className="pedidos-table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Producto</th>
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
                  onClick={() => toggleExpanded(pedido.id)}
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
                    <div className="pedidos-table__products">
                      <span className="pedidos-table__products-main">
                        {pedido.productos[0]?.nombre}
                      </span>
                      {pedido.productos.length > 1 && (
                        <span className="pedidos-table__products-more">
                          +{pedido.productos.length - 1} más
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="pedidos-table__total">{formatCurrency(pedido.total)}</span>
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
                    <span className={`pedidos-table__expand-icon ${isExpanded ? 'pedidos-table__expand-icon--open' : ''}`}>
                      <PiCaretDownBold size={16} />
                    </span>
                  </td>
                </tr>
                {isExpanded && (
                  <tr key={`${pedido.id}-expanded`} className="pedidos-table__expanded-row">
                    <td colSpan={7}>
                      <div className="pedidos-table__expanded-content">
                        <table className="pedidos-table__products-table">
                          <thead>
                            <tr>
                              <th>Clave</th>
                              <th>Cant.</th>
                              <th>Producto</th>
                              <th>Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pedido.productos.map((p, index) => (
                              <tr key={index}>
                                <td className="pedidos-table__products-clave">{p.clave || '-'}</td>
                                <td>{p.cantidad}</td>
                                <td>{p.nombre}</td>
                                <td>${p.subtotal.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {pedido.notas && (
                          <div className="pedidos-table__expanded-notes">
                            <strong>Notas:</strong> {pedido.notas}
                          </div>
                        )}

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
