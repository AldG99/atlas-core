import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { PeriodType, ReportData } from '../types/Report';
import type { Order } from '../types/Order';
import { useAuth } from './useAuth';
import { useProducts } from './useProducts';
import { getOrdersByDateRange } from '../services/orderService';
import {
  getDateRange,
  getYearAgoDateRange,
  calculateKPIs,
  calculateStatusBreakdown,
  calculateTopClients,
  calculateTopProducts,
  calculateInventoryStats,
  calculateChartData,
} from '../utils/reportCalculations';

interface CacheEntry {
  current: { orders: Order[]; hasMore: boolean };
  yearAgo: { orders: Order[]; hasMore: boolean };
  cachedAt: number;
}

const reportsCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000;

const getCacheKey = (businessUid: string, start: Date, end: Date) =>
  `${businessUid}:${start.getTime()}:${end.getTime()}`;

export const useReports = () => {
  const { businessUid } = useAuth();
  const { products } = useProducts();
  const { i18n } = useTranslation();
  const [period, setPeriod] = useState<PeriodType>('week');
  const [currentPeriodOrders, setCurrentPeriodOrders] = useState<Order[]>([]);
  const [previousPeriodOrders, setPreviousPeriodOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const dateRange = useMemo(() => getDateRange(period), [period]);

  useEffect(() => {
    if (!businessUid) return;

    const cacheKey = getCacheKey(businessUid, dateRange.start, dateRange.end);
    const cached = reportsCache.get(cacheKey);

    if (cached && Date.now() - cached.cachedAt < CACHE_TTL) {
      setCurrentPeriodOrders(cached.current.orders.filter(o => !o.archived));
      setPreviousPeriodOrders(cached.yearAgo.orders.filter(o => !o.archived));
      setHasMore(cached.current.hasMore);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const yearAgoRange = getYearAgoDateRange(dateRange);

    Promise.all([
      getOrdersByDateRange(businessUid, dateRange.start, dateRange.end),
      getOrdersByDateRange(businessUid, yearAgoRange.start, yearAgoRange.end),
    ])
      .then(([current, yearAgo]) => {
        if (cancelled) return;
        reportsCache.set(cacheKey, { current, yearAgo, cachedAt: Date.now() });
        setCurrentPeriodOrders(current.orders.filter(o => !o.archived));
        setPreviousPeriodOrders(yearAgo.orders.filter(o => !o.archived));
        setHasMore(current.hasMore);
      })
      .catch(err => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Error al cargar reportes');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [businessUid, dateRange]);

  const reportData: ReportData = useMemo(() => ({
    kpis: calculateKPIs(currentPeriodOrders),
    comparisonKPIs: calculateKPIs(previousPeriodOrders),
    statusBreakdown: calculateStatusBreakdown(currentPeriodOrders),
    topClients: calculateTopClients(currentPeriodOrders),
    topProducts: calculateTopProducts(currentPeriodOrders),
    chartData: calculateChartData(currentPeriodOrders, period, dateRange, i18n.language),
    inventory: calculateInventoryStats(products),
  }), [currentPeriodOrders, previousPeriodOrders, period, dateRange, products, i18n.language]);

  return {
    reportData,
    filteredOrders: currentPeriodOrders,
    period,
    dateRange,
    loading,
    error,
    hasMore,
    setPeriod,
  };
};
