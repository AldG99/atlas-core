import { useState } from 'react';
import type { PeriodType, DateRange } from '../../types/Reporte';
import './PeriodFilter.scss';

interface PeriodFilterProps {
  period: PeriodType;
  onPeriodChange: (period: PeriodType) => void;
  onCustomRange: (range: DateRange) => void;
}

const PERIODS: { value: PeriodType; label: string }[] = [
  { value: 'hoy', label: 'Hoy' },
  { value: 'semana', label: 'Esta semana' },
  { value: 'mes', label: 'Este mes' },
  { value: 'personalizado', label: 'Personalizado' }
];

const PeriodFilter = ({ period, onPeriodChange, onCustomRange }: PeriodFilterProps) => {
  const [showCustom, setShowCustom] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handlePeriodClick = (value: PeriodType) => {
    if (value === 'personalizado') {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      onPeriodChange(value);
    }
  };

  const handleApplyCustom = () => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      onCustomRange({ start, end });
      setShowCustom(false);
    }
  };

  return (
    <div className="period-filter">
      <div className="period-filter__buttons">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            className={`period-filter__btn ${period === p.value ? 'period-filter__btn--active' : ''}`}
            onClick={() => handlePeriodClick(p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {showCustom && (
        <div className="period-filter__custom">
          <input
            type="date"
            className="input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span className="period-filter__separator">a</span>
          <input
            type="date"
            className="input"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <button
            className="btn btn--primary"
            onClick={handleApplyCustom}
            disabled={!startDate || !endDate}
          >
            Aplicar
          </button>
        </div>
      )}
    </div>
  );
};

export default PeriodFilter;
