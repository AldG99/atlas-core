import { createContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import type { QueryDocumentSnapshot } from 'firebase/firestore';
import type { Order, OrderFormData, OrderStatus, CreatedBy } from '../types/Order';
import type { User } from '../types/User';
import { getPlanLimits, checkPlanLimit } from '../constants/planLimits';
import {
  getOrders,
  getOrdersByStatus,
  getArchivedOrders,
  createOrder,
  updateOrderStatus,
  deleteOrder,
  archiveOrder,
  unarchiveOrder,
  addPayment as addPaymentService,
  countOrdersThisMonth,
  subscribeToOrders,
} from '../services/orderService';
import { useAuth } from '../hooks/useAuth';

export const buildCreatedBy = (user: User): CreatedBy => {
  const base = user.firstName
    ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
    : user.businessName;
  const suffix = user.role === 'member'
    ? (user.memberNumber ? ` #${user.memberNumber}` : '')
    : ' (Adm.)';
  return { uid: user.uid, name: `${base}${suffix}` };
};

interface OrdersContextType {
  orders: Order[];
  allOrders: Order[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  showArchived: boolean;
  fetchOrders: () => Promise<void>;
  fetchArchived: () => Promise<void>;
  fetchByStatus: (status: OrderStatus) => Promise<void>;
  loadMore: () => Promise<void>;
  addOrder: (data: OrderFormData) => Promise<Order | undefined>;
  changeStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  removeOrder: (orderId: string) => Promise<void>;
  archive: (orderId: string) => Promise<void>;
  restore: (orderId: string) => Promise<void>;
  addPayment: (orderId: string, amount: number, itemIndex?: number) => Promise<void>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const OrdersContext = createContext<OrdersContextType | null>(null);

export const OrdersProvider = ({ children }: { children: ReactNode }) => {
  const { user, businessUid } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const lastDocRef = useRef<QueryDocumentSnapshot | null>(null);
  const allOrdersRef = useRef<Order[]>([]);
  const isLiveViewRef = useRef(true);
  const hasMoreFromSnapshotRef = useRef(false);

  useEffect(() => {
    if (!user || !businessUid) {
      setOrders([]);
      setAllOrders([]);
      allOrdersRef.current = [];
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToOrders(
      businessUid,
      ({ orders: data, hasMore: more, lastDoc: doc }) => {
        const active = data.filter((o) => !o.archived);
        setAllOrders(active);
        allOrdersRef.current = active;
        lastDocRef.current = doc;
        hasMoreFromSnapshotRef.current = more;
        if (isLiveViewRef.current) {
          setOrders(active);
          setHasMore(more);
          setShowArchived(false);
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user, businessUid]);

  const fetchOrders = useCallback(async () => {
    if (!user || !businessUid) return;
    isLiveViewRef.current = true;
    const active = allOrdersRef.current;
    setOrders(active);
    setAllOrders(active);
    setHasMore(hasMoreFromSnapshotRef.current);
    setShowArchived(false);
    setError(null);
  }, [user, businessUid]);

  const loadMore = useCallback(async () => {
    if (!user || !businessUid || !hasMore || !lastDocRef.current) return;
    try {
      setLoading(true);
      setError(null);
      if (showArchived) {
        const result = await getArchivedOrders(businessUid, lastDocRef.current);
        setOrders((prev) => [...prev, ...result.orders]);
        lastDocRef.current = result.lastDoc;
        setHasMore(result.hasMore);
      } else {
        const result = await getOrders(businessUid, lastDocRef.current);
        const active = result.orders.filter((o) => !o.archived);
        setOrders((prev) => [...prev, ...active]);
        setAllOrders((prev) => {
          const updated = [...prev, ...active];
          allOrdersRef.current = updated;
          return updated;
        });
        lastDocRef.current = result.lastDoc;
        setHasMore(result.hasMore);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar más pedidos');
    } finally {
      setLoading(false);
    }
  }, [user, businessUid, hasMore, showArchived]);

  const fetchArchived = useCallback(async () => {
    if (!user || !businessUid) return;
    try {
      setLoading(true);
      setError(null);
      isLiveViewRef.current = false;
      const result = await getArchivedOrders(businessUid);
      setOrders(result.orders);
      setShowArchived(true);
      setHasMore(result.hasMore);
      lastDocRef.current = result.lastDoc;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar pedidos archivados');
    } finally {
      setLoading(false);
    }
  }, [user, businessUid]);

  const fetchByStatus = useCallback(async (status: OrderStatus) => {
    if (!user || !businessUid) return;
    try {
      setLoading(true);
      setError(null);
      isLiveViewRef.current = false;
      const data = await getOrdersByStatus(businessUid, status);
      setOrders(data.filter((o) => !o.archived));
      setHasMore(false);
      lastDocRef.current = null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  }, [user, businessUid]);

  const addOrder = useCallback(async (data: OrderFormData) => {
    if (!user || !businessUid) return;
    try {
      setError(null);
      const limits = getPlanLimits(user.plan);
      const ordersThisMonth = await countOrdersThisMonth(businessUid);
      checkPlanLimit(ordersThisMonth, limits.ordersPerMonth, 'pedidos este mes');
      const newOrder = await createOrder(data, businessUid, buildCreatedBy(user));
      setOrders((prev) => [newOrder, ...prev]);
      setAllOrders((prev) => [newOrder, ...prev]);
      return newOrder;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear pedido');
      throw err;
    }
  }, [user, businessUid]);

  const changeStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    try {
      setError(null);
      await updateOrderStatus(orderId, status);
      const updateFn = (prev: Order[]) =>
        prev.map((o) => {
          if (o.id !== orderId) return o;
          const updated = { ...o, status };
          if (status === 'delivered') updated.deliveredAt = new Date();
          return updated;
        });
      setOrders(updateFn);
      setAllOrders(updateFn);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar estado');
      throw err;
    }
  }, []);

  const removeOrder = useCallback(async (orderId: string) => {
    try {
      setError(null);
      await deleteOrder(orderId);
      const filterFn = (prev: Order[]) => prev.filter((o) => o.id !== orderId);
      setOrders(filterFn);
      setAllOrders(filterFn);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar pedido');
      throw err;
    }
  }, []);

  const archive = useCallback(async (orderId: string) => {
    try {
      setError(null);
      await archiveOrder(orderId);
      const filterFn = (prev: Order[]) => prev.filter((o) => o.id !== orderId);
      setOrders(filterFn);
      setAllOrders(filterFn);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al archivar pedido');
      throw err;
    }
  }, []);

  const restore = useCallback(async (orderId: string) => {
    try {
      setError(null);
      await unarchiveOrder(orderId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al restaurar pedido');
      throw err;
    }
  }, []);

  const addPayment = useCallback(async (orderId: string, amount: number, itemIndex?: number) => {
    try {
      setError(null);
      const { payment: newPayment, newStatus } = await addPaymentService(
        orderId,
        amount,
        itemIndex,
        user ? buildCreatedBy(user) : undefined
      );
      const updateFn = (prev: Order[]) =>
        prev.map((o) => {
          if (o.id !== orderId) return o;
          return { ...o, payments: [...(o.payments || []), newPayment], status: newStatus ?? o.status };
        });
      setOrders(updateFn);
      setAllOrders(updateFn);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar abono');
      throw err;
    }
  }, [user]);

  return (
    <OrdersContext.Provider value={{
      orders, allOrders, loading, error, hasMore, showArchived,
      fetchOrders, fetchArchived, fetchByStatus, loadMore,
      addOrder, changeStatus, removeOrder, archive, restore, addPayment,
    }}>
      {children}
    </OrdersContext.Provider>
  );
};
