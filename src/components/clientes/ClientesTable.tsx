import type { Cliente } from '../../types/Cliente';
import './ClientesTable.scss';

interface ClientesTableProps {
  clientes: Cliente[];
  onView: (cliente: Cliente) => void;
  onDelete: (id: string) => void;
}

const ClientesTable = ({ clientes, onView, onDelete }: ClientesTableProps) => {
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
            <th>Dirección</th>
            <th>C.P.</th>
            <th>Entrega</th>
            <th>Registro</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((cliente) => (
            <tr key={cliente.id}>
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
                <span className="clientes-table__schedule">
                  {cliente.horarioEntrega || '—'}
                </span>
              </td>
              <td>
                <span className="clientes-table__date">
                  {formatDate(cliente.fechaCreacion)}
                </span>
              </td>
              <td>
                <div className="clientes-table__actions">
                  <button
                    onClick={() => onView(cliente)}
                    className="btn-icon btn-icon--primary"
                    title="Ver detalles"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleWhatsApp(cliente.telefono)}
                    className="btn-icon btn-icon--whatsapp"
                    title="Enviar WhatsApp"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => onDelete(cliente.id)}
                    className="btn-icon btn-icon--danger"
                    title="Eliminar cliente"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
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
