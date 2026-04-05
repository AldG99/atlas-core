import { useTranslation } from 'react-i18next';
import {
  PiArrowLeftBold,
  PiWhatsappLogoBold,
  PiCopyBold,
  PiCheckBold,
  PiTrashBold,
  PiDownloadSimpleBold,
} from 'react-icons/pi';
import type { Pedido } from '../../types/Pedido';

interface Props {
  pedido: Pedido;
  copiedId: boolean;
  downloading: boolean;
  submitting: boolean;
  role: string;
  liquidado: boolean;
  puedeMarcarEntregado: boolean;
  abonoInput: string;
  abonoProducto: string;
  abonoError: string | null;
  onBack: () => void;
  onWhatsApp: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onAbonoInputChange: (v: string) => void;
  onAbonoProductoChange: (v: string) => void;
  onAbonar: () => void;
  onEntregar: () => void;
}

const PedidoTopBar = ({
  pedido,
  copiedId,
  downloading,
  submitting,
  role,
  liquidado,
  puedeMarcarEntregado,
  abonoInput,
  abonoProducto,
  abonoError,
  onBack,
  onWhatsApp,
  onCopy,
  onDownload,
  onDelete,
  onAbonoInputChange,
  onAbonoProductoChange,
  onAbonar,
  onEntregar,
}: Props) => {
  const { t } = useTranslation();
  return (
    <div className="pedido-detail__top-bar">
      <div className="pedido-detail__top-bar-inner">
        <button
          className="pedido-detail__icon-btn pedido-detail__icon-btn--back"
          onClick={onBack}
          title={t('orders.detail.back')}
        >
          <PiArrowLeftBold size={20} />
        </button>
        <button
          onClick={onWhatsApp}
          className="pedido-detail__icon-btn pedido-detail__icon-btn--whatsapp"
          title={t('orders.detail.whatsapp')}
        >
          <PiWhatsappLogoBold size={20} />
        </button>
        <button
          onClick={onCopy}
          className={`pedido-detail__icon-btn ${copiedId ? 'pedido-detail__icon-btn--success' : ''}`}
          title={copiedId ? t('orders.detail.copied') : t('orders.detail.copy')}
        >
          {copiedId ? <PiCheckBold size={20} /> : <PiCopyBold size={20} />}
        </button>
        <button
          onClick={onDownload}
          className="pedido-detail__icon-btn"
          title={t('orders.detail.download')}
          disabled={downloading}
        >
          <PiDownloadSimpleBold size={20} />
        </button>
        {role === 'admin' && (
          <>
            <span className="pedido-detail__top-divider" />
            <button
              onClick={onDelete}
              className="pedido-detail__icon-btn pedido-detail__icon-btn--danger"
              title={t('orders.detail.delete')}
            >
              <PiTrashBold size={20} />
            </button>
          </>
        )}
        {!pedido.archivado && (
          <>
            <div className="pedido-detail__top-bar-abono-group">
              <div className="pedido-detail__top-bar-abono">
                <select
                  value={abonoProducto}
                  onChange={e => onAbonoProductoChange(e.target.value)}
                  disabled={liquidado}
                >
                  <option value="general">{t('orders.detail.generalPayment')}</option>
                  {pedido.productos.map((p, idx) => (
                    <option key={idx} value={idx}>
                      {p.clave ? `[${p.clave}] ` : ''}{p.nombre}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={t('orders.detail.payInputPlaceholder')}
                  value={abonoInput}
                  onChange={e => onAbonoInputChange(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') onAbonar(); }}
                  disabled={liquidado}
                />
              </div>
              <button
                className="btn btn--primary btn--sm"
                onClick={onAbonar}
                disabled={liquidado || submitting}
              >
                {submitting ? '...' : t('orders.detail.payButton')}
              </button>
            </div>
            <button
              onClick={onEntregar}
              className={`pedido-detail__btn-entregado ${puedeMarcarEntregado ? 'pedido-detail__btn-entregado--active' : ''} ${pedido.estado === 'entregado' ? 'pedido-detail__btn-entregado--done' : ''}`}
              disabled={!puedeMarcarEntregado || submitting}
            >
              {pedido.estado === 'entregado' ? t('orders.status.entregado') : t('orders.detail.deliver')}
            </button>
            {abonoError && (
              <span className="pedido-detail__top-bar-abono-error">{abonoError}</span>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PedidoTopBar;
