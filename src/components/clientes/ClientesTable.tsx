import { useNavigate } from 'react-router-dom';
import { PiTrashBold, PiWhatsappLogoBold, PiStarFill } from 'react-icons/pi';
import type { Cliente } from '../../types/Cliente';
import './ClientesTable.scss';

interface ClientesTableProps {
  clientes: Cliente[];
  onDelete: (id: string) => void;
}

const ClientesTable = ({ clientes, onDelete }: ClientesTableProps) => {
  const navigate = useNavigate();
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  const handleWhatsApp = (telefono: string) => {
    const cleanPhone = telefono.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  return (
    <div className="clientes-table-container">
      <table className="clientes-table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th className="clientes-table__th-fav"></th>
            <th>Dirección</th>
            <th>C.P.</th>
            <th>Registro</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((cliente) => (
            <tr key={cliente.id} className="clientes-table__row" onClick={() => navigate(`/cliente/${cliente.id}`)}>
              <td>
                <div className="clientes-table__client">
                  <div className="clientes-table__avatar">
                    {cliente.fotoPerfil ? (
                      <img src={cliente.fotoPerfil} alt={cliente.nombre} />
                    ) : (
                      <span>{cliente.nombre[0]}{cliente.apellido[0]}</span>
                    )}
                  </div>
                  <div className="clientes-table__info">
                    <span className="clientes-table__name" title={`${cliente.nombre} ${cliente.apellido}`}>
                      {cliente.nombre} {cliente.apellido}
                    </span>
                    <span className="clientes-table__phone-sub">{cliente.telefono}</span>
                  </div>
                </div>
              </td>
              <td className="clientes-table__td-fav">
                {cliente.favorito && <PiStarFill size={16} className="clientes-table__fav-icon" />}
              </td>
              <td>
                <div className="clientes-table__address" title={`${cliente.calle} ${cliente.numeroExterior}, ${cliente.colonia}, ${cliente.ciudad}, CP ${cliente.codigoPostal}`}>
                  <span className="clientes-table__address-main">
                    {cliente.calle} {cliente.numeroExterior}
                  </span>
                  <span className="clientes-table__address-secondary">
                    {cliente.colonia}, {cliente.ciudad}
                  </span>
                </div>
              </td>
              <td>
                <span className="clientes-table__cp">{cliente.codigoPostal}</span>
              </td>
              <td>
                <span className="clientes-table__date">
                  {formatDate(cliente.fechaCreacion)}
                </span>
              </td>
              <td>
                <div className="clientes-table__actions">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleWhatsApp(cliente.telefono); }}
                    className="btn-icon btn-icon--whatsapp"
                    title="Enviar WhatsApp"
                  >
                    <PiWhatsappLogoBold size={18} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(cliente.id); }}
                    className="btn-icon btn-icon--danger"
                    title="Eliminar cliente"
                  >
                    <PiTrashBold size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ClientesTable;
