import { useTranslation } from 'react-i18next';
import { PiCurrencyDollar, PiHash, PiTrendUp, PiArrowUp, PiArrowDown, PiWallet, PiWarning } from 'react-icons/pi';
import type { KPIs } from '../../types/Report';
import { useCurrency } from '../../hooks/useCurrency';
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber';
import './KPICards.scss';

interface KPICardsProps {
  kpis: KPIs;
  comparisonKPIs?: KPIs;
  variant?: 'main' | 'side';
}

interface CardData {
  icon: React.ReactNode;
  rawValue: number;
  formatValue: (value: number) => string;
  comparisonValue: number | undefined;
  label: string;
  className: string;
  warning?: string;
}

const getDelta = (current: number, previous: number): number | null => {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
};

const KPICard = ({ card }: { card: CardData }) => {
  const animatedValue = useAnimatedNumber(card.rawValue);
  const delta = card.comparisonValue !== undefined
    ? getDelta(card.rawValue, card.comparisonValue)
    : null;

  return (
    <div className={`kpi-card ${card.className}`}>
      <div className="kpi-card__icon">{card.icon}</div>
      <div className="kpi-card__content">
        <div className="kpi-card__value">
          {card.formatValue(animatedValue)}
          {card.warning && (
            <span className="kpi-card__warning" title={card.warning}>
              <PiWarning size={12} />
            </span>
          )}
        </div>
        <div className="kpi-card__bottom">
          <span className="kpi-card__label">{card.label}</span>
          {delta !== null && delta !== 0 && (
            <div className={`kpi-card__delta kpi-card__delta--${delta > 0 ? 'up' : 'down'}`}>
              {delta > 0 ? <PiArrowUp size={9} /> : <PiArrowDown size={9} />}
              <span>{Math.abs(delta).toFixed(1)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const KPICards = ({ kpis, comparisonKPIs, variant }: KPICardsProps) => {
  const { t } = useTranslation();
  const { format } = useCurrency();
  const allCards: CardData[] = [
    {
      icon: <PiCurrencyDollar size={24} />,
      rawValue: kpis.totalSales,
      formatValue: format,
      comparisonValue: comparisonKPIs?.totalSales,
      label: t('reports.kpi.totalSales'),
      className: 'kpi-card--sales'
    },
    {
      icon: <PiHash size={24} />,
      rawValue: kpis.totalOrders,
      formatValue: (value) => Math.round(value).toString(),
      comparisonValue: comparisonKPIs?.totalOrders,
      label: t('reports.kpi.orders'),
      className: 'kpi-card--orders'
    },
    {
      icon: <PiTrendUp size={24} />,
      rawValue: kpis.averageTicket,
      formatValue: format,
      comparisonValue: comparisonKPIs?.averageTicket,
      label: t('reports.kpi.avgTicket'),
      className: 'kpi-card--ticket'
    },
    {
      icon: <PiWallet size={24} />,
      rawValue: kpis.totalProfit,
      formatValue: format,
      comparisonValue: comparisonKPIs?.totalProfit,
      label: `${t('reports.kpi.profit')} · ${kpis.profitMargin.toFixed(1)}%`,
      className: 'kpi-card--profit',
      warning: kpis.hasIncompleteCost ? t('reports.kpi.profitIncompleteHint') : undefined
    }
  ];

  const cards = variant === 'main' ? allCards.slice(0, 3) : variant === 'side' ? allCards.slice(3) : allCards;

  return (
    <div className={`kpi-cards${variant ? ` kpi-cards--${variant}` : ''}`}>
      {cards.map((card) => (
        <KPICard key={card.label} card={card} />
      ))}
    </div>
  );
};

export default KPICards;
