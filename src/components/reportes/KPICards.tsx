import type { KPIs } from '../../types/Reporte';
import { formatCurrency } from '../../utils/formatters';
import './KPICards.scss';

interface KPICardsProps {
  kpis: KPIs;
}

const KPICards = ({ kpis }: KPICardsProps) => {
  const cards = [
    {
      icon: '$',
      value: formatCurrency(kpis.ventasTotales),
      label: 'Ventas totales',
      className: 'kpi-card--ventas'
    },
    {
      icon: '#',
      value: kpis.totalPedidos.toString(),
      label: 'Pedidos',
      className: 'kpi-card--pedidos'
    },
    {
      icon: '~',
      value: formatCurrency(kpis.ticketPromedio),
      label: 'Ticket promedio',
      className: 'kpi-card--ticket'
    },
    {
      icon: '@',
      value: kpis.clientesUnicos.toString(),
      label: 'Clientes',
      className: 'kpi-card--clientes'
    }
  ];

  return (
    <div className="kpi-cards">
      {cards.map((card) => (
        <div key={card.label} className={`kpi-card ${card.className}`}>
          <div className="kpi-card__icon">{card.icon}</div>
          <div className="kpi-card__content">
            <div className="kpi-card__value">{card.value}</div>
            <div className="kpi-card__label">{card.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KPICards;
