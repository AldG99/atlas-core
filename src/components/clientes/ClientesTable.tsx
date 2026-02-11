import { useNavigate } from 'react-router-dom';
import { PiStarFill } from 'react-icons/pi';
import type { Cliente } from '../../types/Cliente';
import './ClientesTable.scss';

interface ClientesTableProps {
  clientes: Cliente[];
}

const ClientesTable = ({ clientes }: ClientesTableProps) => {
  const navigate = useNavigate();
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="clientes-table-container">
      <table className="clientes-table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Dirección</th>
            <th>C.P.</th>
            <th>Registro</th>
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
                    <div className="clientes-table__name-row">
                      <span className="clientes-table__name" title={`${cliente.nombre} ${cliente.apellido}`}>
                        {cliente.nombre} {cliente.apellido}
                      </span>
                      {cliente.favorito && <PiStarFill size={14} className="clientes-table__fav-icon" />}
                    </div>
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
                <span className="clientes-table__date">
                  {formatDate(cliente.fechaCreacion)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ClientesTable;
