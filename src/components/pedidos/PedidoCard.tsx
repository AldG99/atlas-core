import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Pedido, PedidoStatus } from '../../types/Pedido';
import { PEDIDO_STATUS, PEDIDO_STATUS_COLORS } from '../../constants/pedidoStatus';
import { formatPedidoForWhatsApp, openWhatsApp, copyToClipboard } from '../../utils/formatters';
import './PedidoCard.scss';

interface PedidoCardProps {
  pedido: Pedido;
  onChangeStatus: (id: string, status: PedidoStatus) => void;
  onDelete: (id: string) => void;
  onArchive?: (id: string) => void;
  onRestore?: (id: string) => void;
  isArchived?: boolean;
}

const PedidoCard = ({ pedido, onChangeStatus, onDelete, onArchive, onRestore, isArchived = false }: PedidoCardProps) => {
  const [copied, setCopied] = useState(false);
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

  const handleCopy = async () => {
    const message = formatPedidoForWhatsApp(pedido);
    const success = await copyToClipboard(message);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsApp = () => {
    const message = formatPedidoForWhatsApp(pedido);
    openWhatsApp(pedido.clienteTelefono, message);
  };

  return (
    <div className="pedido-card">
      <div className="pedido-card__header">
        <div className="pedido-card__client">
          <h3 className="pedido-card__name">{pedido.clienteNombre}</h3>
          <span className="pedido-card__phone">{pedido.clienteTelefono}</span>
        </div>
        <span
          className="pedido-card__status"
          style={{ backgroundColor: PEDIDO_STATUS_COLORS[pedido.estado] }}
        >
          {PEDIDO_STATUS[pedido.estado]}
        </span>
      </div>

      <div className="pedido-card__body">
        <div className="pedido-card__products">
          <strong>Productos:</strong>
          <p>{pedido.productos}</p>
        </div>

        {pedido.notas && (
          <div className="pedido-card__notes">
            <strong>Notas:</strong>
            <p>{pedido.notas}</p>
          </div>
        )}

        <div className="pedido-card__total">
          <span>Total:</span>
          <strong>{formatCurrency(pedido.total)}</strong>
        </div>
      </div>

      <div className="pedido-card__whatsapp">
        <button onClick={handleCopy} className="btn btn--outline">
          {copied ? 'Copiado!' : 'Copiar'}
        </button>
        <button onClick={handleWhatsApp} className="btn btn--whatsapp">
          WhatsApp
        </button>
      </div>

      <div className="pedido-card__footer">
        <span className="pedido-card__date">{formatDate(pedido.fechaCreacion)}</span>

        <div className="pedido-card__actions">
          {!isArchived && (
            <>
              <select
                value={pedido.estado}
                onChange={(e) => onChangeStatus(pedido.id, e.target.value as PedidoStatus)}
                className="pedido-card__select"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {PEDIDO_STATUS[status]}
                  </option>
                ))}
              </select>

              <Link to={`/pedido/${pedido.id}/editar`} className="btn btn--secondary">
                Editar
              </Link>

              {onArchive && (
                <button
                  onClick={() => onArchive(pedido.id)}
                  className="btn btn--secondary"
                >
                  Archivar
                </button>
              )}

              <button
                onClick={() => onDelete(pedido.id)}
                className="btn btn--danger"
              >
                Eliminar
              </button>
            </>
          )}

          {isArchived && onRestore && (
            <>
              <button
                onClick={() => onRestore(pedido.id)}
                className="btn btn--primary"
              >
                Restaurar
              </button>
              <button
                onClick={() => onDelete(pedido.id)}
                className="btn btn--danger"
              >
                Eliminar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PedidoCard;
