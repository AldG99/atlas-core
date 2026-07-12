import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useOrders } from './useOrders';
import { useProducts } from './useProducts';

export interface Notification {
  id: string;
  type: 'warning' | 'info';
  title: string;
  description: string;
  link: string;
  filterState: Record<string, unknown>;
}

const DAYS_PENDING = 2;
const DAYS_PREPARING = 3;
const DAYS_PAYMENT = 3;
const DAYS_DISCOUNT = 7;
const LOW_STOCK_THRESHOLD = 5;

const daysSince = (date: Date): number =>
  Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));

export const useNotifications = () => {
  const { t } = useTranslation();
  const { orders } = useOrders();
  const { products } = useProducts();

  const notifications: Notification[] = useMemo(() => {
    const result: Notification[] = [];
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();

    // 1. Pedidos en "Pendiente" hace más de 2 días
    const stuckPending = orders.filter(
      o => !o.archived && o.status === 'pending' && daysSince(o.createdAt) >= DAYS_PENDING
    );
    if (stuckPending.length > 0) {
      result.push({
        id: 'pendiente_atascado',
        type: 'warning',
        title: t('notifications.stuckPending.title', { count: stuckPending.length }),
        description: t('notifications.stuckPending.description', { days: DAYS_PENDING }),
        link: '/dashboard',
        filterState: { filterStatus: 'pending' },
      });
    }

    // 2. Pedidos en "En preparación" hace más de 3 días
    const stuckPreparing = orders.filter(
      o => !o.archived && o.status === 'preparing' && daysSince(o.createdAt) >= DAYS_PREPARING
    );
    if (stuckPreparing.length > 0) {
      result.push({
        id: 'preparacion_atascada',
        type: 'warning',
        title: t('notifications.stuckPreparing.title', { count: stuckPreparing.length }),
        description: t('notifications.stuckPreparing.description', { days: DAYS_PREPARING }),
        link: '/dashboard',
        filterState: { filterStatus: 'preparing' },
      });
    }

    // 3. Descuentos próximos a vencer (próximos 7 días)
    const expiringDiscounts = products.filter(p => {
      if (!p.discount || !p.discountEndDate) return false;
      const msLeft = new Date(p.discountEndDate).getTime() - now;
      const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
      return daysLeft >= 0 && daysLeft <= DAYS_DISCOUNT;
    });
    if (expiringDiscounts.length > 0) {
      result.push({
        id: 'descuento_venciendo',
        type: 'info',
        title: t('notifications.expiringDiscounts.title', { count: expiringDiscounts.length }),
        description: t('notifications.expiringDiscounts.description', { days: DAYS_DISCOUNT }),
        link: '/products',
        filterState: { filterDescuento: true },
      });
    }

    // 4. Pedidos con abono parcial sin movimiento en 3+ días
    const pendingPayments = orders.filter(o => {
      if (o.archived || o.status === 'delivered') return false;
      const payments = o.payments || [];
      if (payments.length === 0) return false;
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      if (totalPaid <= 0 || totalPaid >= o.total) return false;
      const lastPayment = payments.reduce((max, p) =>
        new Date(p.date) > new Date(max.date) ? p : max
      );
      return daysSince(lastPayment.date) >= DAYS_PAYMENT;
    });
    if (pendingPayments.length > 0) {
      result.push({
        id: 'abono_pendiente',
        type: 'warning',
        title: t('notifications.pendingPayments.title', { count: pendingPayments.length }),
        description: t('notifications.pendingPayments.description', { days: DAYS_PAYMENT }),
        link: '/dashboard',
        filterState: { filterStatus: 'abono_pendiente' },
      });
    }

    // 5. Productos sin stock
    const outOfStock = products.filter(p => p.trackStock && (p.stock ?? 0) <= 0);
    if (outOfStock.length > 0) {
      result.push({
        id: 'sin_stock',
        type: 'warning',
        title: t('notifications.outOfStock.title', { count: outOfStock.length }),
        description: t('notifications.outOfStock.description', {
          count: outOfStock.length,
          name: outOfStock[0].name,
          remaining: outOfStock.length - 1,
        }),
        link: '/products',
        filterState: {},
      });
    }

    // 6. Productos con stock bajo (> 0 pero <= umbral)
    const lowStock = products.filter(p =>
      p.trackStock && (p.stock ?? 0) > 0 && (p.stock ?? 0) <= LOW_STOCK_THRESHOLD
    );
    if (lowStock.length > 0) {
      result.push({
        id: 'stock_bajo',
        type: 'info',
        title: t('notifications.lowStock.title', { count: lowStock.length }),
        description: t('notifications.lowStock.description', { threshold: LOW_STOCK_THRESHOLD }),
        link: '/products',
        filterState: {},
      });
    }

    return result;
  }, [orders, products, t]);

  return { notifications };
};
