import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Star, UserPlus, Search, Check, User, UserCheck, PenLine } from 'lucide-react';
import { useClients } from '../../hooks/useClients';
import { useToast } from '../../hooks/useToast';
import { formatPhone } from '../../utils/formatters';
import { getCountryCode } from '../../data/countryCodes';
import { getInitials } from '../../utils/avatar';
import type { Client, ClientFormData } from '../../types/Client';
import Avatar from '../ui/Avatar';
import ClientModal from '../clients/ClientModal';
import './ClientSelector.scss';

const parseOccasionalName = (raw: string): { firstName: string; lastName: string } => {
  const parts = raw.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  };
};

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
  const [mode, setMode] = useState<'occasional' | 'registered'>('occasional');
  const [occasionalName, setOccasionalName] = useState('');
  const [occasionalError, setOccasionalError] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const occasionalTabRef = useRef<HTMLButtonElement>(null);
  const registeredTabRef = useRef<HTMLButtonElement>(null);
  const occasionalInputRef = useRef<HTMLInputElement>(null);
  const registeredSearchInputRef = useRef<HTMLInputElement>(null);

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

  const handleSwitchMode = (next: 'occasional' | 'registered') => {
    setMode(next);
    setShowDropdown(false);
  };

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const next = mode === 'occasional' ? 'registered' : 'occasional';
      handleSwitchMode(next);
      (next === 'occasional' ? occasionalTabRef : registeredTabRef).current?.focus();
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      (mode === 'occasional' ? occasionalInputRef : registeredSearchInputRef).current?.focus();
    }
  };

  const handleConfirmOccasional = () => {
    const { firstName, lastName } = parseOccasionalName(occasionalName);
    if (!firstName) {
      setOccasionalError(t('orders.occasionalClientNameRequired'));
      return;
    }

    // Cliente sin registrar: nunca se escribe en la colección `clients`, solo
    // viaja en memoria para que OrderForm lea firstName/lastName/phone igual
    // que con un cliente real. Ver planLimits — no debe contar cupo de plan.
    const occasionalClient: Client = {
      id: `occasional-${Date.now()}`,
      firstName,
      lastName,
      phone: '',
      street: '',
      exteriorNumber: '',
      neighborhood: '',
      city: '',
      postalCode: '',
      userId: '',
      createdAt: new Date(),
    };

    onSelect(occasionalClient);
    setOccasionalName('');
    setOccasionalError('');
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

  // El foco inicial va a la pestaña, no al input, para que las flechas
  // izquierda/derecha funcionen apenas se entra al formulario.
  useEffect(() => {
    occasionalTabRef.current?.focus();
  }, []);

  if (selectedClient) {
    return (
      <div className="client-selector client-selector--selected">
        <div className="client-selector__selected-row">
          <div className="client-selector__avatar">
            <Avatar src={selectedClient.profilePhoto} seed={selectedClient.id} alt={selectedClient.firstName} initials={getInitials(selectedClient.firstName, selectedClient.lastName)} />
          </div>
          <div className="client-selector__client-info">
            <span className="client-selector__client-name">
              {[selectedClient.firstName, selectedClient.lastName].filter(Boolean).join(' ')}
              {selectedClient.favorite && (
                <Star fill="currentColor"
                  size={12}
                  className="client-selector__dropdown-fav"
                />
              )}
            </span>
            {selectedClient.phone ? (
              <span className="client-selector__client-phone">
                {selectedClient.phoneCountryCode
                  ? `${getCountryCode(selectedClient.phoneCountryCode)?.code ?? ''} ${formatPhone(selectedClient.phone)}`
                  : formatPhone(selectedClient.phone)}
              </span>
            ) : (
              <span className="client-selector__client-phone">{t('orders.occasionalClientBadge')}</span>
            )}
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
      <div className="client-selector__tabs" role="tablist">
        <button
          ref={occasionalTabRef}
          type="button"
          role="tab"
          aria-selected={mode === 'occasional'}
          className={`client-selector__tab client-selector__tab--occasional${mode === 'occasional' ? ' client-selector__tab--active' : ''}`}
          onClick={() => handleSwitchMode('occasional')}
          onKeyDown={handleTabKeyDown}
        >
          <User size={15} />
          {t('orders.occasionalClientTab')}
        </button>
        <button
          ref={registeredTabRef}
          type="button"
          role="tab"
          aria-selected={mode === 'registered'}
          className={`client-selector__tab client-selector__tab--registered${mode === 'registered' ? ' client-selector__tab--active' : ''}`}
          onClick={() => handleSwitchMode('registered')}
          onKeyDown={handleTabKeyDown}
        >
          <UserCheck size={15} />
          {t('orders.registeredClientTab')}
        </button>
      </div>

      {mode === 'occasional' ? (
        <div className="client-selector__occasional-row">
          <div className="client-selector__search-wrapper">
            <PenLine size={16} className="client-selector__search-icon" />
            <input
              ref={occasionalInputRef}
              type="text"
              spellCheck
              autoCorrect="on"
              autoCapitalize="words"
              placeholder={t('orders.occasionalClientNamePlaceholder')}
              value={occasionalName}
              onChange={e => {
                setOccasionalName(e.target.value);
                if (occasionalError) setOccasionalError('');
              }}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleConfirmOccasional(); } }}
              className="input client-selector__search"
            />
          </div>
          <button
            type="button"
            className="btn btn--primary client-selector__add-btn"
            onClick={handleConfirmOccasional}
            title={t('orders.occasionalClientConfirm')}
          >
            <Check size={16} />
          </button>
        </div>
      ) : (
        <div className="client-selector__search-row">
          <div className="client-selector__search-wrapper">
            <Search
              size={16}
              className="client-selector__search-icon"
            />
            <input
              ref={registeredSearchInputRef}
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
            <UserPlus size={16} />
          </button>
        </div>
      )}

      {occasionalError && mode === 'occasional' && (
        <span className="error-message">{occasionalError}</span>
      )}

      {showDropdown && mode === 'registered' && (
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
                    seed={client.id}
                    alt={client.firstName}
                    initials={getInitials(client.firstName, client.lastName)}
                  />
                </div>
                <div className="client-selector__dropdown-info">
                  <span className="client-selector__dropdown-name">
                    {client.firstName} {client.lastName}
                    {client.favorite && (
                      <Star fill="currentColor"
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
