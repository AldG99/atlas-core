import type { Pedido, PedidoStatus } from '../types/Pedido';
import type {
  KPIs,
  StatusBreakdownItem,
  TopCliente,
  ChartDataPoint,
  PeriodType
} from '../types/Reporte';

export interface DateRange {
  start: Date;
  end: Date;
}

export const getDateRange = (period: PeriodType): DateRange => {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  switch (period) {
    case 'hoy': {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      return { start, end };
    }
    case 'semana': {
      const start = new Date(end);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
    case 'mes': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      return { start, end };
    }
    default:
      return { start: end, end };
  }
};

export const filterPedidosByDate = (pedidos: Pedido[], dateRange: DateRange): Pedido[] => {
  return pedidos.filter((pedido) => {
    const fecha = new Date(pedido.fechaCreacion);
    return fecha >= dateRange.start && fecha <= dateRange.end;
  });
};

export const calculateKPIs = (pedidos: Pedido[]): KPIs => {
  if (pedidos.length === 0) {
    return {
      ventasTotales: 0,
      totalPedidos: 0,
      ticketPromedio: 0,
      clientesUnicos: 0
    };
  }

  const ventasTotales = pedidos.reduce((sum, p) => sum + p.total, 0);
  const totalPedidos = pedidos.length;
  const ticketPromedio = ventasTotales / totalPedidos;
  const clientesUnicos = new Set(pedidos.map((p) => p.clienteNombre.toLowerCase().trim())).size;

  return {
    ventasTotales,
    totalPedidos,
    ticketPromedio,
    clientesUnicos
  };
};

export const calculateStatusBreakdown = (pedidos: Pedido[]): StatusBreakdownItem[] => {
  const statusMap: Record<PedidoStatus, { cantidad: number; total: number }> = {
    pendiente: { cantidad: 0, total: 0 },
    en_preparacion: { cantidad: 0, total: 0 },
    entregado: { cantidad: 0, total: 0 }
  };

  pedidos.forEach((pedido) => {
    statusMap[pedido.estado].cantidad += 1;
    statusMap[pedido.estado].total += pedido.total;
  });

  const total = pedidos.length;

  return (Object.keys(statusMap) as PedidoStatus[]).map((estado) => ({
    estado,
    cantidad: statusMap[estado].cantidad,
    porcentaje: total > 0 ? (statusMap[estado].cantidad / total) * 100 : 0,
    total: statusMap[estado].total
  }));
};

export const calculateTopClientes = (pedidos: Pedido[], limit: number = 5): TopCliente[] => {
  const clienteMap = new Map<string, { nombre: string; pedidos: number; total: number }>();

  pedidos.forEach((pedido) => {
    const key = pedido.clienteNombre.toLowerCase().trim();
    const existing = clienteMap.get(key);

    if (existing) {
      existing.pedidos += 1;
      existing.total += pedido.total;
    } else {
      clienteMap.set(key, {
        nombre: pedido.clienteNombre,
        pedidos: 1,
        total: pedido.total
      });
    }
  });

  return Array.from(clienteMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
};

export const calculateChartData = (
  pedidos: Pedido[],
  period: PeriodType,
  dateRange: DateRange
): ChartDataPoint[] => {
  if (period === 'hoy') {
    return groupByHour(pedidos);
  }
  return groupByDay(pedidos, dateRange);
};

const groupByHour = (pedidos: Pedido[]): ChartDataPoint[] => {
  const hours: ChartDataPoint[] = [];

  for (let i = 0; i < 24; i++) {
    hours.push({
      label: `${i.toString().padStart(2, '0')}:00`,
      value: 0,
      pedidos: 0
    });
  }

  pedidos.forEach((pedido) => {
    const hour = new Date(pedido.fechaCreacion).getHours();
    hours[hour].value += pedido.total;
    hours[hour].pedidos += 1;
  });

  // Filter to only show hours with activity or between first and last active hour
  const activeHours = hours.filter((h) => h.pedidos > 0);
  if (activeHours.length === 0) return hours.slice(8, 21); // Default business hours

  const firstActive = hours.findIndex((h) => h.pedidos > 0);
  const lastActive = hours.length - 1 - [...hours].reverse().findIndex((h) => h.pedidos > 0);

  // Expand range by 1 hour on each side
  const start = Math.max(0, firstActive - 1);
  const end = Math.min(23, lastActive + 1);

  return hours.slice(start, end + 1);
};

const groupByDay = (pedidos: Pedido[], dateRange: DateRange): ChartDataPoint[] => {
  const days: ChartDataPoint[] = [];
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const current = new Date(dateRange.start);

  while (current <= dateRange.end) {
    const dayOfWeek = current.getDay();
    const dayOfMonth = current.getDate();

    days.push({
      label: `${dayNames[dayOfWeek]} ${dayOfMonth}`,
      value: 0,
      pedidos: 0
    });

    current.setDate(current.getDate() + 1);
  }

  pedidos.forEach((pedido) => {
    const pedidoDate = new Date(pedido.fechaCreacion).toISOString().split('T')[0];
    const startDate = dateRange.start.toISOString().split('T')[0];
    const dayIndex = Math.floor(
      (new Date(pedidoDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (dayIndex >= 0 && dayIndex < days.length) {
      days[dayIndex].value += pedido.total;
      days[dayIndex].pedidos += 1;
    }
  });

  return days;
};
