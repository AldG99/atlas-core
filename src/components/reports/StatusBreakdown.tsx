import { useTranslation } from 'react-i18next';
import type { StatusBreakdownItem } from '../../types/Report';
import { ORDER_STATUS_COLORS } from '../../constants/orderStatus';
import { useCurrency } from '../../hooks/useCurrency';
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
  const { t } = useTranslation();
  const { format } = useCurrency();
  const total = breakdown.reduce((sum, item) => sum + item.count, 0);

  type Segment = StatusBreakdownItem & { length: number; offset: number };
  const segments = breakdown
    .filter((item) => item.percentage > 0)
    .reduce<Segment[]>((acc, item) => {
      const length = (item.percentage / 100) * CIRCUMFERENCE;
      const offset = acc.reduce((sum, s) => sum + s.length, 0);
      return [...acc, { ...item, length, offset }];
    }, []);

  return (
    <div className="status-breakdown">
      <h3 className="status-breakdown__title">{t('reports.statusBreakdown.title')}</h3>

      {total === 0 ? (
        <p className="status-breakdown__empty">{t('reports.statusBreakdown.empty')}</p>
      ) : (
        <>
          <div className="status-breakdown__donut">
            <svg viewBox="0 0 100 100" className="status-breakdown__svg">
              <g
                transform={`rotate(-90, ${CX}, ${CY})`}
                key={segments.map(s => `${s.status}${s.percentage}`).join('-')}
              >
                <circle
                  cx={CX} cy={CY} r={RADIUS}
                  fill="none"
                  stroke="#DDD9D2"
                  strokeWidth={STROKE_WIDTH}
                />
                {segments.map((seg, i) => (
                  <circle
                    key={seg.status}
                    cx={CX} cy={CY} r={RADIUS}
                    fill="none"
                    stroke={ORDER_STATUS_COLORS[seg.status]}
                    strokeWidth={STROKE_WIDTH}
                    strokeDasharray={`${seg.length} ${CIRCUMFERENCE - seg.length}`}
                    strokeLinecap="butt"
                    className="status-breakdown__segment"
                    style={{
                      '--dashoffset-start': seg.length - seg.offset,
                      '--dashoffset-end': -seg.offset,
                      animationDelay: `${i * 150}ms`,
                    } as React.CSSProperties}
                  />
                ))}
              </g>
              <text
                x="50" y="46"
                textAnchor="middle"
                style={{ fontSize: '14px', fontWeight: 700, fill: '#1A1917' }}
              >
                {total}
              </text>
              <text
                x="50" y="57"
                textAnchor="middle"
                style={{ fontSize: '7px', fill: '#716D66', fontWeight: 500 }}
              >
                {t('reports.statusBreakdown.orders')}
              </text>
            </svg>
          </div>

          <ul className="status-breakdown__list">
            {breakdown.map((item) => (
              <li key={item.status} className="status-breakdown__item">
                <div className="status-breakdown__item-header">
                  <span
                    className="status-breakdown__dot"
                    style={{ backgroundColor: ORDER_STATUS_COLORS[item.status] }}
                  />
                  <span className="status-breakdown__name">{t(`orders.status.${item.status}`)}</span>
                </div>
                <div className="status-breakdown__item-data">
                  <span className="status-breakdown__count">{item.count}</span>
                  <span className="status-breakdown__percent">({item.percentage.toFixed(0)}%)</span>
                  <span className="status-breakdown__total">{format(item.total)}</span>
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
