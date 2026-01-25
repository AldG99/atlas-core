import { useState, useEffect, useMemo } from 'react';
import type { PeriodType, DateRange, ReporteData } from '../types/Reporte';
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
  const [customRange, setCustomRange] = useState<DateRange | undefined>();

  const dateRange = useMemo(() => {
    return getDateRange(period, customRange);
  }, [period, customRange]);

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

  const handlePeriodChange = (newPeriod: PeriodType) => {
    setPeriod(newPeriod);
    if (newPeriod !== 'personalizado') {
      setCustomRange(undefined);
    }
  };

  const handleCustomRange = (range: DateRange) => {
    setCustomRange(range);
    setPeriod('personalizado');
  };

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
    setPeriod: handlePeriodChange,
    setCustomRange: handleCustomRange
  };
};
