import { useState, useMemo } from 'react';
import type { Pedido, PedidoStatus } from '../types/Pedido';

export type SortOption = 'fecha_desc' | 'fecha_asc' | 'total_desc' | 'total_asc' | 'nombre_asc' | 'nombre_desc';
export type DateFilter = 'todos' | 'hoy' | 'semana' | 'mes';
export type StatusFilter = PedidoStatus | 'todos' | 'abono_pendiente';

const DIAS_ABONO_SIN_MOVIMIENTO = 3;

const diffDiasAbono = (fecha: Date): number =>
  Math.floor((Date.now() - new Date(fecha).getTime()) / (1000 * 60 * 60 * 24));

export const SORT_OPTIONS: Record<SortOption, string> = {
  fecha_desc: 'Más recientes',
  fecha_asc: 'Más antiguos',
  total_desc: 'Mayor total',
  total_asc: 'Menor total',
  nombre_asc: 'Nombre A-Z',
  nombre_desc: 'Nombre Z-A'
};

export const DATE_FILTERS: Record<DateFilter, string> = {
  todos: 'Todas las fechas',
  hoy: 'Hoy',
  semana: 'Esta semana',
  mes: 'Este mes'
};

interface UseDashboardFiltersOptions {
  pedidos: Pedido[];
  allPedidos: Pedido[];
  fetchPedidos: () => Promise<void>;
  fetchByStatus: (estado: PedidoStatus) => Promise<void>;
}

export const useDashboardFilters = ({
  pedidos,
  allPedidos,
  fetchPedidos,
  fetchByStatus,
}: UseDashboardFiltersOptions) => {
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('fecha_desc');
  const [dateFilter, setDateFilter] = useState<DateFilter>('todos');

  const statusCounts = useMemo(() => ({
    pendiente: allPedidos.filter((p) => p.estado === 'pendiente').length,
    en_preparacion: allPedidos.filter((p) => p.estado === 'en_preparacion').length,
    entregado: allPedidos.filter((p) => p.estado === 'entregado').length,
  }), [allPedidos]);

  const todaySummary = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const pedidosHoy = allPedidos.filter((p) => new Date(p.fechaCreacion) >= startOfDay);
    const totalVentas = pedidosHoy.reduce((sum, p) => sum + p.total, 0);
    const pedidosEntregados = pedidosHoy.filter((p) => p.estado === 'entregado');
    return {
      cantidadPedidos: pedidosHoy.length,
      totalVentas,
      pedidosEntregados: pedidosEntregados.length,
      ventasEntregadas: pedidosEntregados.reduce((sum, p) => sum + p.total, 0),
    };
  }, [allPedidos]);

  const filteredAndSortedPedidos = useMemo(() => {
    let result = filterStatus === 'abono_pendiente' ? [...allPedidos] : [...pedidos];

    // Filtro por fecha
    if (dateFilter !== 'todos') {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      result = result.filter((pedido) => {
        const pedidoDate = new Date(pedido.fechaCreacion);
        switch (dateFilter) {
          case 'hoy':
            return pedidoDate >= startOfDay;
          case 'semana': {
            const startOfWeek = new Date(startOfDay);
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
            return pedidoDate >= startOfWeek;
          }
          case 'mes': {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            return pedidoDate >= startOfMonth;
          }
          default:
            return true;
        }
      });
    }

    // Filtro por abono pendiente
    if (filterStatus === 'abono_pendiente') {
      result = result.filter((p) => {
        const abonos = p.abonos || [];
        if (abonos.length === 0) return false;
        const totalPagado = abonos.reduce((sum, a) => sum + a.monto, 0);
        if (totalPagado <= 0 || totalPagado >= p.total) return false;
        const ultimoAbono = abonos.reduce((max, a) =>
          new Date(a.fecha) > new Date(max.fecha) ? a : max
        );
        return diffDiasAbono(ultimoAbono.fecha) >= DIAS_ABONO_SIN_MOVIMIENTO;
      });
    }

    // Filtro por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.clienteNombre.toLowerCase().includes(term) ||
          p.clienteTelefono.toLowerCase().includes(term)
      );
    }

    // Ordenamiento
    result.sort((a, b) => {
      switch (sortBy) {
        case 'fecha_desc':
          return new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime();
        case 'fecha_asc':
          return new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime();
        case 'total_desc':
          return b.total - a.total;
        case 'total_asc':
          return a.total - b.total;
        case 'nombre_asc':
          return a.clienteNombre.localeCompare(b.clienteNombre);
        case 'nombre_desc':
          return b.clienteNombre.localeCompare(a.clienteNombre);
        default:
          return 0;
      }
    });

    return result;
  }, [pedidos, allPedidos, searchTerm, sortBy, dateFilter, filterStatus]);

  const handleFilterChange = async (status: StatusFilter) => {
    setFilterStatus(status);
    if (status === 'todos') {
      await fetchPedidos();
    } else if (status !== 'abono_pendiente') {
      await fetchByStatus(status as PedidoStatus);
    }
  };

  return {
    filterStatus,
    setFilterStatus,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    dateFilter,
    setDateFilter,
    statusCounts,
    todaySummary,
    filteredAndSortedPedidos,
    handleFilterChange,
  };
};
