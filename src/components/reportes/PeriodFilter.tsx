import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { PeriodType } from '../../types/Reporte';
import './PeriodFilter.scss';

interface PeriodFilterProps {
  period: PeriodType;
  onPeriodChange: (period: PeriodType) => void;
}

const PERIOD_VALUES: PeriodType[] = ['hoy', 'semana', 'mes'];

const PeriodFilter = ({ period, onPeriodChange }: PeriodFilterProps) => {
  const { t } = useTranslation();

  const PERIODS: { value: PeriodType; label: string }[] = [
    { value: 'hoy',    label: t('reports.period.today') },
    { value: 'semana', label: t('reports.period.week') },
    { value: 'mes',    label: t('reports.period.month') },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (['input', 'select', 'textarea'].includes(tag)) return;
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      const currentIndex = PERIOD_VALUES.indexOf(period);
      const nextIndex = e.key === 'ArrowRight'
        ? Math.min(currentIndex + 1, PERIOD_VALUES.length - 1)
        : Math.max(currentIndex - 1, 0);
      if (nextIndex !== currentIndex) onPeriodChange(PERIOD_VALUES[nextIndex]);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [period, onPeriodChange]);

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
