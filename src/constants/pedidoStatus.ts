import type { PedidoStatus } from '../types/Pedido';

export const PEDIDO_STATUS: Record<PedidoStatus, string> = {
  pendiente: 'Pendiente',
  en_preparacion: 'En preparación',
  entregado: 'Entregado',
};

export const PEDIDO_STATUS_COLORS: Record<PedidoStatus, string> = {
  pendiente: '#f4ac11', // ámbar — $color-warning
  en_preparacion: '#2368C4', // azul — $color-primary
  entregado: '#09A870', // verde — $color-success
};
