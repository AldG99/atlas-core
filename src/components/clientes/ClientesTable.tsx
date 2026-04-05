import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PiStarFill } from 'react-icons/pi';
import type { Cliente } from '../../types/Cliente';
import { getCodigoPais } from '../../data/codigosPais';
import { formatTelefono } from '../../utils/formatters';
import Avatar from '../ui/Avatar';
import './ClientesTable.scss';

interface ClientesTableProps {
  clientes: Cliente[];
  loading?: boolean;
  error?: string | null;
  searchTerm?: string;
}

const ClientesTable = ({ clientes, loading, error, searchTerm }: ClientesTableProps) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [focusedRow, setFocusedRow] = useState<number | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(i18n.language, {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  useEffect(() => {
    if (!clientes.length) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (['input', 'select', 'textarea'].includes(tag)) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedRow(prev => prev === null ? 0 : Math.min(prev + 1, clientes.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedRow(prev => prev === null ? 0 : Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && focusedRow !== null) {
        e.preventDefault();
        navigate(`/cliente/${clientes[focusedRow].id}`, { state: { from: location.pathname } });
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [clientes, focusedRow, navigate, location.pathname]);

  useEffect(() => {
    if (focusedRow === null || !tableContainerRef.current) return;
    const rows = tableContainerRef.current.querySelectorAll('tr');
    const row = rows[focusedRow];
    if (row) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [focusedRow]);

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
              <th>{t('clients.table.client')}</th>
              <th>{t('clients.table.phone')}</th>
              <th>{t('clients.table.street')}</th>
              <th>{t('clients.table.colonyCity')}</th>
              <th>{t('clients.table.postal')}</th>
              <th>{t('clients.table.registration')}</th>
            </tr>
          </thead>
        </table>
      </div>
      <div ref={tableContainerRef} className="clientes-table-container">
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
                {t('clients.loadingClients')}
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
                {searchTerm?.trim() ? t('clients.noClientsSearch', { term: searchTerm }) : t('clients.noClients')}
              </td>
            </tr>
          ) : clientes.map((cliente, index) => (
            <tr
              key={cliente.id}
              className={`clientes-table__row${focusedRow === index ? ' clientes-table__row--focused' : ''}`}
              onClick={() => navigate(`/cliente/${cliente.id}`, { state: { from: location.pathname } })}
              onMouseEnter={() => setFocusedRow(index)}
            >
              <td>
                <div className="clientes-table__client">
                  <div className="clientes-table__avatar">
                    <Avatar
                      src={cliente.fotoPerfil}
                      initials={`${cliente.nombre[0]}${cliente.apellido[0]}`}
                      alt={cliente.nombre}
                    />
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
            {t('clients.count', { count: clientes.length })}
          </span>
        </div>
      )}
    </div>
  );
};

export default ClientesTable;
