import { useTranslation } from 'react-i18next';
import type { TopClient } from '../../types/Report';
import { formatPhone } from '../../utils/formatters';
import { useClients } from '../../hooks/useClients';
import { getCountryCode } from '../../data/countryCodes';
import './TopClients.scss';

interface TopClientsProps {
  clients: TopClient[];
}

const TopClients = ({ clients }: TopClientsProps) => {
  const { t } = useTranslation();
  const { clients: clientsData } = useClients();

  const getDialCode = (phone: string): string => {
    const client = clientsData.find(c => c.phone === phone);
    if (!client?.phoneCountryCode) return '';
    return getCountryCode(client.phoneCountryCode)?.code ?? '';
  };

  return (
    <div className="top-clientes">
      <h3 className="top-clientes__title">{t('reports.topClients.title')}</h3>

      {clients.length === 0 ? (
        <p className="top-clientes__empty">{t('reports.topClients.empty')}</p>
      ) : (
        <ul className="top-clientes__list">
          {clients.map((client, index) => (
            <li key={client.phone || client.name} className="top-clientes__item">
              <div className="top-clientes__rank">#{index + 1}</div>
              <div className="top-clientes__info">
                <span className="top-clientes__name">{client.name}</span>
              </div>
              <span className="top-clientes__phone">
                {getDialCode(client.phone)}{getDialCode(client.phone) ? ' ' : ''}{formatPhone(client.phone)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TopClients;
