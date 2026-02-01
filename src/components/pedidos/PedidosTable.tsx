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
                <span className="pedidos-table__clave">{pedido.productos[0]?.clave || '-'}</span>
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
                <span className="pedidos-table__cantidad">{pedido.productos.reduce((sum, p) => sum + p.cantidad, 0)}</span>
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
                          {selectedPedido.productos.map((p, index) => (
                            <tr key={index}>
                              <td className="pedidos-table__products-clave">{p.clave || '-'}</td>
                              <td>{p.cantidad}</td>
                              <td>{p.nombre}</td>
                              <td>${p.subtotal.toFixed(2)}</td>
                            </tr>
                          ))}
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
