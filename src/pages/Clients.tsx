import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

type SortOption = 'nombre_asc' | 'nombre_desc' | 'cp_asc' | 'cp_desc' | 'registro_desc' | 'registro_asc';

import {
  PiMagnifyingGlassBold,
  PiPlusBold,
  PiDownloadSimpleBold,
} from 'react-icons/pi';
import { useClients } from '../hooks/useClients';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import type { ClientFormData } from '../types/Client';
import { exportClientsCSV } from '../utils/formatters';
import MainLayout from '../layouts/MainLayout';
import ClientsTable from '../components/clients/ClientsTable';
import ClientModal from '../components/clients/ClientModal';
import './Clients.scss';

const PAGE_SIZE = 50;

const Clients = () => {
  const { t } = useTranslation();

  const CP_OPTIONS: Partial<Record<SortOption, string>> = {
    cp_asc: t('clients.postalAsc'),
    cp_desc: t('clients.postalDesc'),
  };

  const NOMBRE_OPTIONS: Partial<Record<SortOption, string>> = {
    nombre_asc: t('clients.nameAsc'),
    nombre_desc: t('clients.nameDesc'),
    registro_desc: t('clients.registrationNewest'),
    registro_asc: t('clients.registrationOldest'),
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('nombre_asc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(PAGE_SIZE);

  const { clients, loading, error, addClient } = useClients();
  const { showToast } = useToast();
  const { role } = useAuth();

  const filteredClients = useMemo(() => {
    let result = clients;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        client =>
          client.firstName.toLowerCase().includes(term) ||
          client.lastName.toLowerCase().includes(term) ||
          `${client.firstName} ${client.lastName}`.toLowerCase().includes(term) ||
          client.phone.toLowerCase().includes(term)
      );
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'nombre_asc': return a.firstName.localeCompare(b.firstName);
        case 'nombre_desc': return b.firstName.localeCompare(a.firstName);
        case 'cp_asc': return (a.postalCode || '').localeCompare(b.postalCode || '', undefined, { numeric: true });
        case 'cp_desc': return (b.postalCode || '').localeCompare(a.postalCode || '', undefined, { numeric: true });
        case 'registro_desc': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'registro_asc': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default: return 0;
      }
    });

    return result;
  }, [clients, searchTerm, sortBy]);

  const paginatedClients = filteredClients.slice(0, displayLimit);
  const hasMore = filteredClients.length > displayLimit;

  const handleAdd = async (data: ClientFormData) => {
    try {
      await addClient(data);
      showToast(t('clients.addSuccess'), 'success');
      setIsModalOpen(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('clients.addError'), 'error');
    }
  };

  const handleExport = () => {
    if (filteredClients.length === 0) {
      showToast(t('clients.noClientsExport'), 'warning');
      return;
    }
    exportClientsCSV(filteredClients);
    showToast(t('clients.exportSuccess'), 'success');
  };

  const cpValue = sortBy in CP_OPTIONS ? sortBy : '';
  const nombreValue = sortBy in NOMBRE_OPTIONS ? sortBy : '';

  return (
    <MainLayout>
      <div className="clientes">
        <div className="clientes__header">
          <div className="clientes__header-title">
            <h1>{t('clients.title')}</h1>
          </div>
          <div className="clientes__header-actions">
            <button
              onClick={handleExport}
              className="btn btn--secondary"
              disabled={clients.length === 0}
            >
              <PiDownloadSimpleBold size={18} />
              {t('common.exportCsv')}
            </button>
            {role === 'admin' && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn btn--primary"
              >
                <PiPlusBold size={18} />
                {t('clients.newClient')}
              </button>
            )}
          </div>
        </div>

        <div className="clientes__controls">
          <div className="clientes__search">
            <PiMagnifyingGlassBold size={16} className="clientes__search-icon" />
            <input
              type="text"
              placeholder={t('clients.searchPlaceholder')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="input"
            />
          </div>
          <div className="clientes__selects">
            <select
              value={cpValue}
              onChange={(e) => e.target.value && setSortBy(e.target.value as SortOption)}
              className="select"
            >
              <option value="">{t('clients.sortByPostal')}</option>
              {(Object.keys(CP_OPTIONS) as SortOption[]).map(opt => (
                <option key={opt} value={opt}>{CP_OPTIONS[opt]}</option>
              ))}
            </select>
            <select
              value={nombreValue}
              onChange={(e) => e.target.value && setSortBy(e.target.value as SortOption)}
              className="select"
            >
              <option value="">{t('clients.sortByName')}</option>
              {(Object.keys(NOMBRE_OPTIONS) as SortOption[]).map(opt => (
                <option key={opt} value={opt}>{NOMBRE_OPTIONS[opt]}</option>
              ))}
            </select>
          </div>
        </div>

        <ClientsTable
          clients={paginatedClients}
          loading={loading}
          error={error}
          searchTerm={searchTerm}
        />

        {hasMore && (
          <div className="clientes__load-more">
            <button
              className="btn btn--outline btn--sm"
              onClick={() => setDisplayLimit(prev => prev + PAGE_SIZE)}
            >
              {t('clients.showMore', { count: filteredClients.length - displayLimit })}
            </button>
          </div>
        )}

        {isModalOpen && (
          <ClientModal
            onClose={() => setIsModalOpen(false)}
            onSave={handleAdd}
            existingPhones={clients.map(c => c.phone)}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default Clients;
