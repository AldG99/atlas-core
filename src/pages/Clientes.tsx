import { useState, useMemo } from 'react';
import { PiCloudArrowUpBold } from 'react-icons/pi';
import { useClientes } from '../hooks/useClientes';
import { useToast } from '../hooks/useToast';
import type { Cliente, ClienteFormData } from '../types/Cliente';
import MainLayout from '../layouts/MainLayout';
import ClientesTable from '../components/clientes/ClientesTable';
import ClienteModal from '../components/clientes/ClienteModal';
import ClienteDetailModal from '../components/clientes/ClienteDetailModal';
import './Clientes.scss';

const Clientes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<{ id: string; data: ClienteFormData } | null>(null);
  const [viewingCliente, setViewingCliente] = useState<Cliente | null>(null);

  const { clientes, loading, error, addCliente, editCliente, removeCliente } = useClientes();
  const { showToast } = useToast();

  // Debug: verificar estado
  console.log('Clientes page - loading:', loading, 'error:', error, 'clientes:', clientes.length);

  const filteredClientes = useMemo(() => {
    if (!searchTerm.trim()) return clientes;

    const term = searchTerm.toLowerCase();
    return clientes.filter(
      (cliente) =>
        cliente.nombre.toLowerCase().includes(term) ||
        cliente.apellido.toLowerCase().includes(term) ||
        `${cliente.nombre} ${cliente.apellido}`.toLowerCase().includes(term) ||
        cliente.telefono.toLowerCase().includes(term)
    );
  }, [clientes, searchTerm]);

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

  const openEditModal = (id: string, data: ClienteFormData) => {
    setEditingCliente({ id, data });
  };

  const handleView = (cliente: Cliente) => {
    setViewingCliente(cliente);
  };

  const handleWhatsApp = (telefono: string) => {
    const cleanPhone = telefono.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const handleEditFromDetail = () => {
    if (!viewingCliente) return;
    setViewingCliente(null);
    openEditModal(viewingCliente.id, {
      fotoPerfil: viewingCliente.fotoPerfil,
      nombre: viewingCliente.nombre,
      apellido: viewingCliente.apellido,
      telefono: viewingCliente.telefono,
      telefonoSecundario: viewingCliente.telefonoSecundario,
      correo: viewingCliente.correo,
      calle: viewingCliente.calle,
      numeroExterior: viewingCliente.numeroExterior,
      numeroInterior: viewingCliente.numeroInterior,
      colonia: viewingCliente.colonia,
      ciudad: viewingCliente.ciudad,
      codigoPostal: viewingCliente.codigoPostal,
      referencia: viewingCliente.referencia,
      numeroVisible: viewingCliente.numeroVisible,
      horarioEntrega: viewingCliente.horarioEntrega,
      notas: viewingCliente.notas
    });
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
            onView={handleView}
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

        {viewingCliente && (
          <ClienteDetailModal
            cliente={viewingCliente}
            onClose={() => setViewingCliente(null)}
            onEdit={handleEditFromDetail}
            onWhatsApp={() => handleWhatsApp(viewingCliente.telefono)}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default Clientes;
