import type { ChartDataPoint } from '../../types/Reporte';
import { formatCurrency } from '../../utils/formatters';
import './SalesChart.scss';

interface SalesChartProps {
  data: ChartDataPoint[];
  totalVentas: number;
  totalPedidos: number;
}

const SalesChart = ({ data, totalVentas, totalPedidos }: SalesChartProps) => {
  if (data.length === 0) {
    return (
      <div className="sales-chart sales-chart--empty">
        <p>No hay datos para mostrar</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="sales-chart">
      <span className="sales-chart__label">Total ventas</span>
      <span className="sales-chart__amount">{formatCurrency(totalVentas)}</span>

      <div className="sales-chart__chart-area">
        <div className="sales-chart__grid">
          {[100, 75, 50, 25, 0].map((pct) => (
            <div key={pct} className="sales-chart__grid-line">
              <span className="sales-chart__grid-value">
                {formatCurrency(maxValue * (pct / 100))}
              </span>
            </div>
          ))}
        </div>
        <div className="sales-chart__bars">
          {data.map((d, i) => {
            const pct = (d.value / maxValue) * 100;
            const showLabel = data.length <= 7 || i === 0 || i === data.length - 1 || i % Math.ceil(data.length / 5) === 0;
            return (
              <div key={i} className="sales-chart__col">
                <div className="sales-chart__track">
                  <div
                    className="sales-chart__fill"
                    style={{ height: `${Math.max(pct, d.value > 0 ? 6 : 0)}%` }}
                  />
                </div>
                <span className="sales-chart__day">
                  {showLabel ? d.label : ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="sales-chart__footer">
        <div className="sales-chart__stat">
          <span className="sales-chart__stat-value">{totalPedidos}</span>
          <span className="sales-chart__stat-label">Pedidos</span>
        </div>
        <div className="sales-chart__stat">
          <span className="sales-chart__stat-value">
            {formatCurrency(totalPedidos > 0 ? totalVentas / totalPedidos : 0)}
          </span>
          <span className="sales-chart__stat-label">Promedio</span>
        </div>
      </div>
    </div>
  );
};

export default SalesChart;
