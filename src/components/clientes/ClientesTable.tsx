import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PiStarFill, PiCaretLeftBold, PiCaretRightBold } from 'react-icons/pi';
import type { Cliente } from '../../types/Cliente';
import './ClientesTable.scss';

const PAGE_SIZE = 10;

interface ClientesTableProps {
  clientes: Cliente[];
}

const ClientesTable = ({ clientes }: ClientesTableProps) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [clientes.length]);

  const totalPages = Math.ceil(clientes.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedClientes = clientes.slice(startIndex, startIndex + PAGE_SIZE);

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
        <tbody>
          {paginatedClientes.map((cliente) => (
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
                <span className="clientes-table__phone">{cliente.telefono}</span>
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

      {totalPages > 1 && (
        <div className="clientes-table__pagination">
          <button
            className="clientes-table__page-btn"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <PiCaretLeftBold size={16} />
          </button>
          <span className="clientes-table__page-info">
            {currentPage} / {totalPages}
          </span>
          <button
            className="clientes-table__page-btn"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <PiCaretRightBold size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ClientesTable;
