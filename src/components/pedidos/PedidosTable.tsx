import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
            <th>Productos</th>
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
                <div className="pedidos-table__products" title={pedido.productos}>
                  <span className="pedidos-table__products-main">
                    {pedido.productos.split('\n')[0]}
                  </span>
                  {pedido.productos.split('\n').length > 1 && (
                    <span className="pedidos-table__products-more">
                      +{pedido.productos.split('\n').length - 1} más
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
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
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
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      </button>

                      <button
                        onClick={() => handleWhatsApp(pedido)}
                        className="btn-icon btn-icon--whatsapp"
                        title="Enviar por WhatsApp"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      </button>

                      {onArchive && (
                        <button
                          onClick={() => onArchive(pedido.id)}
                          className="btn-icon btn-icon--secondary"
                          title="Archivar pedido"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="21 8 21 21 3 21 3 8"></polyline>
                            <rect x="1" y="3" width="22" height="5"></rect>
                            <line x1="10" y1="12" x2="14" y2="12"></line>
                          </svg>
                        </button>
                      )}

                      <button
                        onClick={() => onDelete(pedido.id)}
                        className="btn-icon btn-icon--danger"
                        title="Eliminar pedido"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
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
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="1 4 1 10 7 10"></polyline>
                          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                        </svg>
                      </button>
                      <button
                        onClick={() => onDelete(pedido.id)}
                        className="btn-icon btn-icon--danger"
                        title="Eliminar pedido"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
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
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
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
