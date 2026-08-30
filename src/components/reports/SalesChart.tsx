import { useTranslation } from 'react-i18next';
import type { ChartDataPoint } from '../../types/Report';
import { useCurrency } from '../../hooks/useCurrency';
import './SalesChart.scss';

interface SalesChartProps {
  data: ChartDataPoint[];
  // Solo se usa para forzar el remount de las barras (y así repetir la
  // animación de entrada) cuando cambian los totales del período — el
  // resumen de ventas/pedidos/promedio ya vive en las tarjetas de arriba.
  totalSales: number;
}

const formatAxisValue = (value: number, symbol: string): string => {
  if (value === 0) return `${symbol}0`;
  if (value >= 1_000_000) return `${symbol}${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${symbol}${(value / 1_000).toFixed(1)}K`;
  return `${symbol}${Math.round(value)}`;
};

const SalesChart = ({ data, totalSales }: SalesChartProps) => {
  const { t } = useTranslation();
  const { symbol } = useCurrency();

  if (data.length === 0) {
    return (
      <div className="sales-chart sales-chart--empty">
        <p>{t('reports.chart.noData')}</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="sales-chart">
      <div className="sales-chart__chart-area">
        <div className="sales-chart__grid">
          {[100, 75, 50, 25, 0].map((pct) => (
            <div key={pct} className="sales-chart__grid-line">
              <span className="sales-chart__grid-value">
                {formatAxisValue(maxValue * pct / 100, symbol)}
              </span>
            </div>
          ))}
        </div>
        <div className="sales-chart__bars" key={`${totalSales}-${data.length}`}>
          {data.map((d, i) => {
            const pct = (d.value / maxValue) * 100;
            const showLabel = data.length <= 7 || i === 0 || i === data.length - 1 || i % Math.ceil(data.length / 5) === 0;
            return (
              <div key={i} className="sales-chart__col">
                <div className="sales-chart__track">
                  <div
                    className="sales-chart__fill"
                    style={{
                      height: d.value > 0 ? `max(${pct.toFixed(2)}%, 4px)` : '0',
                      animationDelay: `${i * 18}ms`,
                    }}
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
    </div>
  );
};

export default SalesChart;
