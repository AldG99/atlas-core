import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PiStarFill } from 'react-icons/pi';
import type { Client } from '../../types/Client';
import { getCountryCode } from '../../data/countryCodes';
import { formatPhone } from '../../utils/formatters';
import Avatar from '../ui/Avatar';
import './ClientsTable.scss';

interface ClientsTableProps {
  clients: Client[];
  loading?: boolean;
  error?: string | null;
  searchTerm?: string;
}

const ClientsTable = ({ clients, loading, error, searchTerm }: ClientsTableProps) => {
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
    if (!clients.length) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (['input', 'select', 'textarea'].includes(tag)) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedRow(prev => prev === null ? 0 : Math.min(prev + 1, clients.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedRow(prev => prev === null ? 0 : Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && focusedRow !== null) {
        e.preventDefault();
        navigate(`/clients/${clients[focusedRow].id}`, { state: { from: location.pathname } });
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [clients, focusedRow, navigate, location.pathname]);

  useEffect(() => {
    if (focusedRow === null || !tableContainerRef.current) return;
    const rows = tableContainerRef.current.querySelectorAll('tr');
    const row = rows[focusedRow];
    if (row) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [focusedRow]);

  return (
    <div className="clients-table-wrapper">
      <div className="clients-table-header">
        <table className="clients-table">
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
      <div ref={tableContainerRef} className="clients-table-container">
        <table className="clients-table">
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
              <td colSpan={6} className="clients-table__empty">
                {t('clients.loadingClients')}
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td colSpan={6} className="clients-table__empty clients-table__empty--error">
                {error}
              </td>
            </tr>
          ) : clients.length === 0 ? (
            <tr>
              <td colSpan={6} className="clients-table__empty">
                {searchTerm?.trim() ? t('clients.noClientsSearch', { term: searchTerm }) : t('clients.noClients')}
              </td>
            </tr>
          ) : clients.map((client, index) => (
            <tr
              key={client.id}
              className={`clients-table__row${focusedRow === index ? ' clients-table__row--focused' : ''}`}
              onClick={() => navigate(`/clients/${client.id}`, { state: { from: location.pathname } })}
              onMouseEnter={() => setFocusedRow(index)}
            >
              <td>
                <div className="clients-table__client">
                  <div className="clients-table__avatar">
                    <Avatar
                      src={client.profilePhoto}
                      seed={client.id}
                      alt={client.firstName}
                    />
                  </div>
                  <span className="clients-table__name" title={`${client.firstName} ${client.lastName}`}>
                    {client.firstName} {client.lastName}
                  </span>
                  {client.favorite && <PiStarFill size={14} className="clients-table__fav-icon" />}
                </div>
              </td>
              <td>
                <span className="clients-table__phone">
                  {client.phoneCountryCode
                    ? `${getCountryCode(client.phoneCountryCode)?.code ?? ''} ${formatPhone(client.phone)}`
                    : formatPhone(client.phone)}
                </span>
              </td>
              <td>
                <span className="clients-table__address" title={`${client.street} ${client.exteriorNumber}`}>
                  {client.street} {client.exteriorNumber}
                </span>
              </td>
              <td>
                <span className="clients-table__address" title={`${client.neighborhood}, ${client.city}`}>
                  {client.neighborhood}, {client.city}
                </span>
              </td>
              <td>
                <span className="clients-table__postal">{client.postalCode}</span>
              </td>
              <td>
                <span className="clients-table__date">
                  {formatDate(client.createdAt)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

      {clients.length > 0 && (
        <div className="clients-table__pagination">
          <span className="clients-table__page-info">
            {t('clients.count', { count: clients.length })}
          </span>
        </div>
      )}
    </div>
  );
};

export default ClientsTable;
