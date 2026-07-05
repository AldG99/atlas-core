import type { OrderStatus } from '../types/Order';

export const ORDER_STATUS: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  preparing: 'En preparación',
  delivered: 'Entregado',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: '#E86E25', // naranja
  preparing: '#2368C4', // azul — $color-primary
  delivered: '#09A870', // verde — $color-success
};
