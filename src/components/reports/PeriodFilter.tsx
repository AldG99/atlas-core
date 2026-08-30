import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PeriodType } from '../../types/Report';
import './PeriodFilter.scss';

interface PeriodFilterProps {
  period: PeriodType;
  onPeriodChange: (period: PeriodType) => void;
  viewedMonth: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  canGoPreviousMonth: boolean;
  canGoNextMonth: boolean;
}

const PERIOD_VALUES: PeriodType[] = ['today', 'week', 'month'];

const capitalize = (s: string): string => s.replace(/^\w/, (c) => c.toUpperCase());

const PeriodFilter = ({
  period,
  onPeriodChange,
  viewedMonth,
  onPreviousMonth,
  onNextMonth,
  canGoPreviousMonth,
  canGoNextMonth,
}: PeriodFilterProps) => {
  const { t, i18n } = useTranslation();
  const monthLabel = capitalize(
    new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric' }).format(viewedMonth)
  );

  const PERIODS: { value: PeriodType; label: string }[] = [
    { value: 'today',    label: t('reports.period.today') },
    { value: 'week', label: t('reports.period.week') },
    { value: 'month',    label: t('reports.period.month') },
  ];

  // Navegar de mes funciona sin importar qué pestaña esté activa — si no
  // estabas en "Mes", te cambia a esa vista para mostrar el mes elegido.
  const handlePreviousMonth = () => {
    if (period !== 'month') onPeriodChange('month');
    onPreviousMonth();
  };
  const handleNextMonth = () => {
    if (period !== 'month') onPeriodChange('month');
    onNextMonth();
  };

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

      <div className={`period-filter__month-nav${period === 'month' ? ' period-filter__month-nav--active' : ''}`}>
        <button
          className="period-filter__month-btn"
          onClick={handlePreviousMonth}
          disabled={!canGoPreviousMonth}
          aria-label={t('reports.period.previousMonth')}
        >
          <ChevronLeft size={16} />
        </button>
        <span className="period-filter__month-label">{monthLabel}</span>
        <button
          className="period-filter__month-btn"
          onClick={handleNextMonth}
          disabled={!canGoNextMonth}
          aria-label={t('reports.period.nextMonth')}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default PeriodFilter;
