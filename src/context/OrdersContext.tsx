import { createContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import type { QueryDocumentSnapshot } from 'firebase/firestore';
import type { Order, OrderFormData, OrderStatus } from '../types/Order';
import { getPlanLimits, checkPlanLimit } from '../constants/planLimits';
import i18n from '../i18n';
import {
  getOrders,
  getOrdersByStatus,
  getArchivedOrders,
  createOrder,
  countOrdersThisMonth,
  subscribeToOrders,
} from '../services/orderService';
import { useAuth } from '../hooks/useAuth';

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
  const statusFilterRef = useRef<OrderStatus | null>(null);

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
    statusFilterRef.current = null;
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
      } else if (statusFilterRef.current) {
        const result = await getOrdersByStatus(businessUid, statusFilterRef.current, lastDocRef.current);
        const active = result.orders.filter((o) => !o.archived);
        setOrders((prev) => [...prev, ...active]);
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
      setError(err instanceof Error ? err.message : i18n.t('errors.loadMoreOrdersError'));
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
      statusFilterRef.current = null;
      const result = await getArchivedOrders(businessUid);
      setOrders(result.orders);
      setShowArchived(true);
      setHasMore(result.hasMore);
      lastDocRef.current = result.lastDoc;
    } catch (err) {
      setError(err instanceof Error ? err.message : i18n.t('errors.loadArchivedOrdersError'));
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
      statusFilterRef.current = status;
      const result = await getOrdersByStatus(businessUid, status);
      setOrders(result.orders.filter((o) => !o.archived));
      setShowArchived(false);
      setHasMore(result.hasMore);
      lastDocRef.current = result.lastDoc;
    } catch (err) {
      setError(err instanceof Error ? err.message : i18n.t('errors.loadOrdersError'));
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
      checkPlanLimit(ordersThisMonth, limits.ordersPerMonth, i18n.t('common.resources.ordersThisMonth'));
      const newOrder = await createOrder(data, businessUid);
      return newOrder;
    } catch (err) {
      setError(err instanceof Error ? err.message : i18n.t('orders.createError'));
      throw err;
    }
  }, [user, businessUid]);

  return (
    <OrdersContext.Provider value={{
      orders, allOrders, loading, error, hasMore, showArchived,
      fetchOrders, fetchArchived, fetchByStatus, loadMore,
      addOrder,
    }}>
      {children}
    </OrdersContext.Provider>
  );
};
