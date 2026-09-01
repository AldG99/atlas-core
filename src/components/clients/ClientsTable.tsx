import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Client } from '../../types/Client';
import { getCountryCode } from '../../data/countryCodes';
import { formatPhone } from '../../utils/formatters';
import './ClientsTable.scss';

const PAGE_SIZE = 50;

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
  const [page, setPage] = useState(0);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [prevClients, setPrevClients] = useState(clients);

  if (prevClients !== clients) {
    setPrevClients(clients);
    if (page !== 0) setPage(0);
    if (focusedRow !== null) setFocusedRow(null);
  }

  const totalPages = Math.ceil(clients.length / PAGE_SIZE);
  const paginatedClients = clients.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(i18n.language, {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  useEffect(() => {
    if (!paginatedClients.length) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (['input', 'select', 'textarea'].includes(tag)) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedRow(prev => prev === null ? 0 : Math.min(prev + 1, paginatedClients.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedRow(prev => prev === null ? 0 : Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && focusedRow !== null) {
        e.preventDefault();
        navigate(`/clients/${paginatedClients[focusedRow].id}`, { state: { from: location.pathname } });
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [paginatedClients, focusedRow, navigate, location.pathname]);

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
          ) : paginatedClients.map((client, index) => (
            <tr
              key={client.id}
              className={`clients-table__row${focusedRow === index ? ' clients-table__row--focused' : ''}`}
              onClick={() => navigate(`/clients/${client.id}`, { state: { from: location.pathname } })}
              onMouseEnter={() => setFocusedRow(index)}
            >
              <td>
                <div className="clients-table__client">
                  <span className="clients-table__name" title={`${client.firstName} ${client.lastName}`}>
                    {client.firstName} {client.lastName}
                  </span>
                  {client.favorite && <Star fill="currentColor" size={14} className="clients-table__fav-icon" />}
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

      {!loading && clients.length > 0 && (
        <div className="clients-table__pagination">
          <span className="clients-table__page-info clients-table__page-info--total">
            {`${page * PAGE_SIZE + 1}-${Math.min((page + 1) * PAGE_SIZE, clients.length)} ${t('common.of')} ${t('clients.count', { count: clients.length })}`}
          </span>
          <button
            className="clients-table__page-btn"
            onClick={() => { setPage(p => p - 1); setFocusedRow(null); }}
            disabled={page === 0}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            className="clients-table__page-btn"
            onClick={() => { setPage(p => p + 1); setFocusedRow(null); }}
            disabled={page >= totalPages - 1}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ClientsTable;
