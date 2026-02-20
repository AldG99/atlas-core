import { useNavigate } from 'react-router-dom';
import { PiStarFill } from 'react-icons/pi';
import type { Cliente } from '../../types/Cliente';
import { getCodigoPais } from '../../data/codigosPais';
import { formatTelefono } from '../../utils/formatters';
import './ClientesTable.scss';

interface ClientesTableProps {
  clientes: Cliente[];
  loading?: boolean;
  error?: string | null;
  searchTerm?: string;
}

const ClientesTable = ({ clientes, loading, error, searchTerm }: ClientesTableProps) => {
  const navigate = useNavigate();

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="clientes-table-wrapper">
      <div className="clientes-table-header">
        <table className="clientes-table">
          <colgroup>
            <col style={{ width: '22%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '7%' }} />
            <col style={{ width: '12%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Teléfono</th>
              <th>Calle</th>
              <th>Colonia / Ciudad</th>
              <th>C.P.</th>
              <th>Registro</th>
            </tr>
          </thead>
        </table>
      </div>
      <div className="clientes-table-container">
        <table className="clientes-table">
          <colgroup>
            <col style={{ width: '22%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '7%' }} />
            <col style={{ width: '12%' }} />
          </colgroup>
          <tbody>
          {loading ? (
            <tr>
              <td colSpan={6} className="clientes-table__empty">
                Cargando clientes...
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td colSpan={6} className="clientes-table__empty clientes-table__empty--error">
                {error}
              </td>
            </tr>
          ) : clientes.length === 0 ? (
            <tr>
              <td colSpan={6} className="clientes-table__empty">
                {searchTerm?.trim() ? `No se encontraron clientes para "${searchTerm}"` : 'No hay ningún cliente registrado'}
              </td>
            </tr>
          ) : clientes.map((cliente) => (
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
                  <span className="clientes-table__name" title={`${cliente.nombre} ${cliente.apellido}`}>
                    {cliente.nombre} {cliente.apellido}
                  </span>
                  {cliente.favorito && <PiStarFill size={14} className="clientes-table__fav-icon" />}
                </div>
              </td>
              <td>
                <span className="clientes-table__phone">
                  {cliente.telefonoCodigoPais
                    ? `${getCodigoPais(cliente.telefonoCodigoPais)?.codigo ?? ''} ${formatTelefono(cliente.telefono)}`
                    : formatTelefono(cliente.telefono)}
                </span>
              </td>
              <td>
                <span className="clientes-table__address" title={`${cliente.calle} ${cliente.numeroExterior}`}>
                  {cliente.calle} {cliente.numeroExterior}
                </span>
              </td>
              <td>
                <span className="clientes-table__address" title={`${cliente.colonia}, ${cliente.ciudad}`}>
                  {cliente.colonia}, {cliente.ciudad}
                </span>
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

      {clientes.length > 0 && (
        <div className="clientes-table__pagination">
          <span className="clientes-table__page-info">
            {clientes.length} {clientes.length === 1 ? 'cliente' : 'clientes'}
          </span>
        </div>
      )}
    </div>
  );
};

export default ClientesTable;
