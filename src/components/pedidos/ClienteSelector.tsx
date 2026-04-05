import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PiStarFill, PiPlusBold, PiMagnifyingGlassBold } from 'react-icons/pi';
import { useClientes } from '../../hooks/useClientes';
import { useToast } from '../../hooks/useToast';
import { formatTelefono } from '../../utils/formatters';
import { getCodigoPais } from '../../data/codigosPais';
import type { Cliente } from '../../types/Cliente';
import Avatar from '../ui/Avatar';
import './ClienteSelector.scss';

interface ClienteSelectorProps {
  onSelect: (cliente: Cliente | null) => void;
  selectedCliente?: Cliente | null;
}

const ClienteSelector = ({
  onSelect,
  selectedCliente,
}: ClienteSelectorProps) => {
  const { t } = useTranslation();
  const { clientes, loading, addCliente } = useClientes();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredClientes = clientes
    .filter(
      c =>
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
    setFocusedIndex(-1);
  };

  const handleSelectCliente = (cliente: Cliente) => {
    onSelect(cliente);
    setSearchTerm('');
    setShowDropdown(false);
    setFocusedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || filteredClientes.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => {
        const next = Math.min(prev + 1, filteredClientes.length - 1);
        scrollItemIntoView(next);
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => {
        const next = Math.max(prev - 1, 0);
        scrollItemIntoView(next);
        return next;
      });
    } else if (e.key === 'Enter' && focusedIndex >= 0) {
      e.preventDefault();
      handleSelectCliente(filteredClientes[focusedIndex]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setFocusedIndex(-1);
    }
  };

  const scrollItemIntoView = (index: number) => {
    const items = dropdownRef.current?.querySelectorAll<HTMLElement>(
      '.cliente-selector__dropdown-item'
    );
    items?.[index]?.scrollIntoView({ block: 'nearest' });
  };

  const handleAddNew = async () => {
    if (!nombre.trim() || !telefono.trim()) {
      showToast(t('orders.quickClientFillRequired'), 'warning');
      return;
    }

    const existente = clientes.find(c => c.telefono === telefono.trim());
    if (existente) {
      showToast(
        t('orders.quickClientPhoneExists', { name: `${existente.nombre} ${existente.apellido}`.trim() }),
        'warning'
      );
      return;
    }

    try {
      const newCliente = await addCliente({
        nombre: nombre.trim(),
        apellido: '',
        telefono: telefono.trim(),
        telefonoCodigoPais: '',
        calle: '',
        numeroExterior: '',
        colonia: '',
        ciudad: '',
        codigoPostal: '',
      });
      if (newCliente) {
        onSelect(newCliente);
      }
      showToast(t('orders.quickClientSuccess'), 'success');
      setNombre('');
      setTelefono('');
      setShowForm(false);
    } catch {
      showToast(t('orders.quickClientError'), 'error');
    }
  };

  const handleClearSelection = () => {
    onSelect(null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (selectedCliente) {
    return (
      <div className="cliente-selector cliente-selector--selected">
        <div className="cliente-selector__selected-row">
          <div className="cliente-selector__avatar">
            {selectedCliente.fotoPerfil ? (
              <img
                src={selectedCliente.fotoPerfil}
                alt={selectedCliente.nombre}
              />
            ) : (
              <span>{selectedCliente.nombre.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="cliente-selector__client-info">
            <span className="cliente-selector__client-name">
              {selectedCliente.nombre} {selectedCliente.apellido}
              {selectedCliente.favorito && (
                <PiStarFill
                  size={12}
                  className="cliente-selector__dropdown-fav"
                />
              )}
            </span>
            <span className="cliente-selector__client-phone">
              {selectedCliente.telefonoCodigoPais
                ? `${getCodigoPais(selectedCliente.telefonoCodigoPais)?.codigo ?? ''} ${formatTelefono(selectedCliente.telefono)}`
                : formatTelefono(selectedCliente.telefono)}
            </span>
          </div>
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={handleClearSelection}
          >
            {t('orders.changeClient')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cliente-selector" ref={wrapperRef}>
      <label className="cliente-selector__label">{t('orders.client')}</label>

      <div className="cliente-selector__search-row">
        <div className="cliente-selector__search-wrapper">
          <PiMagnifyingGlassBold
            size={16}
            className="cliente-selector__search-icon"
          />
          <input
            type="text"
            placeholder={t('orders.searchClientPlaceholder')}
            value={searchTerm}
            onChange={e => handleSearch(e.target.value)}
            onFocus={() => searchTerm && setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            className="input cliente-selector__search"
          />
          {loading && <span className="cliente-selector__spinner" />}
        </div>
        <button
          type="button"
          className="btn btn--primary cliente-selector__add-btn"
          onClick={() => setShowForm(!showForm)}
          title={t('orders.addClientTitle')}
        >
          <PiPlusBold size={14} />
        </button>
      </div>

      {showDropdown && (
        <div className="cliente-selector__dropdown" ref={dropdownRef}>
          {filteredClientes.length > 0 ? (
            filteredClientes.map((cliente, index) => (
              <button
                key={cliente.id}
                type="button"
                className={`cliente-selector__dropdown-item${focusedIndex === index ? ' cliente-selector__dropdown-item--focused' : ''}`}
                onClick={() => handleSelectCliente(cliente)}
                onMouseEnter={() => setFocusedIndex(index)}
              >
                <div className="cliente-selector__dropdown-avatar">
                  <Avatar
                    src={cliente.fotoPerfil}
                    initials={`${cliente.nombre[0]}${cliente.apellido?.[0] ?? ''}`.toUpperCase()}
                    alt={cliente.nombre}
                  />
                </div>
                <div className="cliente-selector__dropdown-info">
                  <span className="cliente-selector__dropdown-name">
                    {cliente.nombre} {cliente.apellido}
                    {cliente.favorito && (
                      <PiStarFill
                        size={12}
                        className="cliente-selector__dropdown-fav"
                      />
                    )}
                  </span>
                  <span className="cliente-selector__dropdown-phone">
                    {cliente.telefonoCodigoPais
                      ? `${getCodigoPais(cliente.telefonoCodigoPais)?.codigo ?? ''} ${formatTelefono(cliente.telefono)}`
                      : formatTelefono(cliente.telefono)}
                  </span>
                </div>
              </button>
            ))
          ) : (
            <div className="cliente-selector__dropdown-empty">
              {t('orders.noClientsFound')}
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="cliente-selector__form">
          <div className="cliente-selector__form-title">{t('orders.quickClientTitle')}</div>
          <input
            type="text"
            placeholder={t('orders.quickClientName')}
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            className="input"
          />
          <input
            type="text"
            placeholder={t('orders.quickClientPhone')}
            value={telefono}
            onChange={e => setTelefono(e.target.value)}
            className="input"
          />
          <div className="cliente-selector__form-actions">
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={() => setShowForm(false)}
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={handleAddNew}
            >
              {t('common.save')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClienteSelector;
