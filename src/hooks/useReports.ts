import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { PeriodType, ReportData } from '../types/Report';
import type { Order } from '../types/Order';
import { useAuth } from './useAuth';
import { getOrdersByDateRange } from '../services/orderService';
import {
  getReportsCacheKey,
  getCachedReportEntry,
  setCachedReportEntry,
  REPORTS_CACHE_TTL,
} from '../services/reportsCache';
import {
  getDateRange,
  getPreviousPeriodDateRange,
  calculateKPIs,
  calculateStatusBreakdown,
  calculateTopClients,
  calculateTopProducts,
  calculateChartData,
} from '../utils/reportCalculations';

const startOfMonth = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), 1);
const addMonths = (date: Date, delta: number): Date =>
  new Date(date.getFullYear(), date.getMonth() + delta, 1);

export const useReports = () => {
  const { businessUid, user } = useAuth();
  const { i18n } = useTranslation();
  const [period, setPeriod] = useState<PeriodType>('week');
  const [viewedMonth, setViewedMonth] = useState<Date>(() => startOfMonth(new Date()));
  const [currentPeriodOrders, setCurrentPeriodOrders] = useState<Order[]>([]);
  const [previousPeriodOrders, setPreviousPeriodOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Acota qué tan atrás se puede navegar en la vista de mes: desde que se creó
  // la cuenta hasta el mes actual (no se puede ir a meses futuros).
  const minMonth = useMemo(
    () => startOfMonth(user?.registeredAt ? new Date(user.registeredAt) : new Date()),
    [user]
  );
  const maxMonth = useMemo(() => startOfMonth(new Date()), []);
  const canGoPreviousMonth = viewedMonth.getTime() > minMonth.getTime();
  const canGoNextMonth = viewedMonth.getTime() < maxMonth.getTime();

  const goToPreviousMonth = () => {
    if (canGoPreviousMonth) setViewedMonth((m) => addMonths(m, -1));
  };
  const goToNextMonth = () => {
    if (canGoNextMonth) setViewedMonth((m) => addMonths(m, 1));
  };

  const dateRange = useMemo(
    () => getDateRange(period, period === 'month' ? viewedMonth : undefined),
    [period, viewedMonth]
  );

  useEffect(() => {
    if (!businessUid) return;

    const cacheKey = getReportsCacheKey(businessUid, dateRange.start, dateRange.end);
    const cached = getCachedReportEntry(cacheKey);

    if (cached && Date.now() - cached.cachedAt < REPORTS_CACHE_TTL) {
      // Falso positivo del compiler: hidratar desde caché en memoria, no un fetch. Ver eslint.config.js.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentPeriodOrders(cached.current.orders);
      setPreviousPeriodOrders(cached.previous.orders);
      setHasMore(cached.current.hasMore);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const previousRange = getPreviousPeriodDateRange(dateRange);

    Promise.all([
      getOrdersByDateRange(businessUid, dateRange.start, dateRange.end),
      getOrdersByDateRange(businessUid, previousRange.start, previousRange.end),
    ])
      .then(([current, previous]) => {
        if (cancelled) return;
        setCachedReportEntry(cacheKey, { current, previous, cachedAt: Date.now() });
        // Los reportes deben reflejar toda la actividad del período, incluyendo
        // pedidos ya archivados (el archivado solo despeja el Dashboard, no
        // significa que el pedido no haya ocurrido).
        setCurrentPeriodOrders(current.orders);
        setPreviousPeriodOrders(previous.orders);
        setHasMore(current.hasMore);
      })
      .catch(err => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : i18n.t('reports.loadError'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [businessUid, dateRange, i18n]);

  const reportData: ReportData = useMemo(() => ({
    kpis: calculateKPIs(currentPeriodOrders),
    comparisonKPIs: calculateKPIs(previousPeriodOrders),
    statusBreakdown: calculateStatusBreakdown(currentPeriodOrders),
    topClients: calculateTopClients(currentPeriodOrders, 5),
    topProducts: calculateTopProducts(currentPeriodOrders, 5),
    chartData: calculateChartData(currentPeriodOrders, period, dateRange, i18n.language),
  }), [currentPeriodOrders, previousPeriodOrders, period, dateRange, i18n.language]);

  return {
    reportData,
    filteredOrders: currentPeriodOrders,
    period,
    dateRange,
    loading,
    error,
    hasMore,
    setPeriod,
    viewedMonth,
    goToPreviousMonth,
    goToNextMonth,
    canGoPreviousMonth,
    canGoNextMonth,
  };
};
