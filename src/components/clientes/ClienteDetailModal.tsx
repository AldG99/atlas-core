import type { Cliente } from '../../types/Cliente';
import './ClienteDetailModal.scss';

interface ClienteDetailModalProps {
  cliente: Cliente;
  onClose: () => void;
  onEdit: () => void;
  onWhatsApp: () => void;
}

const ClienteDetailModal = ({ cliente, onClose, onEdit, onWhatsApp }: ClienteDetailModalProps) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const getFullAddress = () => {
    const numInterior = cliente.numeroInterior ? `, Int. ${cliente.numeroInterior}` : '';
    return `${cliente.calle} ${cliente.numeroExterior}${numInterior}, ${cliente.colonia}, ${cliente.ciudad}, CP ${cliente.codigoPostal}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal cliente-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>Detalles del Cliente</h2>
          <button className="modal__close" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="modal__body cliente-detail-modal__body">
          {/* Header con avatar y nombre */}
          <div className="cliente-detail-modal__header">
            <div className="cliente-detail-modal__avatar">
              {cliente.fotoPerfil ? (
                <img src={cliente.fotoPerfil} alt={cliente.nombre} />
              ) : (
                <span>{cliente.nombre[0]}{cliente.apellido?.[0] ?? ''}</span>
              )}
            </div>
            <div className="cliente-detail-modal__title">
              <h3>{cliente.nombre} {cliente.apellido}</h3>
              <span className="cliente-detail-modal__date">
                Cliente desde {formatDate(cliente.fechaCreacion)}
              </span>
            </div>
          </div>

          {/* Secciones de información */}
          <div className="cliente-detail-modal__sections">
            {/* Contacto */}
            <div className="cliente-detail-modal__section">
              <h4>Contacto</h4>
              <div className="cliente-detail-modal__grid">
                <div className="cliente-detail-modal__field">
                  <label>Teléfono</label>
                  <span>{cliente.telefono}</span>
                </div>
                {cliente.telefonoSecundario && (
                  <div className="cliente-detail-modal__field">
                    <label>Teléfono secundario</label>
                    <span>{cliente.telefonoSecundario}</span>
                  </div>
                )}
                {cliente.correo && (
                  <div className="cliente-detail-modal__field">
                    <label>Correo</label>
                    <span>{cliente.correo}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Dirección */}
            <div className="cliente-detail-modal__section">
              <h4>Dirección de entrega</h4>
              <div className="cliente-detail-modal__field cliente-detail-modal__field--full">
                <label>Dirección completa</label>
                <span>{getFullAddress()}</span>
              </div>
              {cliente.referencia && (
                <div className="cliente-detail-modal__field cliente-detail-modal__field--full">
                  <label>Referencia</label>
                  <span>{cliente.referencia}</span>
                </div>
              )}
            </div>

            {/* Entrega */}
            <div className="cliente-detail-modal__section">
              <h4>Información de entrega</h4>
              <div className="cliente-detail-modal__grid">
                <div className="cliente-detail-modal__field">
                  <label>Número visible</label>
                  <span className={`cliente-detail-modal__badge ${cliente.numeroVisible ? 'cliente-detail-modal__badge--success' : 'cliente-detail-modal__badge--warning'}`}>
                    {cliente.numeroVisible ? 'Sí, es visible' : 'No es visible'}
                  </span>
                </div>
                {cliente.horarioEntrega && (
                  <div className="cliente-detail-modal__field">
                    <label>Horario preferido</label>
                    <span>{cliente.horarioEntrega}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Notas */}
            {cliente.notas && (
              <div className="cliente-detail-modal__section">
                <h4>Notas</h4>
                <div className="cliente-detail-modal__field cliente-detail-modal__field--full">
                  <p className="cliente-detail-modal__notes">{cliente.notas}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal__actions">
          <button className="btn btn--whatsapp" onClick={onWhatsApp}>
            WhatsApp
          </button>
          <button className="btn btn--primary" onClick={onEdit}>
            Editar cliente
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClienteDetailModal;
