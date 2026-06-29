import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { PeriodType, ReporteData } from '../types/Reporte';
import type { Pedido } from '../types/Pedido';
import { useAuth } from './useAuth';
import { useProductos } from './useProductos';
import { getPedidosByDateRange } from '../services/pedidoService';
import {
  getDateRange,
  getYearAgoDateRange,
  calculateKPIs,
  calculateStatusBreakdown,
  calculateTopClientes,
  calculateTopProductos,
  calculateInventarioStats,
  calculateChartData,
} from '../utils/reportCalculations';

interface CacheEntry {
  current: { pedidos: Pedido[]; hasMore: boolean };
  yearAgo: { pedidos: Pedido[]; hasMore: boolean };
  cachedAt: number;
}

const reportesCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000;

const getCacheKey = (negocioUid: string, start: Date, end: Date) =>
  `${negocioUid}:${start.getTime()}:${end.getTime()}`;

export const useReportes = () => {
  const { negocioUid } = useAuth();
  const { productos } = useProductos();
  const { i18n } = useTranslation();
  const [period, setPeriod] = useState<PeriodType>('semana');
  const [pedidosPeriodo, setPedidosPeriodo] = useState<Pedido[]>([]);
  const [pedidosAnterior, setPedidosAnterior] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const dateRange = useMemo(() => getDateRange(period), [period]);

  useEffect(() => {
    if (!negocioUid) return;

    const cacheKey = getCacheKey(negocioUid, dateRange.start, dateRange.end);
    const cached = reportesCache.get(cacheKey);

    if (cached && Date.now() - cached.cachedAt < CACHE_TTL) {
      setPedidosPeriodo(cached.current.pedidos.filter(p => !p.archivado));
      setPedidosAnterior(cached.yearAgo.pedidos.filter(p => !p.archivado));
      setHasMore(cached.current.hasMore);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const yearAgoRange = getYearAgoDateRange(dateRange);

    Promise.all([
      getPedidosByDateRange(negocioUid, dateRange.start, dateRange.end),
      getPedidosByDateRange(negocioUid, yearAgoRange.start, yearAgoRange.end),
    ])
      .then(([current, yearAgo]) => {
        if (cancelled) return;
        reportesCache.set(cacheKey, { current, yearAgo, cachedAt: Date.now() });
        setPedidosPeriodo(current.pedidos.filter(p => !p.archivado));
        setPedidosAnterior(yearAgo.pedidos.filter(p => !p.archivado));
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
  }, [negocioUid, dateRange]);

  const reporteData: ReporteData = useMemo(() => ({
    kpis: calculateKPIs(pedidosPeriodo),
    comparisonKPIs: calculateKPIs(pedidosAnterior),
    statusBreakdown: calculateStatusBreakdown(pedidosPeriodo),
    topClientes: calculateTopClientes(pedidosPeriodo),
    topProductos: calculateTopProductos(pedidosPeriodo),
    chartData: calculateChartData(pedidosPeriodo, period, dateRange, i18n.language),
    inventario: calculateInventarioStats(productos),
  }), [pedidosPeriodo, pedidosAnterior, period, dateRange, productos, i18n.language]);

  return {
    reporteData,
    filteredPedidos: pedidosPeriodo,
    period,
    dateRange,
    loading,
    error,
    hasMore,
    setPeriod,
  };
};
