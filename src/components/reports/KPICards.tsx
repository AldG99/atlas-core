import { useTranslation } from 'react-i18next';
import { PiCurrencyDollarBold, PiHashBold, PiTrendUpBold, PiArrowUpBold, PiArrowDownBold, PiWalletBold, PiWarningBold } from 'react-icons/pi';
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
  const allCards: {
    icon: React.ReactNode;
    value: string;
    rawValue: number;
    comparisonValue: number | undefined;
    label: string;
    className: string;
    warning?: string;
  }[] = [
    {
      icon: <PiCurrencyDollarBold size={24} />,
      value: format(kpis.totalSales),
      rawValue: kpis.totalSales,
      comparisonValue: comparisonKPIs?.totalSales,
      label: t('reports.kpi.totalSales'),
      className: 'kpi-card--sales'
    },
    {
      icon: <PiHashBold size={24} />,
      value: kpis.totalOrders.toString(),
      rawValue: kpis.totalOrders,
      comparisonValue: comparisonKPIs?.totalOrders,
      label: t('reports.kpi.orders'),
      className: 'kpi-card--orders'
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
      icon: <PiWalletBold size={24} />,
      value: format(kpis.totalProfit),
      rawValue: kpis.totalProfit,
      comparisonValue: comparisonKPIs?.totalProfit,
      label: `${t('reports.kpi.profit')} · ${kpis.profitMargin.toFixed(1)}%`,
      className: 'kpi-card--profit',
      warning: kpis.hasIncompleteCost ? t('reports.kpi.profitIncompleteHint') : undefined
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
              <div className="kpi-card__value">
                {card.value}
                {card.warning && (
                  <span className="kpi-card__warning" title={card.warning}>
                    <PiWarningBold size={12} />
                  </span>
                )}
              </div>
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
