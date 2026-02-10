import { useState, useRef, useEffect } from 'react';
import { PiStarFill } from 'react-icons/pi';
import { useClientes } from '../../hooks/useClientes';
import { useToast } from '../../hooks/useToast';
import type { Cliente } from '../../types/Cliente';
import './ClienteSelector.scss';

interface ClienteSelectorProps {
  onSelect: (cliente: Cliente | null) => void;
  selectedCliente?: Cliente | null;
}

const ClienteSelector = ({ onSelect, selectedCliente }: ClienteSelectorProps) => {
  const { clientes, loading, addCliente } = useClientes();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filteredClientes = clientes
    .filter(
      (c) =>
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.telefono.includes(searchTerm)
    )
    .sort((a, b) => {
      if (a.favorito && !b.favorito) return -1;
      if (!a.favorito && b.favorito) return 1;
      return 0;
    });

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setShowDropdown(value.length > 0);
  };

  const handleSelectCliente = (cliente: Cliente) => {
    onSelect(cliente);
    setSearchTerm('');
    setShowDropdown(false);
  };

  const handleAddNew = async () => {
    if (!nombre.trim() || !telefono.trim()) {
      showToast('Completa nombre y teléfono', 'warning');
      return;
    }

    try {
      const newCliente = await addCliente({
        nombre: nombre.trim(),
        apellido: '',
        telefono: telefono.trim(),
        calle: '',
        numeroExterior: '',
        colonia: '',
        ciudad: '',
        codigoPostal: '',
        numeroVisible: true
      });
      if (newCliente) {
        onSelect(newCliente);
      }
      showToast('Cliente creado correctamente', 'success');
      setNombre('');
      setTelefono('');
      setShowForm(false);
    } catch {
      showToast('Error al crear cliente', 'error');
    }
  };

  const handleClearSelection = () => {
    onSelect(null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (selectedCliente) {
    return (
      <div className="cliente-selector cliente-selector--selected">
        <div className="cliente-selector__selected-header">
          <span className="cliente-selector__label">Cliente</span>
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={handleClearSelection}
          >
            Cambiar
          </button>
        </div>
        <div className="cliente-selector__selected-info">
          <div className="cliente-selector__selected-avatar">
            {selectedCliente.fotoPerfil ? (
              <img src={selectedCliente.fotoPerfil} alt={selectedCliente.nombre} />
            ) : (
              <span className="cliente-selector__selected-avatar-placeholder">
                {selectedCliente.nombre.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="cliente-selector__selected-details">
            <div className="cliente-selector__selected-name">
              {selectedCliente.nombre} {selectedCliente.apellido}
            </div>
            <div className="cliente-selector__selected-phone">
              {selectedCliente.telefono}
            </div>
            {selectedCliente.calle && (
              <div className="cliente-selector__selected-address">
                <p>{selectedCliente.calle} {selectedCliente.numeroExterior}{selectedCliente.numeroInterior ? `, Int. ${selectedCliente.numeroInterior}` : ''}</p>
                {selectedCliente.colonia && <p>{selectedCliente.colonia}</p>}
                {(selectedCliente.ciudad || selectedCliente.codigoPostal) && (
                  <p>{selectedCliente.ciudad}{selectedCliente.codigoPostal ? `, CP ${selectedCliente.codigoPostal}` : ''}</p>
                )}
                {selectedCliente.referencia && (
                  <p className="cliente-selector__selected-address-ref">Ref: {selectedCliente.referencia}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cliente-selector" ref={wrapperRef}>
      <label className="cliente-selector__label">Cliente</label>

      <div className="cliente-selector__search-row">
        <div className="cliente-selector__search-wrapper">
          <input
            type="text"
            placeholder="Buscar por nombre o teléfono..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchTerm && setShowDropdown(true)}
            className="input cliente-selector__search"
          />
          {loading && <span className="cliente-selector__spinner" />}
        </div>
        <button
          type="button"
          className="btn btn--primary cliente-selector__add-btn"
          onClick={() => setShowForm(!showForm)}
          title="Agregar nuevo cliente"
        >
          +
        </button>
      </div>

      {showDropdown && (
        <div className="cliente-selector__dropdown">
          {filteredClientes.length > 0 ? (
            filteredClientes.map((cliente) => (
              <button
                key={cliente.id}
                type="button"
                className="cliente-selector__dropdown-item"
                onClick={() => handleSelectCliente(cliente)}
              >
                <div className="cliente-selector__dropdown-avatar">
                  {cliente.fotoPerfil ? (
                    <img src={cliente.fotoPerfil} alt={cliente.nombre} />
                  ) : (
                    <span className="cliente-selector__dropdown-avatar-placeholder">
                      {cliente.nombre.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="cliente-selector__dropdown-info">
                  <span className="cliente-selector__dropdown-name">
                    {cliente.nombre} {cliente.apellido}
                    {cliente.favorito && <PiStarFill size={12} className="cliente-selector__dropdown-fav" />}
                  </span>
                  <span className="cliente-selector__dropdown-phone">
                    {cliente.telefono}
                  </span>
                </div>
              </button>
            ))
          ) : (
            <div className="cliente-selector__dropdown-empty">
              No se encontraron clientes
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="cliente-selector__form">
          <div className="cliente-selector__form-title">Nuevo cliente</div>
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
          <div className="cliente-selector__form-actions">
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={() => setShowForm(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={handleAddNew}
            >
              Guardar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClienteSelector;
