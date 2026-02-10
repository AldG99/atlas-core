import { useState, useMemo } from 'react';
import { PiCloudArrowUpBold, PiStarFill, PiStarBold } from 'react-icons/pi';
import { useClientes } from '../hooks/useClientes';
import { useToast } from '../hooks/useToast';
import type { ClienteFormData } from '../types/Cliente';
import MainLayout from '../layouts/MainLayout';
import ClientesTable from '../components/clientes/ClientesTable';
import ClienteModal from '../components/clientes/ClienteModal';
import './Clientes.scss';

const Clientes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [soloFavoritos, setSoloFavoritos] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<{ id: string; data: ClienteFormData } | null>(null);

  const { clientes, loading, error, addCliente, editCliente, removeCliente } = useClientes();
  const { showToast } = useToast();

  // Debug: verificar estado
  console.log('Clientes page - loading:', loading, 'error:', error, 'clientes:', clientes.length);

  const filteredClientes = useMemo(() => {
    let resultado = clientes;

    if (soloFavoritos) {
      resultado = resultado.filter((c) => c.favorito);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      resultado = resultado.filter(
        (cliente) =>
          cliente.nombre.toLowerCase().includes(term) ||
          cliente.apellido.toLowerCase().includes(term) ||
          `${cliente.nombre} ${cliente.apellido}`.toLowerCase().includes(term) ||
          cliente.telefono.toLowerCase().includes(term)
      );
    }

    // Favoritos primero
    return resultado.sort((a, b) => {
      if (a.favorito && !b.favorito) return -1;
      if (!a.favorito && b.favorito) return 1;
      return a.nombre.localeCompare(b.nombre);
    });
  }, [clientes, searchTerm, soloFavoritos]);

  const handleAdd = async (data: ClienteFormData) => {
    try {
      await addCliente(data);
      showToast('Cliente agregado correctamente', 'success');
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error al agregar cliente:', err);
      showToast('Error al agregar el cliente', 'error');
    }
  };

  const handleEdit = async (data: ClienteFormData) => {
    if (!editingCliente) return;

    try {
      await editCliente(editingCliente.id, data);
      showToast('Cliente actualizado correctamente', 'success');
      setEditingCliente(null);
    } catch {
      showToast('Error al actualizar el cliente', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este cliente?')) {
      try {
        await removeCliente(id);
        showToast('Cliente eliminado', 'success');
      } catch {
        showToast('Error al eliminar el cliente', 'error');
      }
    }
  };


  return (
    <MainLayout>
      <div className="clientes">
        <div className="clientes__header">
          <h1>Clientes</h1>
          <div className="clientes__header-actions">
            <button
              onClick={() => {}}
              className="btn btn--outline"
              title="Exportar a Google Drive"
            >
              <PiCloudArrowUpBold size={18} style={{ marginRight: '6px' }} />
              Google Drive
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn btn--primary"
            >
              Nuevo Cliente
            </button>
          </div>
        </div>

        <div className="clientes__controls">
          <div className="clientes__search">
            <input
              type="text"
              placeholder="Buscar por nombre o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
            />
          </div>
          <button
            onClick={() => setSoloFavoritos(!soloFavoritos)}
            className={`btn btn--outline clientes__fav-filter ${soloFavoritos ? 'clientes__fav-filter--active' : ''}`}
            title={soloFavoritos ? 'Mostrar todos' : 'Solo favoritos'}
          >
            {soloFavoritos ? <PiStarFill size={16} /> : <PiStarBold size={16} />}
            <span>Favoritos</span>
          </button>
          <div className="clientes__count">
            {filteredClientes.length} {filteredClientes.length === 1 ? 'cliente' : 'clientes'}
          </div>
        </div>

        {loading && <p className="clientes__loading">Cargando clientes...</p>}

        {error && <p className="clientes__error">{error}</p>}

        {!loading && !error && clientes.length === 0 && (
          <div className="clientes__empty">
            <p>No hay clientes registrados</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn btn--primary"
            >
              Agregar primer cliente
            </button>
          </div>
        )}

        {!loading && !error && clientes.length > 0 && filteredClientes.length === 0 && (
          <div className="clientes__empty">
            <p>No se encontraron clientes para "{searchTerm}"</p>
          </div>
        )}

        {!loading && !error && filteredClientes.length > 0 && (
          <ClientesTable
            clientes={filteredClientes}
            onDelete={handleDelete}
          />
        )}

        {isModalOpen && (
          <ClienteModal
            onClose={() => setIsModalOpen(false)}
            onSave={handleAdd}
          />
        )}

        {editingCliente && (
          <ClienteModal
            cliente={editingCliente.data}
            onClose={() => setEditingCliente(null)}
            onSave={handleEdit}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default Clientes;
