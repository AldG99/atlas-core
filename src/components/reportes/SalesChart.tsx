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
  const chartHeight = 200;
  const chartWidth = 600;
  const padding = { top: 20, right: 20, bottom: 40, left: 20 };
  const availableWidth = chartWidth - padding.left - padding.right;
  const barWidth = Math.min(30, availableWidth / data.length - 4);

  const points = data.map((d, i) => {
    const x = padding.left + (i * availableWidth) / (data.length - 1 || 1);
    const y = padding.top + chartHeight - (d.value / maxValue) * chartHeight;
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="sales-chart">
      <h3 className="sales-chart__title">Tendencia de Ventas</h3>

      <div className="sales-chart__container">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight + padding.top + padding.bottom}`}
          className="sales-chart__svg"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + chartHeight * (1 - ratio);
            return (
              <line
                key={ratio}
                x1={padding.left}
                y1={y}
                x2={chartWidth - padding.right}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth="1"
              />
            );
          })}

          {/* Bars */}
          {data.map((d, i) => {
            const barHeight = (d.value / maxValue) * chartHeight;
            const x = padding.left + (i * availableWidth) / (data.length - 1 || 1) - barWidth / 2;
            const y = padding.top + chartHeight - barHeight;
            const showLabel = data.length <= 14 || i % Math.ceil(data.length / 10) === 0;

            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(barHeight, 0)}
                  fill="#3b82f6"
                  opacity="0.3"
                  rx="2"
                />
                {/* Label */}
                {showLabel && (
                  <text
                    x={x + barWidth / 2}
                    y={padding.top + chartHeight + 20}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#64748b"
                  >
                    {d.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Trend line */}
          {points.length > 1 && (
            <path
              d={linePath}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Dots */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="4"
              fill="#3b82f6"
            />
          ))}
        </svg>
      </div>

      <div className="sales-chart__summary">
        <div className="sales-chart__summary-item">
          <span className="sales-chart__summary-value">{formatCurrency(totalVentas)}</span>
          <span className="sales-chart__summary-label">Total</span>
        </div>
        <div className="sales-chart__summary-item">
          <span className="sales-chart__summary-value">{totalPedidos}</span>
          <span className="sales-chart__summary-label">Pedidos</span>
        </div>
      </div>
    </div>
  );
};

export default SalesChart;
