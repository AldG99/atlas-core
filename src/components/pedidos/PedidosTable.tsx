import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PiEyeBold, PiArchiveBold, PiTrashBold, PiArrowCounterClockwiseBold, PiCaretDownBold, PiWhatsappLogoBold } from 'react-icons/pi';
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
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
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

  // Cerrar menú al hacer clic fuera
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

  const getCantidadTotal = (productos: string): number => {
    return productos.split('\n').reduce((total, linea) => {
      const match = linea.match(/^(\d+)x\s+/);
      return total + (match ? parseInt(match[1], 10) : 1);
    }, 0);
  };

  const getClave = (linea: string): string => {
    const match = linea.match(/\[(.+?)\]/);
    return match ? match[1] : '-';
  };

  const getNombreProducto = (linea: string): string => {
    // Quita "2x " del inicio, "[CLAVE] " y " - $100.00" del final
    return linea
      .replace(/^\d+x\s+/, '')
      .replace(/\[.+?\]\s*/, '')
      .replace(/\s+-\s+\$[\d,.]+$/, '');
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

  return (
    <div className="pedidos-table-container">
      <table className="pedidos-table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Clave</th>
            <th>Producto</th>
            <th>Cant.</th>
            <th>Total</th>
            <th>Estado</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((pedido) => (
            <tr key={pedido.id}>
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
                <span className="pedidos-table__clave">{getClave(pedido.productos.split('\n')[0])}</span>
              </td>
              <td>
                <div className="pedidos-table__products" title={pedido.productos}>
                  <span className="pedidos-table__products-main">
                    {getNombreProducto(pedido.productos.split('\n')[0])}
                  </span>
                  {pedido.productos.split('\n').length > 1 && (
                    <span className="pedidos-table__products-more">
                      +{pedido.productos.split('\n').length - 1} más
                    </span>
                  )}
                </div>
              </td>
              <td>
                <span className="pedidos-table__cantidad">{getCantidadTotal(pedido.productos)}</span>
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
                  {!isArchived && (
                    <>
                      <button
                        onClick={() => setSelectedPedido(pedido)}
                        className="btn-icon btn-icon--primary"
                        title="Ver detalles"
                      >
                        <PiEyeBold size={18} />
                      </button>

                      <button
                        onClick={() => handleWhatsApp(pedido)}
                        className="btn-icon btn-icon--whatsapp"
                        title="Enviar por WhatsApp"
                      >
                        <PiWhatsappLogoBold size={18} />
                      </button>

                      {onArchive && (
                        <button
                          onClick={() => onArchive(pedido.id)}
                          className="btn-icon btn-icon--secondary"
                          title="Archivar pedido"
                        >
                          <PiArchiveBold size={18} />
                        </button>
                      )}

                      <button
                        onClick={() => onDelete(pedido.id)}
                        className="btn-icon btn-icon--danger"
                        title="Eliminar pedido"
                      >
                        <PiTrashBold size={18} />
                      </button>
                    </>
                  )}

                  {isArchived && onRestore && (
                    <>
                      <button
                        onClick={() => onRestore(pedido.id)}
                        className="btn-icon btn-icon--primary"
                        title="Restaurar pedido"
                      >
                        <PiArrowCounterClockwiseBold size={18} />
                      </button>
                      <button
                        onClick={() => onDelete(pedido.id)}
                        className="btn-icon btn-icon--danger"
                        title="Eliminar pedido"
                      >
                        <PiTrashBold size={18} />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedPedido && (
        <div className="pedidos-table__modal-overlay" onClick={() => setSelectedPedido(null)}>
          <div className="pedidos-table__modal" onClick={(e) => e.stopPropagation()}>
            <div className="pedidos-table__modal-header">
              <h3>Detalles del Pedido</h3>
              <button
                className="pedidos-table__modal-close"
                onClick={() => setSelectedPedido(null)}
              >
                &times;
              </button>
            </div>

            <div className="pedidos-table__modal-body">
              <table className="pedidos-table__detail-table">
                <tbody>
                  <tr>
                    <td className="pedidos-table__detail-label">Cliente</td>
                    <td className="pedidos-table__detail-value">
                      <div className="pedidos-table__modal-client">
                        <div className="pedidos-table__modal-avatar">
                          {getClienteFoto(selectedPedido) ? (
                            <img src={getClienteFoto(selectedPedido)} alt={selectedPedido.clienteNombre} />
                          ) : (
                            <span>{selectedPedido.clienteNombre.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="pedidos-table__modal-client-info">
                          <span className="pedidos-table__modal-client-name">{selectedPedido.clienteNombre}</span>
                          <span className="pedidos-table__modal-client-phone">{selectedPedido.clienteTelefono}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="pedidos-table__detail-label">Productos</td>
                    <td className="pedidos-table__detail-value">
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
                          {selectedPedido.productos.split('\n').map((linea, index) => {
                            // Formato: "2x [CLAVE] Nombre - $100.00" o "2x Nombre - $100.00"
                            const matchConClave = linea.match(/^(\d+)x\s+\[(.+?)\]\s+(.+?)\s+-\s+(\$[\d,.]+)$/);
                            const matchSinClave = linea.match(/^(\d+)x\s+(.+?)\s+-\s+(\$[\d,.]+)$/);

                            if (matchConClave) {
                              return (
                                <tr key={index}>
                                  <td className="pedidos-table__products-clave">{matchConClave[2]}</td>
                                  <td>{matchConClave[1]}</td>
                                  <td>{matchConClave[3]}</td>
                                  <td>{matchConClave[4]}</td>
                                </tr>
                              );
                            }
                            if (matchSinClave) {
                              return (
                                <tr key={index}>
                                  <td className="pedidos-table__products-clave">-</td>
                                  <td>{matchSinClave[1]}</td>
                                  <td>{matchSinClave[2]}</td>
                                  <td>{matchSinClave[3]}</td>
                                </tr>
                              );
                            }
                            return (
                              <tr key={index}>
                                <td className="pedidos-table__products-clave">-</td>
                                <td>1</td>
                                <td colSpan={2}>{linea}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td className="pedidos-table__detail-label">Total</td>
                    <td className="pedidos-table__detail-value">
                      <span className="pedidos-table__modal-total">
                        {formatCurrency(selectedPedido.total)}
                      </span>
                    </td>
                  </tr>
                  {selectedPedido.notas && (
                    <tr>
                      <td className="pedidos-table__detail-label">Notas</td>
                      <td className="pedidos-table__detail-value">
                        <div className="pedidos-table__modal-notes">
                          {selectedPedido.notas}
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td className="pedidos-table__detail-label">Estado</td>
                    <td className="pedidos-table__detail-value">
                      <span
                        className="pedidos-table__status"
                        style={{ backgroundColor: PEDIDO_STATUS_COLORS[selectedPedido.estado] }}
                      >
                        {PEDIDO_STATUS[selectedPedido.estado]}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="pedidos-table__detail-label">Fecha</td>
                    <td className="pedidos-table__detail-value">
                      {formatDate(selectedPedido.fechaCreacion)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="pedidos-table__modal-footer">
              <button
                onClick={() => {
                  handleWhatsApp(selectedPedido);
                }}
                className="btn btn--whatsapp"
              >
                <PiWhatsappLogoBold size={16} />
                WhatsApp
              </button>
              <button
                onClick={() => {
                  handleCopy(selectedPedido);
                }}
                className="btn btn--outline"
              >
                {copiedId === selectedPedido.id ? 'Copiado!' : 'Copiar'}
              </button>
              <Link
                to={`/pedido/${selectedPedido.id}/editar`}
                className="btn btn--primary"
              >
                Editar
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PedidosTable;
