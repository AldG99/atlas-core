import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

type SortOption = 'name_asc' | 'name_desc' | 'postal_asc' | 'postal_desc' | 'registration_desc' | 'registration_asc';

import {
  PiMagnifyingGlassBold,
  PiPlusBold,
  PiDownloadSimpleBold,
} from 'react-icons/pi';
import { useClients } from '../hooks/useClients';
import { useToast } from '../hooks/useToast';
import type { ClientFormData } from '../types/Client';
import { exportClientsCSV } from '../utils/formatters';
import MainLayout from '../layouts/MainLayout';
import ClientsTable from '../components/clients/ClientsTable';
import ClientModal from '../components/clients/ClientModal';
import './Clients.scss';

const PAGE_SIZE = 50;

const Clients = () => {
  const { t } = useTranslation();

  const POSTAL_OPTIONS: Partial<Record<SortOption, string>> = {
    postal_asc: t('clients.postalAsc'),
    postal_desc: t('clients.postalDesc'),
  };

  const NAME_OPTIONS: Partial<Record<SortOption, string>> = {
    name_asc: t('clients.nameAsc'),
    name_desc: t('clients.nameDesc'),
    registration_desc: t('clients.registrationNewest'),
    registration_asc: t('clients.registrationOldest'),
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name_asc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(PAGE_SIZE);

  const { clients, loading, error, addClient } = useClients();
  const { showToast } = useToast();

  const filteredClients = useMemo(() => {
    let result = clients;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const digitsTerm = searchTerm.replace(/\D/g, '');
      result = result.filter(client => {
        const digitsPhone = client.phone.replace(/\D/g, '');
        return (
          client.firstName.toLowerCase().includes(term) ||
          client.lastName.toLowerCase().includes(term) ||
          `${client.firstName} ${client.lastName}`.toLowerCase().includes(term) ||
          client.phone.toLowerCase().includes(term) ||
          (digitsTerm.length > 0 && (digitsPhone.includes(digitsTerm) || digitsTerm.includes(digitsPhone)))
        );
      });
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc': return a.firstName.localeCompare(b.firstName);
        case 'name_desc': return b.firstName.localeCompare(a.firstName);
        case 'postal_asc': return (a.postalCode || '').localeCompare(b.postalCode || '', undefined, { numeric: true });
        case 'postal_desc': return (b.postalCode || '').localeCompare(a.postalCode || '', undefined, { numeric: true });
        case 'registration_desc': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'registration_asc': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
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

  const postalValue = sortBy in POSTAL_OPTIONS ? sortBy : '';
  const nameValue = sortBy in NAME_OPTIONS ? sortBy : '';

  return (
    <MainLayout>
      <div className="clients">
        <div className="clients__header">
          <div className="clients__header-title">
            <h1>{t('clients.title')}</h1>
          </div>
          <div className="clients__header-actions">
            <button
              onClick={handleExport}
              className="btn btn--secondary"
              disabled={clients.length === 0}
            >
              <PiDownloadSimpleBold size={18} />
              {t('common.exportCsv')}
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn btn--primary"
            >
              <PiPlusBold size={18} />
              {t('clients.newClient')}
            </button>
          </div>
        </div>

        <div className="clients__controls">
          <div className="clients__search">
            <PiMagnifyingGlassBold size={16} className="clients__search-icon" />
            <input
              type="text"
              placeholder={t('clients.searchPlaceholder')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="input"
            />
          </div>
          <div className="clients__selects">
            <select
              value={postalValue}
              onChange={(e) => e.target.value && setSortBy(e.target.value as SortOption)}
              className="select"
            >
              <option value="">{t('clients.sortByPostal')}</option>
              {(Object.keys(POSTAL_OPTIONS) as SortOption[]).map(opt => (
                <option key={opt} value={opt}>{POSTAL_OPTIONS[opt]}</option>
              ))}
            </select>
            <select
              value={nameValue}
              onChange={(e) => e.target.value && setSortBy(e.target.value as SortOption)}
              className="select"
            >
              <option value="">{t('clients.sortByName')}</option>
              {(Object.keys(NAME_OPTIONS) as SortOption[]).map(opt => (
                <option key={opt} value={opt}>{NAME_OPTIONS[opt]}</option>
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
          <div className="clients__load-more">
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
