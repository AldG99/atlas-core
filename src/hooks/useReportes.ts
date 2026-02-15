import { useState, useEffect, useMemo } from 'react';
import type { PeriodType, ReporteData } from '../types/Reporte';
import { usePedidos } from './usePedidos';
import {
  getDateRange,
  filterPedidosByDate,
  calculateKPIs,
  calculateStatusBreakdown,
  calculateTopClientes,
  calculateChartData
} from '../utils/reportCalculations';

export const useReportes = () => {
  const { pedidos: allPedidos, loading, error, fetchPedidos } = usePedidos();
  const [period, setPeriod] = useState<PeriodType>('semana');

  const dateRange = useMemo(() => {
    return getDateRange(period);
  }, [period]);

  const filteredPedidos = useMemo(() => {
    return filterPedidosByDate(allPedidos, dateRange);
  }, [allPedidos, dateRange]);

  const reporteData: ReporteData = useMemo(() => {
    return {
      kpis: calculateKPIs(filteredPedidos),
      statusBreakdown: calculateStatusBreakdown(filteredPedidos),
      topClientes: calculateTopClientes(filteredPedidos),
      chartData: calculateChartData(filteredPedidos, period, dateRange)
    };
  }, [filteredPedidos, period, dateRange]);

  useEffect(() => {
    fetchPedidos();
  }, [fetchPedidos]);

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
