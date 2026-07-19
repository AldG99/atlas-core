import type { OrderStatus } from './Order';

export type PeriodType = 'today' | 'week' | 'month';

export interface KPIs {
  totalSales: number;
  totalOrders: number;
  averageTicket: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  hasIncompleteCost: boolean;
}

export interface StatusBreakdownItem {
  status: OrderStatus;
  count: number;
  percentage: number;
  total: number;
}

export interface TopClient {
  name: string;
  phone: string;
  orders: number;
  total: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  orders: number;
}

export interface TopProduct {
  name: string;
  sku?: string;
  units: number;
  total: number;
  profit?: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku?: string;
  stock: number;
}

export interface InventoryStats {
  totalTracked: number;
  outOfStock: InventoryItem[];
  lowStock: InventoryItem[];
}

export interface ReportData {
  kpis: KPIs;
  comparisonKPIs: KPIs;
  statusBreakdown: StatusBreakdownItem[];
  topClients: TopClient[];
  topProducts: TopProduct[];
  chartData: ChartDataPoint[];
  inventory: InventoryStats;
}
