import { useState, useMemo } from 'react';

type SortOption = 'nombre_asc' | 'nombre_desc' | 'cp_asc' | 'cp_desc' | 'registro_desc' | 'registro_asc';

import {
  PiMagnifyingGlassBold,
  PiPlusBold,
} from 'react-icons/pi';
import { useClientes } from '../hooks/useClientes';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import type { ClienteFormData } from '../types/Cliente';
import MainLayout from '../layouts/MainLayout';
import ClientesTable from '../components/clientes/ClientesTable';
import ClienteModal from '../components/clientes/ClienteModal';
import './Clientes.scss';

const CP_OPTIONS: Partial<Record<SortOption, string>> = {
  cp_asc: 'C.P. menor a mayor',
  cp_desc: 'C.P. mayor a menor',
};

const NOMBRE_OPTIONS: Partial<Record<SortOption, string>> = {
  nombre_asc: 'Nombre A-Z',
  nombre_desc: 'Nombre Z-A',
  registro_desc: 'Más recientes',
  registro_asc: 'Más antiguos',
};

const PAGE_SIZE = 50;

const Clientes = () => {
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
      showToast('Cliente agregado correctamente', 'success');
      setIsModalOpen(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al agregar el cliente', 'error');
    }
  };

  const cpValue = sortBy in CP_OPTIONS ? sortBy : '';
  const nombreValue = sortBy in NOMBRE_OPTIONS ? sortBy : '';

  return (
    <MainLayout>
      <div className="clientes">
        <div className="clientes__header">
          <div className="clientes__header-title">
            <h1>Clientes</h1>
          </div>
          <div className="clientes__header-actions">
            {role === 'admin' && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn btn--primary"
              >
                <PiPlusBold size={18} />
                Nuevo Cliente
              </button>
            )}
          </div>
        </div>

        <div className="clientes__controls">
          <div className="clientes__search">
            <PiMagnifyingGlassBold size={16} className="clientes__search-icon" />
            <input
              type="text"
              placeholder="Buscar por nombre o teléfono..."
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
              <option value="">Código Postal</option>
              {(Object.keys(CP_OPTIONS) as SortOption[]).map(opt => (
                <option key={opt} value={opt}>{CP_OPTIONS[opt]}</option>
              ))}
            </select>
            <select
              value={nombreValue}
              onChange={(e) => e.target.value && setSortBy(e.target.value as SortOption)}
              className="select"
            >
              <option value="">Nombre / Registro</option>
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
              Mostrar más ({filteredClientes.length - displayLimit} restantes)
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
