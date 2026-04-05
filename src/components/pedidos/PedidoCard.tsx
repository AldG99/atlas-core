import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Pedido, PedidoStatus } from '../../types/Pedido';
import { PEDIDO_STATUS_COLORS } from '../../constants/pedidoStatus';
import { buildMensajePedido, openWhatsApp, copyToClipboard } from '../../utils/formatters';
import { useCurrency } from '../../hooks/useCurrency';
import { useAuth } from '../../hooks/useAuth';
import { PLANTILLAS_DEFAULT } from '../../types/User';
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
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const statusOptions: PedidoStatus[] = ['pendiente', 'en_preparacion', 'entregado'];
  const { format, simbolo } = useCurrency();
  const { user } = useAuth();

  const getMensaje = () =>
    buildMensajePedido(pedido, user?.plantillas ?? PLANTILLAS_DEFAULT, simbolo, user?.nombreNegocio ?? '');

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(undefined, {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(getMensaje());
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsApp = () => {
    openWhatsApp(pedido.clienteTelefono, getMensaje());
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
          {t(`orders.status.${pedido.estado}`)}
        </span>
      </div>

      <div className="pedido-card__body">
        <div className="pedido-card__products">
          <strong>{t('orders.products')}:</strong>
          <p>{pedido.productos.map(p => `${p.cantidad}x ${p.nombre}`).join(', ')}</p>
        </div>

        {pedido.notas && (
          <div className="pedido-card__notes">
            <strong>{t('orders.notes')}:</strong>
            <p>{pedido.notas}</p>
          </div>
        )}

        <div className="pedido-card__total">
          <span>{t('common.total')}:</span>
          <strong>{format(pedido.total)}</strong>
        </div>
      </div>

      <div className="pedido-card__whatsapp">
        <button onClick={handleCopy} className="btn btn--outline">
          {copied ? t('orders.detail.copied') : t('orders.detail.copy')}
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
                    {t(`orders.status.${status}`)}
                  </option>
                ))}
              </select>

              {onArchive && (
                <button
                  onClick={() => onArchive(pedido.id)}
                  className="btn btn--secondary"
                >
                  {t('nav.archived')}
                </button>
              )}

              <button
                onClick={() => onDelete(pedido.id)}
                className="btn btn--danger"
              >
                {t('common.delete')}
              </button>
            </>
          )}

          {isArchived && onRestore && (
            <>
              <button
                onClick={() => onRestore(pedido.id)}
                className="btn btn--primary"
              >
                {t('archive.restore')}
              </button>
              <button
                onClick={() => onDelete(pedido.id)}
                className="btn btn--danger"
              >
                {t('common.delete')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PedidoCard;
