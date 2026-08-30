import { useTranslation } from 'react-i18next';
import type { TopClient } from '../../types/Report';
import { formatPhone } from '../../utils/formatters';
import { useClients } from '../../hooks/useClients';
import { useCurrency } from '../../hooks/useCurrency';
import { getCountryCode } from '../../data/countryCodes';
import './TopClients.scss';

interface TopClientsProps {
  clients: TopClient[];
}

// Cuántas filas se muestran siempre — debe coincidir con el límite que pide
// useReports (calculateTopClients(..., 5)). Si hay menos clientes que esto,
// las filas restantes se dibujan vacías mantiendo su numeración, para que la
// tarjeta no cambie de alto entre períodos con distinta cantidad de datos.
const DISPLAY_COUNT = 5;

const TopClients = ({ clients }: TopClientsProps) => {
  const { t } = useTranslation();
  const { clients: clientsData } = useClients();
  const { format } = useCurrency();

  const getDialCode = (phone: string): string => {
    const client = clientsData.find(c => c.phone === phone);
    if (!client?.phoneCountryCode) return '';
    return getCountryCode(client.phoneCountryCode)?.code ?? '';
  };

  const rows = Array.from({ length: DISPLAY_COUNT }, (_, i) => clients[i]);

  return (
    <div className="top-clients">
      <h3 className="top-clients__title">{t('reports.topClients.title')}</h3>

      <ul className="top-clients__list">
        {rows.map((client, index) => (
          <li
            key={client ? (client.phone || client.name) : `empty-${index}`}
            className={`top-clients__item${client ? '' : ' top-clients__item--empty'}`}
          >
            <span className="top-clients__rank">#{index + 1}</span>
            <span className="top-clients__name">{client ? client.name : '—'}</span>
            <span className="top-clients__phone">
              {client
                ? `${getDialCode(client.phone)}${getDialCode(client.phone) ? ' ' : ''}${formatPhone(client.phone)}`
                : ''}
            </span>
            <span className="top-clients__total">{client ? format(client.total) : ''}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TopClients;
