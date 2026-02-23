import { PiXBold } from 'react-icons/pi';
import type { Cliente } from '../../types/Cliente';
import { getCodigoPais } from '../../data/codigosPais';
import { formatTelefono } from '../../utils/formatters';
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

  const getPostalAddress = () => {
    const numInterior = cliente.numeroInterior ? `, Int. ${cliente.numeroInterior}` : '';
    return {
      line1: `${cliente.calle} ${cliente.numeroExterior}${numInterior}`,
      line2: cliente.colonia,
      line3: cliente.ciudad,
      line4: `CP ${cliente.codigoPostal}`,
      line5: cliente.pais
    };
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal cliente-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>Detalles del Cliente</h2>
          <button className="modal__close" onClick={onClose}>
            <PiXBold size={24} />
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
                  <span>
                    {cliente.telefonoCodigoPais
                      ? `${getCodigoPais(cliente.telefonoCodigoPais)?.codigo ?? ''} ${formatTelefono(cliente.telefono)}`
                      : formatTelefono(cliente.telefono)}
                  </span>
                </div>
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
              <h4>Dirección</h4>
              {(() => {
                const addr = getPostalAddress();
                return (
                  <div className="cliente-detail-modal__address">
                    <p>{addr.line1}</p>
                    <p>{addr.line2}</p>
                    <p>{addr.line3}</p>
                    <p>{addr.line4}</p>
                    {addr.line5 && <p>{addr.line5}</p>}
                    {cliente.referencia && (
                      <p className="cliente-detail-modal__address-ref">Ref: {cliente.referencia}</p>
                    )}
                  </div>
                );
              })()}
            </div>


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
