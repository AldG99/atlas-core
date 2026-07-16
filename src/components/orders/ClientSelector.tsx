import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { PiStarFill, PiPlusBold, PiMagnifyingGlassBold } from 'react-icons/pi';
import { useClients } from '../../hooks/useClients';
import { useToast } from '../../hooks/useToast';
import { formatPhone } from '../../utils/formatters';
import { getCountryCode } from '../../data/countryCodes';
import type { Client, ClientFormData } from '../../types/Client';
import Avatar from '../ui/Avatar';
import ClientModal from '../clients/ClientModal';
import './ClientSelector.scss';

interface ClientSelectorProps {
  onSelect: (client: Client | null) => void;
  selectedClient?: Client | null;
}

const ClientSelector = ({
  onSelect,
  selectedClient,
}: ClientSelectorProps) => {
  const { t } = useTranslation();
  const { clients, loading, addClient } = useClients();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredClients = clients
    .filter(
      c =>
        c.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    )
    .sort((a, b) => {
      if (a.favorite && !b.favorite) return -1;
      if (!a.favorite && b.favorite) return 1;
      return 0;
    });

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setShowDropdown(value.length > 0);
    setFocusedIndex(-1);
  };

  const handleSelectClient = (client: Client) => {
    onSelect(client);
    setSearchTerm('');
    setShowDropdown(false);
    setFocusedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || filteredClients.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => {
        const next = Math.min(prev + 1, filteredClients.length - 1);
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
      handleSelectClient(filteredClients[focusedIndex]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setFocusedIndex(-1);
    }
  };

  const scrollItemIntoView = (index: number) => {
    const items = dropdownRef.current?.querySelectorAll<HTMLElement>(
      '.client-selector__dropdown-item'
    );
    items?.[index]?.scrollIntoView({ block: 'nearest' });
  };

  const handleSaveClient = async (data: ClientFormData) => {
    try {
      const newClient = await addClient(data);
      if (newClient) onSelect(newClient);
      showToast(t('clients.addSuccess'), 'success');
      setShowModal(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('clients.addError'), 'error');
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

  if (selectedClient) {
    return (
      <div className="client-selector client-selector--selected">
        <div className="client-selector__selected-row">
          <div className="client-selector__avatar">
            {selectedClient.profilePhoto ? (
              <img
                src={selectedClient.profilePhoto}
                alt={selectedClient.firstName}
              />
            ) : (
              <span>{selectedClient.firstName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="client-selector__client-info">
            <span className="client-selector__client-name">
              {selectedClient.firstName} {selectedClient.lastName}
              {selectedClient.favorite && (
                <PiStarFill
                  size={12}
                  className="client-selector__dropdown-fav"
                />
              )}
            </span>
            <span className="client-selector__client-phone">
              {selectedClient.phoneCountryCode
                ? `${getCountryCode(selectedClient.phoneCountryCode)?.code ?? ''} ${formatPhone(selectedClient.phone)}`
                : formatPhone(selectedClient.phone)}
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
    <div className="client-selector" ref={wrapperRef}>
      <label className="client-selector__label">{t('orders.client')}</label>

      <div className="client-selector__search-row">
        <div className="client-selector__search-wrapper">
          <PiMagnifyingGlassBold
            size={16}
            className="client-selector__search-icon"
          />
          <input
            type="text"
            placeholder={t('orders.searchClientPlaceholder')}
            value={searchTerm}
            onChange={e => handleSearch(e.target.value)}
            onFocus={() => searchTerm && setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            className="input client-selector__search"
          />
          {loading && <span className="client-selector__spinner" />}
        </div>
        <button
          type="button"
          className="btn btn--primary client-selector__add-btn"
          onClick={() => setShowModal(true)}
          title={t('orders.addClientTitle')}
        >
          <PiPlusBold size={14} />
        </button>
      </div>

      {showDropdown && (
        <div className="client-selector__dropdown" ref={dropdownRef}>
          {filteredClients.length > 0 ? (
            filteredClients.map((client, index) => (
              <button
                key={client.id}
                type="button"
                className={`client-selector__dropdown-item${focusedIndex === index ? ' client-selector__dropdown-item--focused' : ''}`}
                onClick={() => handleSelectClient(client)}
                onMouseEnter={() => setFocusedIndex(index)}
              >
                <div className="client-selector__dropdown-avatar">
                  <Avatar
                    src={client.profilePhoto}
                    initials={`${client.firstName[0]}${client.lastName?.[0] ?? ''}`.toUpperCase()}
                    alt={client.firstName}
                  />
                </div>
                <div className="client-selector__dropdown-info">
                  <span className="client-selector__dropdown-name">
                    {client.firstName} {client.lastName}
                    {client.favorite && (
                      <PiStarFill
                        size={12}
                        className="client-selector__dropdown-fav"
                      />
                    )}
                  </span>
                  <span className="client-selector__dropdown-phone">
                    {client.phoneCountryCode
                      ? `${getCountryCode(client.phoneCountryCode)?.code ?? ''} ${formatPhone(client.phone)}`
                      : formatPhone(client.phone)}
                  </span>
                </div>
              </button>
            ))
          ) : (
            <div className="client-selector__dropdown-empty">
              {t('orders.noClientsFound')}
            </div>
          )}
        </div>
      )}

      {showModal && createPortal(
        <ClientModal
          onClose={() => setShowModal(false)}
          onSave={handleSaveClient}
          existingPhones={clients.map(c => c.phone)}
        />,
        document.body
      )}
    </div>
  );
};

export default ClientSelector;
