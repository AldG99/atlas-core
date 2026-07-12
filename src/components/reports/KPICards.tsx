import { useTranslation } from 'react-i18next';
import { PiCurrencyDollarBold, PiHashBold, PiTrendUpBold, PiUsersBold, PiArrowUpBold, PiArrowDownBold } from 'react-icons/pi';
import type { KPIs } from '../../types/Report';
import { useCurrency } from '../../hooks/useCurrency';
import './KPICards.scss';

interface KPICardsProps {
  kpis: KPIs;
  comparisonKPIs?: KPIs;
  variant?: 'main' | 'side';
}

const getDelta = (current: number, previous: number): number | null => {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
};

const KPICards = ({ kpis, comparisonKPIs, variant }: KPICardsProps) => {
  const { t } = useTranslation();
  const { format } = useCurrency();
  const allCards = [
    {
      icon: <PiCurrencyDollarBold size={24} />,
      value: format(kpis.totalSales),
      rawValue: kpis.totalSales,
      comparisonValue: comparisonKPIs?.totalSales,
      label: t('reports.kpi.totalSales'),
      className: 'kpi-card--ventas'
    },
    {
      icon: <PiHashBold size={24} />,
      value: kpis.totalOrders.toString(),
      rawValue: kpis.totalOrders,
      comparisonValue: comparisonKPIs?.totalOrders,
      label: t('reports.kpi.orders'),
      className: 'kpi-card--pedidos'
    },
    {
      icon: <PiTrendUpBold size={24} />,
      value: format(kpis.averageTicket),
      rawValue: kpis.averageTicket,
      comparisonValue: comparisonKPIs?.averageTicket,
      label: t('reports.kpi.avgTicket'),
      className: 'kpi-card--ticket'
    },
    {
      icon: <PiUsersBold size={24} />,
      value: kpis.uniqueClients.toString(),
      rawValue: kpis.uniqueClients,
      comparisonValue: comparisonKPIs?.uniqueClients,
      label: t('reports.kpi.clients'),
      className: 'kpi-card--clientes'
    }
  ];

  const cards = variant === 'main' ? allCards.slice(0, 3) : variant === 'side' ? allCards.slice(3) : allCards;

  return (
    <div className={`kpi-cards${variant ? ` kpi-cards--${variant}` : ''}`}>
      {cards.map((card) => {
        const delta = card.comparisonValue !== undefined
          ? getDelta(card.rawValue, card.comparisonValue)
          : null;

        return (
          <div key={card.label} className={`kpi-card ${card.className}`}>
            <div className="kpi-card__icon">{card.icon}</div>
            <div className="kpi-card__content">
              <div className="kpi-card__value">{card.value}</div>
              <div className="kpi-card__bottom">
                <span className="kpi-card__label">{card.label}</span>
                {delta !== null && delta !== 0 && (
                  <div className={`kpi-card__delta kpi-card__delta--${delta > 0 ? 'up' : 'down'}`}>
                    {delta > 0 ? <PiArrowUpBold size={9} /> : <PiArrowDownBold size={9} />}
                    <span>{Math.abs(delta).toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KPICards;
