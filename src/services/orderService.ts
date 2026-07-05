import {
  collection,
  doc,
  updateDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  Timestamp,
  arrayUnion,
  runTransaction,
  increment,
  writeBatch,
  getCountFromServer,
  QueryDocumentSnapshot,
  type DocumentData
} from 'firebase/firestore';
import { db } from './firebase';
import type { Order, OrderFormData, OrderStatus, OrderItem, Payment, CreatedBy } from '../types/Order';

// Firestore rechaza valores undefined — los elimina recursivamente
const stripUndefined = <T extends Record<string, unknown>>(obj: T): T => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      result[key] = value.map(item =>
        item !== null && typeof item === 'object' ? stripUndefined(item as Record<string, unknown>) : item
      );
    } else {
      result[key] = value;
    }
  }
  return result as T;
};

const COLLECTION_NAME = 'orders';
const PAGE_LIMIT = 100;

const generateOrderNumber = async (userId: string): Promise<string> => {
  const now = new Date();
  const dateStr =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');

  const counterRef = doc(db, 'orderCounters', `${userId}_${dateStr}`);

  const count = await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    const newCount = counterDoc.exists() ? (counterDoc.data().count as number) + 1 : 1;
    if (newCount > 9999) throw new Error('Límite de pedidos del día alcanzado (máx. 9,999)');
    transaction.set(counterRef, { count: newCount, userId });
    return newCount;
  });

  return `ORD-${dateStr}-${String(count).padStart(4, '0')}`;
};

const parseTimestamp = (val: unknown): Date =>
  val && typeof (val as Timestamp).toDate === 'function'
    ? (val as Timestamp).toDate()
    : new Date(val as string);

const parsePayments = (raw: unknown[]): Payment[] => {
  if (!Array.isArray(raw)) return [];
  return raw.map((value: unknown, idx: number) => {
    const p = value as Record<string, unknown>;
    const payment: Payment = {
      id: (p.id as string) ?? `legacy-${idx}-${Date.now()}`,
      amount: p.amount as number,
      date: parseTimestamp(p.date),
    };
    if (typeof p.itemIndex === 'number') payment.itemIndex = p.itemIndex;
    if (typeof p.originalAmount === 'number') payment.originalAmount = p.originalAmount;
    if (p.editedAt) payment.editedAt = parseTimestamp(p.editedAt);
    if (p.createdBy) payment.createdBy = p.createdBy as CreatedBy;
    return payment;
  });
};


export const createOrder = async (data: OrderFormData, userId: string, createdBy?: CreatedBy): Promise<Order> => {
  const orderNumber = await generateOrderNumber(userId);

  const newOrder = {
    ...data,
    orderNumber,
    status: 'pending' as OrderStatus,
    archived: false,
    createdAt: Timestamp.now(),
    userId,
    ...(createdBy ? { createdBy } : {})
  };

  const newDocRef = doc(collection(db, COLLECTION_NAME));
  const batch = writeBatch(db);
  batch.set(newDocRef, stripUndefined(newOrder));

  data.items
    .filter(i => i.trackStock && i.productId)
    .forEach(i => batch.update(doc(db, 'products', i.productId!), { stock: increment(-i.quantity) }));

  await batch.commit();

  return {
    id: newDocRef.id,
    orderNumber,
    ...data,
    status: 'pending',
    archived: false,
    createdAt: new Date(),
    userId,
    ...(createdBy ? { createdBy } : {})
  };
};

export const getOrders = async (
  userId: string,
  lastDoc?: QueryDocumentSnapshot
): Promise<{ orders: Order[]; lastDoc: QueryDocumentSnapshot | null; hasMore: boolean }> => {
  const q = lastDoc
    ? query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(PAGE_LIMIT + 1),
        startAfter(lastDoc)
      )
    : query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(PAGE_LIMIT + 1)
      );

  const querySnapshot = await getDocs(q);
  const hasMore = querySnapshot.docs.length > PAGE_LIMIT;
  const docs = hasMore ? querySnapshot.docs.slice(0, PAGE_LIMIT) : querySnapshot.docs;

  return {
    orders: docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        items: (data.items as OrderItem[]),
        payments: parsePayments(data.payments),
        createdAt: data.createdAt.toDate(),
        deliveredAt: data.deliveredAt?.toDate() || undefined
      } as Order;
    }),
    lastDoc: docs[docs.length - 1] ?? null,
    hasMore
  };
};

export const getOrdersByStatus = async (userId: string, status: OrderStatus): Promise<Order[]> => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId),
    where('status', '==', status),
    orderBy('createdAt', 'desc'),
    limit(PAGE_LIMIT)
  );

  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      items: (data.items as OrderItem[]),
      payments: parsePayments(data.payments),
      createdAt: data.createdAt.toDate(),
      deliveredAt: data.deliveredAt?.toDate() || undefined
    } as Order;
  });
};

export const updateOrderNotes = async (orderId: string, notes: string): Promise<void> => {
  const orderRef = doc(db, COLLECTION_NAME, orderId);
  await updateDoc(orderRef, { notes });
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus, deliveredBy?: { uid: string; name: string }): Promise<void> => {
  const orderRef = doc(db, COLLECTION_NAME, orderId);
  const updateData: Record<string, unknown> = { status };
  if (status === 'delivered') {
    updateData.deliveredAt = Timestamp.now();
    if (deliveredBy) updateData.deliveredBy = deliveredBy;
  }
  await updateDoc(orderRef, updateData);
};


export const deleteOrder = async (orderId: string): Promise<void> => {
  const orderRef = doc(db, COLLECTION_NAME, orderId);
  const orderSnap = await getDoc(orderRef);

  const batch = writeBatch(db);
  batch.delete(orderRef);

  if (orderSnap.exists()) {
    const items = orderSnap.data().items as OrderItem[];
    items
      .filter(i => i.trackStock && i.productId)
      .forEach(i => batch.update(doc(db, 'products', i.productId!), { stock: increment(i.quantity) }));
  }

  await batch.commit();
};

export const getOrderById = async (orderId: string, userId: string): Promise<Order | null> => {
  const orderRef = doc(db, COLLECTION_NAME, orderId);
  const orderDoc = await getDoc(orderRef);

  if (!orderDoc.exists()) {
    return null;
  }

  const data = orderDoc.data();

  if (data.userId !== userId) {
    return null;
  }

  return {
    id: orderDoc.id,
    ...data,
    items: (data.items as OrderItem[]),
    payments: parsePayments(data.payments),
    archived: data.archived || false,
    createdAt: data.createdAt.toDate(),
    deliveredAt: data.deliveredAt?.toDate() || undefined
  } as Order;
};

export const archiveOrder = async (orderId: string): Promise<void> => {
  const orderRef = doc(db, COLLECTION_NAME, orderId);
  await updateDoc(orderRef, { archived: true });
};

export const unarchiveOrder = async (orderId: string): Promise<void> => {
  const orderRef = doc(db, COLLECTION_NAME, orderId);
  await updateDoc(orderRef, { archived: false });
};

export const getArchivedOrders = async (
  userId: string,
  lastDoc?: QueryDocumentSnapshot
): Promise<{ orders: Order[]; hasMore: boolean; lastDoc: QueryDocumentSnapshot | null }> => {
  const q = lastDoc
    ? query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        where('archived', '==', true),
        orderBy('createdAt', 'desc'),
        limit(PAGE_LIMIT + 1),
        startAfter(lastDoc)
      )
    : query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        where('archived', '==', true),
        orderBy('createdAt', 'desc'),
        limit(PAGE_LIMIT + 1)
      );

  const querySnapshot = await getDocs(q);
  const hasMore = querySnapshot.docs.length > PAGE_LIMIT;
  const docs = hasMore ? querySnapshot.docs.slice(0, PAGE_LIMIT) : querySnapshot.docs;

  return {
    orders: docs.map(d => parseOrderDoc(d.id, d.data())),
    hasMore,
    lastDoc: docs[docs.length - 1] ?? null,
  };
};

export const archiveAllDelivered = async (userId: string): Promise<number> => {
  const fortyEightHoursAgo = new Date();
  fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId),
    where('status', '==', 'delivered'),
    where('archived', '==', false)
  );

  const querySnapshot = await getDocs(q);

  const toArchive = querySnapshot.docs.filter((d) => {
    const data = d.data();
    const date = data.deliveredAt?.toDate() ?? data.createdAt.toDate();
    return date <= fortyEightHoursAgo;
  });

  if (toArchive.length === 0) return 0;

  const ARCHIVE_BATCH_SIZE = 499;
  for (let i = 0; i < toArchive.length; i += ARCHIVE_BATCH_SIZE) {
    const batch = writeBatch(db);
    toArchive.slice(i, i + ARCHIVE_BATCH_SIZE).forEach((d) =>
      batch.update(doc(db, COLLECTION_NAME, d.id), { archived: true })
    );
    await batch.commit();
  }

  return toArchive.length;
};

export const countOrdersThisMonth = async (userId: string): Promise<number> => {
  const now = new Date();
  const startOfMonth = Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth(), 1));
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId),
    where('createdAt', '>=', startOfMonth)
  );
  const snap = await getCountFromServer(q);
  return snap.data().count;
};

export const getOrdersByClientPhone = async (userId: string, phone: string): Promise<Order[]> => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId),
    where('clientPhone', '==', phone)
  );

  const querySnapshot = await getDocs(q);

  const orders = querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      items: (data.items as OrderItem[]),
      payments: parsePayments(data.payments),
      archived: data.archived || false,
      createdAt: data.createdAt.toDate(),
      deliveredAt: data.deliveredAt?.toDate() || undefined
    } as Order;
  });

  // Ordenar en cliente para evitar necesidad de índice compuesto
  return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const addPayment = async (
  orderId: string,
  amount: number,
  itemIndex?: number,
  createdBy?: CreatedBy
): Promise<{ payment: Payment; newStatus: OrderStatus | null }> => {
  const orderRef = doc(db, COLLECTION_NAME, orderId);
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const date = Timestamp.now();
  const paymentData: Record<string, unknown> = { id, amount, date };
  if (typeof itemIndex === 'number') paymentData.itemIndex = itemIndex;
  if (createdBy) paymentData.createdBy = createdBy;

  let newStatus: OrderStatus | null = null;

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(orderRef);
    if (!snap.exists()) throw new Error('Pedido no encontrado');

    const data = snap.data();
    const currentStatus = data.status as OrderStatus;
    const total = data.total as number;
    const paidSoFar = parsePayments(data.payments ?? []).reduce((s, p) => s + p.amount, 0);

    const updateData: Record<string, unknown> = { payments: arrayUnion(paymentData) };
    if (currentStatus === 'pending' && (paidSoFar + amount) >= total) {
      newStatus = 'preparing';
      updateData.status = 'preparing';
    }
    transaction.update(orderRef, updateData);
  });

  const payment: Payment = { id, amount, date: new Date() };
  if (typeof itemIndex === 'number') payment.itemIndex = itemIndex;
  if (createdBy) payment.createdBy = createdBy;

  return { payment, newStatus };
};

const RANGE_LIMIT = 2000;

export const getOrdersByDateRange = async (
  userId: string,
  start: Date,
  end: Date,
): Promise<{ orders: Order[]; hasMore: boolean }> => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId),
    where('createdAt', '>=', Timestamp.fromDate(start)),
    where('createdAt', '<=', Timestamp.fromDate(end)),
    orderBy('createdAt', 'asc'),
    limit(RANGE_LIMIT + 1)
  );
  const snap = await getDocs(q);
  const hasMore = snap.docs.length > RANGE_LIMIT;
  const docs = hasMore ? snap.docs.slice(0, RANGE_LIMIT) : snap.docs;
  return { orders: docs.map(d => parseOrderDoc(d.id, d.data())), hasMore };
};

export const parseOrderDoc = (docId: string, data: DocumentData): Order => ({
  id: docId,
  ...data,
  items: (data.items as OrderItem[]),
  payments: parsePayments(data.payments ?? []),
  archived: data.archived || false,
  createdAt: data.createdAt.toDate(),
  deliveredAt: data.deliveredAt?.toDate() || undefined
} as Order);

export const subscribeToOrders = (
  businessUid: string,
  onUpdate: (result: { orders: Order[]; hasMore: boolean; lastDoc: QueryDocumentSnapshot | null }) => void,
  onError: (error: Error) => void
): (() => void) => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', businessUid),
    orderBy('createdAt', 'desc'),
    limit(PAGE_LIMIT + 1)
  );

  return onSnapshot(q, (snapshot) => {
    const hasMore = snapshot.docs.length > PAGE_LIMIT;
    const docs = hasMore ? snapshot.docs.slice(0, PAGE_LIMIT) : snapshot.docs;
    const orders = docs.map(d => parseOrderDoc(d.id, d.data()));
    onUpdate({ orders, hasMore, lastDoc: docs[docs.length - 1] ?? null });
  }, onError);
};

export const updatePayment = async (
  orderId: string,
  paymentId: string,
  newAmount: number,
): Promise<Payment[]> => {
  const orderRef = doc(db, COLLECTION_NAME, orderId);
  let updatedRaw: Record<string, unknown>[] = [];

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(orderRef);
    if (!snap.exists()) throw new Error('Pedido no encontrado');

    const raw = (snap.data().payments ?? []) as Record<string, unknown>[];
    updatedRaw = raw.map(p => {
      if (p.id !== paymentId) return p;
      return {
        ...p,
        originalAmount: p.originalAmount ?? p.amount,
        amount: newAmount,
        editedAt: Timestamp.now(),
      };
    });
    transaction.update(orderRef, { payments: updatedRaw });
  });

  return parsePayments(updatedRaw);
};
