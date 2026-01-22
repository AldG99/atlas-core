import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Pedido, PedidoStatus } from '../../types/Pedido';
import { PEDIDO_STATUS, PEDIDO_STATUS_COLORS } from '../../constants/pedidoStatus';
import { formatPedidoForWhatsApp, openWhatsApp, copyToClipboard } from '../../utils/formatters';
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
  const statusOptions: PedidoStatus[] = ['pendiente', 'en_preparacion', 'entregado'];

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
                  <span className="pedidos-table__name">{pedido.clienteNombre}</span>
                  <span className="pedidos-table__phone">{pedido.clienteTelefono}</span>
                </div>
              </td>
              <td>
                <div className="pedidos-table__products">
                  {pedido.productos}
                  {pedido.notas && (
                    <span className="pedidos-table__notes">Nota: {pedido.notas}</span>
                  )}
                </div>
              </td>
              <td>
                <span className="pedidos-table__total">{formatCurrency(pedido.total)}</span>
              </td>
              <td>
                <span
                  className="pedidos-table__status"
                  style={{ backgroundColor: PEDIDO_STATUS_COLORS[pedido.estado] }}
                >
                  {PEDIDO_STATUS[pedido.estado]}
                </span>
              </td>
              <td>
                <span className="pedidos-table__date">{formatDate(pedido.fechaCreacion)}</span>
              </td>
              <td>
                <div className="pedidos-table__actions">
                  {!isArchived && (
                    <>
                      <select
                        value={pedido.estado}
                        onChange={(e) => onChangeStatus(pedido.id, e.target.value as PedidoStatus)}
                        className="pedidos-table__select"
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {PEDIDO_STATUS[status]}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => handleCopy(pedido)}
                        className="btn btn--sm btn--outline"
                        title="Copiar para WhatsApp"
                      >
                        {copiedId === pedido.id ? 'Copiado!' : 'Copiar'}
                      </button>

                      <button
                        onClick={() => handleWhatsApp(pedido)}
                        className="btn btn--sm btn--whatsapp"
                        title="Enviar por WhatsApp"
                      >
                        WhatsApp
                      </button>

                      <Link
                        to={`/pedido/${pedido.id}/editar`}
                        className="btn btn--sm btn--secondary"
                        title="Editar pedido"
                      >
                        Editar
                      </Link>

                      {onArchive && (
                        <button
                          onClick={() => onArchive(pedido.id)}
                          className="btn btn--sm btn--secondary"
                          title="Archivar pedido"
                        >
                          Archivar
                        </button>
                      )}

                      <button
                        onClick={() => onDelete(pedido.id)}
                        className="btn btn--sm btn--danger"
                        title="Eliminar pedido"
                      >
                        Eliminar
                      </button>
                    </>
                  )}

                  {isArchived && onRestore && (
                    <>
                      <button
                        onClick={() => onRestore(pedido.id)}
                        className="btn btn--sm btn--primary"
                      >
                        Restaurar
                      </button>
                      <button
                        onClick={() => onDelete(pedido.id)}
                        className="btn btn--sm btn--danger"
                      >
                        Eliminar
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PedidosTable;
