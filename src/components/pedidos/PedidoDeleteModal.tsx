import { PiXBold } from 'react-icons/pi';

interface Props {
  folio?: string;
  confirmText: string;
  onConfirmTextChange: (v: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

const PedidoDeleteModal = ({ folio, confirmText, onConfirmTextChange, onConfirm, onClose }: Props) => (
  <div className="pedido-detail__modal-overlay" onClick={onClose}>
    <div
      className="pedido-detail__modal pedido-detail__modal--confirm"
      onClick={e => e.stopPropagation()}
    >
      <div className="pedido-detail__modal-header">
        <h3>Eliminar pedido</h3>
        <button className="pedido-detail__modal-close" onClick={onClose}>
          <PiXBold size={18} />
        </button>
      </div>
      <div className="pedido-detail__modal-body pedido-detail__modal-body--confirm">
        <p>Esta acción es <strong>permanente</strong> y no se puede deshacer. Se eliminarán todos los datos del pedido.</p>
        <p className="pedido-detail__delete-label">
          Escribe <strong>{folio}</strong> para confirmar:
        </p>
        <input
          type="text"
          className="input"
          placeholder={folio}
          value={confirmText}
          onChange={e => onConfirmTextChange(e.target.value)}
          autoComplete="off"
        />
      </div>
      <div className="pedido-detail__modal-footer">
        <button className="btn btn--secondary btn--sm" onClick={onClose}>
          Cancelar
        </button>
        <button
          className="btn btn--danger btn--sm"
          onClick={onConfirm}
          disabled={confirmText !== folio}
        >
          Eliminar
        </button>
      </div>
    </div>
  </div>
);

export default PedidoDeleteModal;
