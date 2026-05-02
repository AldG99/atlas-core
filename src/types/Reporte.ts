import type { PedidoStatus } from './Pedido';

export type PeriodType = 'hoy' | 'semana' | 'mes';

export interface KPIs {
  ventasTotales: number;
  totalPedidos: number;
  ticketPromedio: number;
  clientesUnicos: number;
}

export interface StatusBreakdownItem {
  estado: PedidoStatus;
  cantidad: number;
  porcentaje: number;
  total: number;
}

export interface TopCliente {
  nombre: string;
  telefono: string;
  pedidos: number;
  total: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  pedidos: number;
}

export interface TopProducto {
  nombre: string;
  clave?: string;
  unidades: number;
  total: number;
}

export interface InventarioItem {
  id: string;
  nombre: string;
  clave?: string;
  stock: number;
}

export interface InventarioStats {
  totalConControl: number;
  agotados: InventarioItem[];
  bajoStock: InventarioItem[];
}

export interface ReporteData {
  kpis: KPIs;
  comparisonKPIs: KPIs;
  statusBreakdown: StatusBreakdownItem[];
  topClientes: TopCliente[];
  topProductos: TopProducto[];
  chartData: ChartDataPoint[];
  inventario: InventarioStats;
}
