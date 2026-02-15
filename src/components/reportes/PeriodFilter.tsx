import type { PeriodType } from '../../types/Reporte';
import './PeriodFilter.scss';

interface PeriodFilterProps {
  period: PeriodType;
  onPeriodChange: (period: PeriodType) => void;
}

const PERIODS: { value: PeriodType; label: string }[] = [
  { value: 'hoy', label: 'Hoy' },
  { value: 'semana', label: 'Esta semana' },
  { value: 'mes', label: 'Este mes' }
];

const PeriodFilter = ({ period, onPeriodChange }: PeriodFilterProps) => {
  return (
    <div className="period-filter">
      <div className="period-filter__buttons">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            className={`period-filter__btn ${period === p.value ? 'period-filter__btn--active' : ''}`}
            onClick={() => onPeriodChange(p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PeriodFilter;
