import { useState, useMemo } from 'react';
import type { PeriodType, ReporteData } from '../types/Reporte';
import { usePedidos } from './usePedidos';
import { useProductos } from './useProductos';
import {
  getDateRange,
  getYearAgoDateRange,
  filterPedidosByDate,
  calculateKPIs,
  calculateStatusBreakdown,
  calculateTopClientes,
  calculateTopProductos,
  calculateInventarioStats,
  calculateChartData
} from '../utils/reportCalculations';

export const useReportes = () => {
  const { pedidos: allPedidos, loading, error } = usePedidos();
  const { productos } = useProductos();
  const [period, setPeriod] = useState<PeriodType>('semana');

  const dateRange = useMemo(() => {
    return getDateRange(period);
  }, [period]);

  const filteredPedidos = useMemo(() => {
    return filterPedidosByDate(allPedidos, dateRange);
  }, [allPedidos, dateRange]);

  const yearAgoPedidos = useMemo(() => {
    const yearAgoRange = getYearAgoDateRange(dateRange);
    return filterPedidosByDate(allPedidos, yearAgoRange);
  }, [allPedidos, dateRange]);

  const reporteData: ReporteData = useMemo(() => {
    return {
      kpis: calculateKPIs(filteredPedidos),
      comparisonKPIs: calculateKPIs(yearAgoPedidos),
      statusBreakdown: calculateStatusBreakdown(filteredPedidos),
      topClientes: calculateTopClientes(filteredPedidos),
      topProductos: calculateTopProductos(filteredPedidos),
      chartData: calculateChartData(filteredPedidos, period, dateRange),
      inventario: calculateInventarioStats(productos)
    };
  }, [filteredPedidos, yearAgoPedidos, period, dateRange, productos]);

  return {
    reporteData,
    filteredPedidos,
    period,
    dateRange,
    loading,
    error,
    setPeriod
  };
};
