import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

type SortOption = 'nombre_asc' | 'nombre_desc' | 'cp_asc' | 'cp_desc' | 'registro_desc' | 'registro_asc';

import {
  PiMagnifyingGlassBold,
  PiPlusBold,
  PiDownloadSimpleBold,
} from 'react-icons/pi';
import { useClientes } from '../hooks/useClientes';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import type { ClienteFormData } from '../types/Cliente';
import { exportClientesCSV } from '../utils/formatters';
import MainLayout from '../layouts/MainLayout';
import ClientesTable from '../components/clientes/ClientesTable';
import ClienteModal from '../components/clientes/ClienteModal';
import './Clientes.scss';

const PAGE_SIZE = 50;

const Clientes = () => {
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

  const { clientes, loading, error, addCliente } = useClientes();
  const { showToast } = useToast();
  const { role } = useAuth();

  const filteredClientes = useMemo(() => {
    let resultado = clientes;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      resultado = resultado.filter(
        cliente =>
          cliente.nombre.toLowerCase().includes(term) ||
          cliente.apellido.toLowerCase().includes(term) ||
          `${cliente.nombre} ${cliente.apellido}`.toLowerCase().includes(term) ||
          cliente.telefono.toLowerCase().includes(term)
      );
    }

    resultado.sort((a, b) => {
      switch (sortBy) {
        case 'nombre_asc': return a.nombre.localeCompare(b.nombre);
        case 'nombre_desc': return b.nombre.localeCompare(a.nombre);
        case 'cp_asc': return (a.codigoPostal || '').localeCompare(b.codigoPostal || '', undefined, { numeric: true });
        case 'cp_desc': return (b.codigoPostal || '').localeCompare(a.codigoPostal || '', undefined, { numeric: true });
        case 'registro_desc': return new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime();
        case 'registro_asc': return new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime();
        default: return 0;
      }
    });

    return resultado;
  }, [clientes, searchTerm, sortBy]);

  const clientesPaginados = filteredClientes.slice(0, displayLimit);
  const hayMas = filteredClientes.length > displayLimit;

  const handleAdd = async (data: ClienteFormData) => {
    try {
      await addCliente(data);
      showToast(t('clients.addSuccess'), 'success');
      setIsModalOpen(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('clients.addError'), 'error');
    }
  };

  const handleExport = () => {
    if (filteredClientes.length === 0) {
      showToast(t('clients.noClientsExport'), 'warning');
      return;
    }
    exportClientesCSV(filteredClientes);
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
              disabled={clientes.length === 0}
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

        <ClientesTable
          clientes={clientesPaginados}
          loading={loading}
          error={error}
          searchTerm={searchTerm}
        />

        {hayMas && (
          <div className="clientes__load-more">
            <button
              className="btn btn--outline btn--sm"
              onClick={() => setDisplayLimit(prev => prev + PAGE_SIZE)}
            >
              {t('clients.showMore', { count: filteredClientes.length - displayLimit })}
            </button>
          </div>
        )}

        {isModalOpen && (
          <ClienteModal
            onClose={() => setIsModalOpen(false)}
            onSave={handleAdd}
            telefonosExistentes={clientes.map(c => c.telefono)}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default Clientes;
