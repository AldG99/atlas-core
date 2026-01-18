import type { PedidoStatus } from '../types/Pedido';

export const PEDIDO_STATUS: Record<PedidoStatus, string> = {
  pendiente: 'Pendiente',
  en_preparacion: 'En preparación',
  entregado: 'Entregado'
};

export const PEDIDO_STATUS_COLORS: Record<PedidoStatus, string> = {
  pendiente: '#f59e0b',
  en_preparacion: '#3b82f6',
  entregado: '#10b981'
};
