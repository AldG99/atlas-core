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
    <div className="top-clients">
      <h3 className="top-clients__title">{t('reports.topClients.title')}</h3>

      {clients.length === 0 ? (
        <p className="top-clients__empty">{t('reports.topClients.empty')}</p>
      ) : (
        <ul className="top-clients__list">
          {clients.map((client, index) => (
            <li key={client.phone || client.name} className="top-clients__item">
              <div className="top-clients__rank">#{index + 1}</div>
              <div className="top-clients__info">
                <span className="top-clients__name">{client.name}</span>
              </div>
              <span className="top-clients__phone">
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
