import type { Order, OrderStatus } from '../types/Order';
import type { Product } from '../types/Product';
import type {
  KPIs,
  StatusBreakdownItem,
  TopClient,
  TopProduct,
  InventoryStats,
  ChartDataPoint,
  PeriodType
} from '../types/Report';

export interface DateRange {
  start: Date;
  end: Date;
}

export const getDateRange = (period: PeriodType): DateRange => {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  switch (period) {
    case 'today': {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      return { start, end };
    }
    case 'week': {
      const start = new Date(end);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      return { start, end };
    }
    default:
      return getDateRange('month');
  }
};

export const getYearAgoDateRange = (dateRange: DateRange): DateRange => {
  const start = new Date(dateRange.start);
  const end = new Date(dateRange.end);
  start.setFullYear(start.getFullYear() - 1);
  end.setFullYear(end.getFullYear() - 1);
  return { start, end };
};

export const filterOrdersByDate = (orders: Order[], dateRange: DateRange): Order[] => {
  return orders.filter((order) => {
    const date = new Date(order.createdAt);
    return date >= dateRange.start && date <= dateRange.end;
  });
};

export const calculateKPIs = (orders: Order[]): KPIs => {
  if (orders.length === 0) {
    return {
      totalSales: 0,
      totalOrders: 0,
      averageTicket: 0,
      totalCost: 0,
      totalProfit: 0,
      profitMargin: 0,
      hasIncompleteCost: false
    };
  }

  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = orders.length;
  const averageTicket = totalSales / totalOrders;

  // El costo solo se suma para ítems con unitCost registrado (snapshot tomado
  // al crear el pedido). Los ítems sin costo no restan ganancia, así que
  // hasIncompleteCost avisa a la UI que la ganancia mostrada puede ser mayor
  // a la real.
  let totalCost = 0;
  let hasIncompleteCost = false;
  orders.forEach((order) => {
    order.items.forEach((item) => {
      if (item.unitCost !== undefined) {
        totalCost += item.unitCost * item.quantity;
      } else {
        hasIncompleteCost = true;
      }
    });
  });
  const totalProfit = totalSales - totalCost;
  const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;

  return {
    totalSales,
    totalOrders,
    averageTicket,
    totalCost,
    totalProfit,
    profitMargin,
    hasIncompleteCost
  };
};

export const calculateStatusBreakdown = (orders: Order[]): StatusBreakdownItem[] => {
  const statusMap: Record<OrderStatus, { count: number; total: number }> = {
    pending: { count: 0, total: 0 },
    preparing: { count: 0, total: 0 },
    delivered: { count: 0, total: 0 }
  };

  orders.forEach((order) => {
    statusMap[order.status].count += 1;
    statusMap[order.status].total += order.total;
  });

  const total = orders.length;

  return (Object.keys(statusMap) as OrderStatus[]).map((status) => ({
    status,
    count: statusMap[status].count,
    percentage: total > 0 ? (statusMap[status].count / total) * 100 : 0,
    total: statusMap[status].total
  }));
};

export const calculateTopClients = (orders: Order[], limit: number = 3): TopClient[] => {
  const clientMap = new Map<string, { name: string; phone: string; orders: number; total: number }>();

  orders.forEach((order) => {
    const key = order.clientPhone || order.clientName.toLowerCase().trim();
    const existing = clientMap.get(key);

    if (existing) {
      existing.orders += 1;
      existing.total += order.total;
    } else {
      clientMap.set(key, {
        name: order.clientName,
        phone: order.clientPhone,
        orders: 1,
        total: order.total
      });
    }
  });

  return Array.from(clientMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
};

export const calculateChartData = (
  orders: Order[],
  period: PeriodType,
  dateRange: DateRange,
  locale = 'es'
): ChartDataPoint[] => {
  if (period === 'today') {
    return groupByHour(orders);
  }
  return groupByDay(orders, dateRange, locale);
};

const groupByHour = (orders: Order[]): ChartDataPoint[] => {
  const hours: ChartDataPoint[] = [];

  for (let i = 0; i < 24; i++) {
    hours.push({
      label: `${i.toString().padStart(2, '0')}:00`,
      value: 0,
      orders: 0
    });
  }

  orders.forEach((order) => {
    const hour = new Date(order.createdAt).getHours();
    hours[hour].value += order.total;
    hours[hour].orders += 1;
  });

  // Filter to only show hours with activity or between first and last active hour
  const activeHours = hours.filter((h) => h.orders > 0);
  if (activeHours.length === 0) return hours.slice(8, 21); // Default business hours

  const firstActive = hours.findIndex((h) => h.orders > 0);
  const lastActive = hours.length - 1 - [...hours].reverse().findIndex((h) => h.orders > 0);

  // Expand range by 1 hour on each side
  const start = Math.max(0, firstActive - 1);
  const end = Math.min(23, lastActive + 1);

  return hours.slice(start, end + 1);
};

const toLocalMidnight = (d: Date): Date =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

const formatDayLabel = (date: Date, locale: string): string => {
  const name = new Intl.DateTimeFormat(locale, { weekday: 'short' })
    .format(date)
    .replace(/\.$/, '')
    .replace(/^\w/, c => c.toUpperCase());
  return `${name} ${date.getDate()}`;
};

const groupByDay = (orders: Order[], dateRange: DateRange, locale: string): ChartDataPoint[] => {
  const days: ChartDataPoint[] = [];
  const current = new Date(dateRange.start);

  while (current <= dateRange.end) {
    days.push({
      label: formatDayLabel(new Date(current), locale),
      value: 0,
      orders: 0,
    });
    current.setDate(current.getDate() + 1);
  }

  const startMidnight = toLocalMidnight(dateRange.start).getTime();

  orders.forEach((order) => {
    const dayIndex = Math.round(
      (toLocalMidnight(new Date(order.createdAt)).getTime() - startMidnight) /
      (1000 * 60 * 60 * 24)
    );
    if (dayIndex >= 0 && dayIndex < days.length) {
      days[dayIndex].value += order.total;
      days[dayIndex].orders += 1;
    }
  });

  return days;
};

export const calculateTopProducts = (orders: Order[], limit = 3): TopProduct[] => {
  const map = new Map<string, TopProduct & { hasCost: boolean }>();

  orders.forEach((order) => {
    order.items.forEach((item) => {
      const key = item.productId ?? item.name.toLowerCase().trim();
      const itemProfit = item.unitCost !== undefined
        ? (item.unitPrice - item.unitCost) * item.quantity
        : 0;
      const existing = map.get(key);
      if (existing) {
        existing.units += item.quantity;
        existing.total += item.subtotal;
        existing.profit = (existing.profit ?? 0) + itemProfit;
        existing.hasCost = existing.hasCost || item.unitCost !== undefined;
      } else {
        map.set(key, {
          name: item.name,
          sku: item.sku,
          units: item.quantity,
          total: item.subtotal,
          profit: itemProfit,
          hasCost: item.unitCost !== undefined
        });
      }
    });
  });

  return Array.from(map.values())
    .sort((a, b) => b.units - a.units)
    .slice(0, limit)
    .map(({ hasCost, ...product }) => ({
      ...product,
      profit: hasCost ? product.profit : undefined
    }));
};

export const calculateInventoryStats = (products: Product[]): InventoryStats => {
  const tracked = products.filter((p) => p.trackStock);
  const outOfStock = tracked
    .filter((p) => (p.stock ?? 0) === 0)
    .map((p) => ({ id: p.id, name: p.name, sku: p.sku, stock: 0 }));
  const lowStock = tracked
    .filter((p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 5)
    .map((p) => ({ id: p.id, name: p.name, sku: p.sku, stock: p.stock ?? 0 }));

  return { totalTracked: tracked.length, outOfStock, lowStock };
};
