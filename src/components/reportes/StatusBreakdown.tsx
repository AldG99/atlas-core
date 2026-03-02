import type { StatusBreakdownItem } from '../../types/Reporte';
import { PEDIDO_STATUS, PEDIDO_STATUS_COLORS } from '../../constants/pedidoStatus';
import { formatCurrency } from '../../utils/formatters';
import './StatusBreakdown.scss';

interface StatusBreakdownProps {
  breakdown: StatusBreakdownItem[];
}

const RADIUS = 34;
const STROKE_WIDTH = 11;
const CX = 50;
const CY = 50;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const StatusBreakdown = ({ breakdown }: StatusBreakdownProps) => {
  const total = breakdown.reduce((sum, item) => sum + item.cantidad, 0);

  let cumulativeOffset = 0;
  const segments = breakdown
    .filter((item) => item.porcentaje > 0)
    .map((item) => {
      const length = (item.porcentaje / 100) * CIRCUMFERENCE;
      const seg = { ...item, length, offset: cumulativeOffset };
      cumulativeOffset += length;
      return seg;
    });

  return (
    <div className="status-breakdown">
      <h3 className="status-breakdown__title">Por Estado</h3>

      {total === 0 ? (
        <p className="status-breakdown__empty">No hay pedidos en este período</p>
      ) : (
        <>
          <div className="status-breakdown__donut">
            <svg viewBox="0 0 100 100" className="status-breakdown__svg">
              <g transform={`rotate(-90, ${CX}, ${CY})`}>
                <circle
                  cx={CX} cy={CY} r={RADIUS}
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth={STROKE_WIDTH}
                />
                {segments.map((seg) => (
                  <circle
                    key={seg.estado}
                    cx={CX} cy={CY} r={RADIUS}
                    fill="none"
                    stroke={PEDIDO_STATUS_COLORS[seg.estado]}
                    strokeWidth={STROKE_WIDTH}
                    strokeDasharray={`${seg.length} ${CIRCUMFERENCE - seg.length}`}
                    strokeDashoffset={-seg.offset}
                    strokeLinecap="butt"
                  />
                ))}
              </g>
              <text
                x="50" y="46"
                textAnchor="middle"
                style={{ fontSize: '14px', fontWeight: 700, fill: '#111827' }}
              >
                {total}
              </text>
              <text
                x="50" y="57"
                textAnchor="middle"
                style={{ fontSize: '7px', fill: '#6b7280', fontWeight: 500 }}
              >
                pedidos
              </text>
            </svg>
          </div>

          <ul className="status-breakdown__list">
            {breakdown.map((item) => (
              <li key={item.estado} className="status-breakdown__item">
                <div className="status-breakdown__item-header">
                  <span
                    className="status-breakdown__dot"
                    style={{ backgroundColor: PEDIDO_STATUS_COLORS[item.estado] }}
                  />
                  <span className="status-breakdown__name">{PEDIDO_STATUS[item.estado]}</span>
                </div>
                <div className="status-breakdown__item-data">
                  <span className="status-breakdown__count">{item.cantidad}</span>
                  <span className="status-breakdown__percent">({item.porcentaje.toFixed(0)}%)</span>
                  <span className="status-breakdown__total">{formatCurrency(item.total)}</span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default StatusBreakdown;
