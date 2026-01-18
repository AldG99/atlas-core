import { useState } from 'react';
import { useClientes } from '../../hooks/useClientes';
import { useToast } from '../../hooks/useToast';
import type { Cliente } from '../../types/Cliente';
import './ClienteSelector.scss';

interface ClienteSelectorProps {
  onSelect: (cliente: Cliente) => void;
}

const ClienteSelector = ({ onSelect }: ClienteSelectorProps) => {
  const { clientes, loading, addCliente } = useClientes();
  const { showToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClientes = clientes.filter(
    (c) =>
      c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.telefono.includes(searchTerm)
  );

  const handleAddNew = async () => {
    if (!nombre.trim() || !telefono.trim()) {
      showToast('Completa nombre y teléfono', 'warning');
      return;
    }

    try {
      await addCliente({
        nombre: nombre.trim(),
        telefono: telefono.trim()
      });
      showToast('Cliente guardado', 'success');
      setNombre('');
      setTelefono('');
      setShowForm(false);
    } catch {
      showToast('Error al guardar cliente', 'error');
    }
  };

  return (
    <div className="cliente-selector">
      <div className="cliente-selector__header">
        <span className="cliente-selector__title">Clientes frecuentes</span>
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancelar' : '+ Nuevo'}
        </button>
      </div>

      {showForm && (
        <div className="cliente-selector__form">
          <input
            type="text"
            placeholder="Nombre del cliente"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="input"
          />
          <input
            type="text"
            placeholder="Teléfono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            className="input"
          />
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={handleAddNew}
          >
            Guardar cliente
          </button>
        </div>
      )}

      {!showForm && clientes.length > 5 && (
        <input
          type="text"
          placeholder="Buscar cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input cliente-selector__search"
        />
      )}

      {loading && <p className="cliente-selector__loading">Cargando...</p>}

      {!loading && clientes.length === 0 && !showForm && (
        <p className="cliente-selector__empty">No hay clientes guardados.</p>
      )}

      {!loading && filteredClientes.length > 0 && (
        <div className="cliente-selector__list">
          {filteredClientes.map((cliente) => (
            <button
              key={cliente.id}
              type="button"
              className="cliente-selector__item"
              onClick={() => onSelect(cliente)}
            >
              <span className="cliente-selector__item-name">{cliente.nombre}</span>
              <span className="cliente-selector__item-phone">{cliente.telefono}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClienteSelector;
