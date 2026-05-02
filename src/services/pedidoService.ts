import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
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
import type { Pedido, PedidoFormData, PedidoStatus, ProductoItem, Abono, CreadoPor } from '../types/Pedido';

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

const COLLECTION_NAME = 'pedidos';
const PAGE_LIMIT = 100;

const generateFolio = async (userId: string): Promise<string> => {
  const now = new Date();
  const dateStr =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');

  const counterRef = doc(db, 'pedidoCounters', `${userId}_${dateStr}`);

  const count = await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    const newCount = counterDoc.exists() ? (counterDoc.data().count as number) + 1 : 1;
    if (newCount > 9999) throw new Error('Límite de pedidos del día alcanzado (máx. 9,999)');
    transaction.set(counterRef, { count: newCount });
    return newCount;
  });

  return `ORD-${dateStr}-${String(count).padStart(4, '0')}`;
};

const parseTimestamp = (val: unknown): Date =>
  val && typeof (val as Timestamp).toDate === 'function'
    ? (val as Timestamp).toDate()
    : new Date(val as string);

const parseAbonos = (raw: unknown[]): Abono[] => {
  if (!Array.isArray(raw)) return [];
  return raw.map((value: unknown, idx: number) => {
    const a = value as Record<string, unknown>;
    const abono: Abono = {
      id: (a.id as string) ?? `legacy-${idx}-${Date.now()}`,
      monto: a.monto as number,
      fecha: parseTimestamp(a.fecha),
    };
    if (typeof a.productoIndex === 'number') abono.productoIndex = a.productoIndex;
    if (typeof a.montoOriginal === 'number') abono.montoOriginal = a.montoOriginal;
    if (a.editadoEn) abono.editadoEn = parseTimestamp(a.editadoEn);
    if (a.creadoPor) abono.creadoPor = a.creadoPor as CreadoPor;
    return abono;
  });
};


export const createPedido = async (data: PedidoFormData, userId: string, creadoPor?: CreadoPor): Promise<Pedido> => {
  const folio = await generateFolio(userId);

  const newPedido = {
    ...data,
    folio,
    estado: 'pendiente' as PedidoStatus,
    archivado: false,
    fechaCreacion: Timestamp.now(),
    userId,
    ...(creadoPor ? { creadoPor } : {})
  };

  const docRef = await addDoc(collection(db, COLLECTION_NAME), stripUndefined(newPedido));

  // Descontar stock de los productos que lo gestionan
  const stockUpdates = data.productos
    .filter(p => p.controlStock && p.productoId)
    .map(p => updateDoc(doc(db, 'productos', p.productoId!), { stock: increment(-p.cantidad) }));

  if (stockUpdates.length > 0) {
    await Promise.all(stockUpdates);
  }

  return {
    id: docRef.id,
    folio,
    ...data,
    estado: 'pendiente',
    archivado: false,
    fechaCreacion: new Date(),
    userId,
    ...(creadoPor ? { creadoPor } : {})
  };
};

export const getPedidos = async (
  userId: string,
  lastDoc?: QueryDocumentSnapshot
): Promise<{ pedidos: Pedido[]; lastDoc: QueryDocumentSnapshot | null; hasMore: boolean }> => {
  const q = lastDoc
    ? query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        orderBy('fechaCreacion', 'desc'),
        limit(PAGE_LIMIT + 1),
        startAfter(lastDoc)
      )
    : query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        orderBy('fechaCreacion', 'desc'),
        limit(PAGE_LIMIT + 1)
      );

  const querySnapshot = await getDocs(q);
  const hasMore = querySnapshot.docs.length > PAGE_LIMIT;
  const docs = hasMore ? querySnapshot.docs.slice(0, PAGE_LIMIT) : querySnapshot.docs;

  return {
    pedidos: docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        productos: (data.productos as ProductoItem[]),
        abonos: parseAbonos(data.abonos),
        fechaCreacion: data.fechaCreacion.toDate(),
        fechaEntrega: data.fechaEntrega?.toDate() || undefined
      } as Pedido;
    }),
    lastDoc: docs[docs.length - 1] ?? null,
    hasMore
  };
};

export const getPedidosByStatus = async (userId: string, estado: PedidoStatus): Promise<Pedido[]> => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId),
    where('estado', '==', estado),
    orderBy('fechaCreacion', 'desc'),
    limit(PAGE_LIMIT)
  );

  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      productos: (data.productos as ProductoItem[]),
      abonos: parseAbonos(data.abonos),
      fechaCreacion: data.fechaCreacion.toDate(),
      fechaEntrega: data.fechaEntrega?.toDate() || undefined
    } as Pedido;
  });
};

export const updatePedidoNotas = async (pedidoId: string, notas: string): Promise<void> => {
  const pedidoRef = doc(db, COLLECTION_NAME, pedidoId);
  await updateDoc(pedidoRef, { notas });
};

export const updatePedidoStatus = async (pedidoId: string, estado: PedidoStatus, entregadoPor?: { uid: string; nombre: string }): Promise<void> => {
  const pedidoRef = doc(db, COLLECTION_NAME, pedidoId);
  const updateData: Record<string, unknown> = { estado };
  if (estado === 'entregado') {
    updateData.fechaEntrega = Timestamp.now();
    if (entregadoPor) updateData.entregadoPor = entregadoPor;
  }
  await updateDoc(pedidoRef, updateData);
};


export const deletePedido = async (pedidoId: string): Promise<void> => {
  const pedidoRef = doc(db, COLLECTION_NAME, pedidoId);

  const pedidoSnap = await getDoc(pedidoRef);
  if (pedidoSnap.exists()) {
    const productos = pedidoSnap.data().productos as ProductoItem[];
    const stockRestores = productos
      .filter(p => p.controlStock && p.productoId)
      .map(p => updateDoc(doc(db, 'productos', p.productoId!), { stock: increment(p.cantidad) }));
    if (stockRestores.length > 0) await Promise.all(stockRestores);
  }

  await deleteDoc(pedidoRef);
};

export const getPedidoById = async (pedidoId: string, userId: string): Promise<Pedido | null> => {
  const pedidoRef = doc(db, COLLECTION_NAME, pedidoId);
  const pedidoDoc = await getDoc(pedidoRef);

  if (!pedidoDoc.exists()) {
    return null;
  }

  const data = pedidoDoc.data();

  if (data.userId !== userId) {
    return null;
  }

  return {
    id: pedidoDoc.id,
    ...data,
    productos: (data.productos as ProductoItem[]),
    abonos: parseAbonos(data.abonos),
    archivado: data.archivado || false,
    fechaCreacion: data.fechaCreacion.toDate(),
    fechaEntrega: data.fechaEntrega?.toDate() || undefined
  } as Pedido;
};

export const archivePedido = async (pedidoId: string): Promise<void> => {
  const pedidoRef = doc(db, COLLECTION_NAME, pedidoId);
  await updateDoc(pedidoRef, { archivado: true });
};

export const unarchivePedido = async (pedidoId: string): Promise<void> => {
  const pedidoRef = doc(db, COLLECTION_NAME, pedidoId);
  await updateDoc(pedidoRef, { archivado: false });
};

export const getArchivedPedidos = async (userId: string): Promise<Pedido[]> => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId),
    where('archivado', '==', true),
    orderBy('fechaCreacion', 'desc'),
    limit(PAGE_LIMIT)
  );

  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      productos: (data.productos as ProductoItem[]),
      abonos: parseAbonos(data.abonos),
      archivado: true,
      fechaCreacion: data.fechaCreacion.toDate(),
      fechaEntrega: data.fechaEntrega?.toDate() || undefined
    } as Pedido;
  });
};

export const archiveAllDelivered = async (userId: string): Promise<number> => {
  const fortyEightHoursAgo = new Date();
  fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId),
    where('estado', '==', 'entregado'),
    where('archivado', '==', false)
  );

  const querySnapshot = await getDocs(q);

  const toArchive = querySnapshot.docs.filter((d) => {
    const data = d.data();
    const fecha = data.fechaEntrega?.toDate() ?? data.fechaCreacion.toDate();
    return fecha <= fortyEightHoursAgo;
  });

  if (toArchive.length === 0) return 0;

  const batch = writeBatch(db);
  toArchive.forEach((d) => batch.update(doc(db, COLLECTION_NAME, d.id), { archivado: true }));
  await batch.commit();

  return toArchive.length;
};

export const countPedidosMes = async (userId: string): Promise<number> => {
  const now = new Date();
  const startOfMonth = Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth(), 1));
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId),
    where('fechaCreacion', '>=', startOfMonth)
  );
  const snap = await getCountFromServer(q);
  return snap.data().count;
};

export const getPedidosByClientPhone = async (userId: string, telefono: string): Promise<Pedido[]> => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId),
    where('clienteTelefono', '==', telefono)
  );

  const querySnapshot = await getDocs(q);

  const pedidos = querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      productos: (data.productos as ProductoItem[]),
      abonos: parseAbonos(data.abonos),
      archivado: data.archivado || false,
      fechaCreacion: data.fechaCreacion.toDate(),
      fechaEntrega: data.fechaEntrega?.toDate() || undefined
    } as Pedido;
  });

  // Ordenar en cliente para evitar necesidad de índice compuesto
  return pedidos.sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());
};

export const addAbono = async (
  pedidoId: string,
  monto: number,
  productoIndex?: number,
  creadoPor?: CreadoPor
): Promise<{ abono: Abono; nuevoEstado: PedidoStatus | null }> => {
  const pedidoRef = doc(db, COLLECTION_NAME, pedidoId);
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const fecha = Timestamp.now();
  const abonoData: Record<string, unknown> = { id, monto, fecha };
  if (typeof productoIndex === 'number') abonoData.productoIndex = productoIndex;
  if (creadoPor) abonoData.creadoPor = creadoPor;

  let nuevoEstado: PedidoStatus | null = null;

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(pedidoRef);
    if (!snap.exists()) throw new Error('Pedido no encontrado');

    const data = snap.data();
    const estadoActual = data.estado as PedidoStatus;
    const total = data.total as number;
    const pagadoHastaAhora = parseAbonos(data.abonos ?? []).reduce((s, a) => s + a.monto, 0);

    const updateData: Record<string, unknown> = { abonos: arrayUnion(abonoData) };
    if (estadoActual === 'pendiente' && (pagadoHastaAhora + monto) >= total) {
      nuevoEstado = 'en_preparacion';
      updateData.estado = 'en_preparacion';
    }
    transaction.update(pedidoRef, updateData);
  });

  const abono: Abono = { id, monto, fecha: new Date() };
  if (typeof productoIndex === 'number') abono.productoIndex = productoIndex;
  if (creadoPor) abono.creadoPor = creadoPor;

  return { abono, nuevoEstado };
};

export const parsePedidoDoc = (docId: string, data: DocumentData): Pedido => ({
  id: docId,
  ...data,
  productos: (data.productos as ProductoItem[]),
  abonos: parseAbonos(data.abonos ?? []),
  archivado: data.archivado || false,
  fechaCreacion: data.fechaCreacion.toDate(),
  fechaEntrega: data.fechaEntrega?.toDate() || undefined
} as Pedido);

export const subscribeToPedidos = (
  negocioUid: string,
  onUpdate: (result: { pedidos: Pedido[]; hasMore: boolean; lastDoc: QueryDocumentSnapshot | null }) => void,
  onError: (error: Error) => void
): (() => void) => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', negocioUid),
    orderBy('fechaCreacion', 'desc'),
    limit(PAGE_LIMIT + 1)
  );

  return onSnapshot(q, (snapshot) => {
    const hasMore = snapshot.docs.length > PAGE_LIMIT;
    const docs = hasMore ? snapshot.docs.slice(0, PAGE_LIMIT) : snapshot.docs;
    const pedidos = docs.map(d => parsePedidoDoc(d.id, d.data()));
    onUpdate({ pedidos, hasMore, lastDoc: docs[docs.length - 1] ?? null });
  }, onError);
};

export const updateAbono = async (
  pedidoId: string,
  abonoId: string,
  nuevoMonto: number,
): Promise<Abono[]> => {
  const pedidoRef = doc(db, COLLECTION_NAME, pedidoId);
  const snap = await getDoc(pedidoRef);
  if (!snap.exists()) throw new Error('Pedido no encontrado');

  const raw = (snap.data().abonos ?? []) as Record<string, unknown>[];
  const updated = raw.map(a => {
    if (a.id !== abonoId) return a;
    return {
      ...a,
      montoOriginal: a.montoOriginal ?? a.monto,
      monto: nuevoMonto,
      editadoEn: Timestamp.now(),
    };
  });

  await updateDoc(pedidoRef, { abonos: updated });
  return parseAbonos(updated);
};
