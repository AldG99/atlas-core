import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  getDoc,
  Timestamp,
  arrayUnion,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import type { Product, ProductFormData, DiscountHistory } from '../types/Product';

const COLLECTION_NAME = 'products';

const toValidDate = (v: unknown): Date | null => {
  const d = (v as Timestamp)?.toDate?.()
    ?? (typeof v === 'string' || typeof v === 'number' || v instanceof Date ? new Date(v) : null);
  return d && !Number.isNaN(d.getTime()) ? d : null;
};

// Descarta entradas corruptas (motivo desconocido, porcentaje no numérico,
// fechas inválidas) en vez de dejar que lleguen a la tabla como "undefined" o
// "Invalid Date".
const parseHistory = (raw: unknown): DiscountHistory[] => {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((entry): DiscountHistory[] => {
    const e = entry as Record<string, unknown>;
    const reason = e.reason;
    if (reason !== 'cancelled' && reason !== 'expired') return [];

    const percentage = Number(e.percentage);
    const endDate = toValidDate(e.endDate);
    const closedAt = toValidDate(e.closedAt);
    if (!Number.isFinite(percentage) || percentage <= 0 || !endDate || !closedAt) return [];

    return [{
      percentage,
      startDate: toValidDate(e.startDate) ?? endDate,
      endDate,
      closedAt,
      reason,
    }];
  });
};

const isDiscountExpired = (data: Record<string, unknown>): boolean => {
  const discount = data.discount as number;
  const endDate = (data.discountEndDate as Timestamp)?.toDate?.();
  if (!discount || discount <= 0 || !endDate) return false;
  return endDate < new Date(new Date().toDateString());
};

export const getProducts = async (userId: string): Promise<Product[]> => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId)
  );

  const snapshot = await getDocs(q);
  const today = new Date(new Date().toDateString());
  const now = Timestamp.now();

  const batch = writeBatch(db);
  let batchCount = 0;

  const products = snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    const discount = data.discount as number;
    const endDate = (data.discountEndDate as Timestamp)?.toDate?.();
    const expired = discount > 0 && !!endDate && endDate < today;

    if (expired) {
      const historyEntry = {
        percentage: discount,
        startDate: data.createdAt || now,
        endDate: data.discountEndDate,
        closedAt: now,
        reason: 'expired'
      };
      batch.update(doc(db, COLLECTION_NAME, docSnap.id), {
        discount: 0,
        discountEndDate: null,
        discountHistory: arrayUnion(historyEntry)
      });
      batchCount++;
    }

    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate?.() || undefined,
      discountEndDate: expired ? undefined : (endDate || undefined),
      discount: expired ? 0 : (discount || 0),
      discountHistory: parseHistory(data.discountHistory)
    } as Product;
  });

  if (batchCount > 0) await batch.commit();

  return products.sort((a, b) => a.name.localeCompare(b.name));
};

export const getProductById = async (id: string): Promise<Product | null> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  const data = docSnap.data();
  const discount = data.discount as number;
  const endDate = (data.discountEndDate as Timestamp)?.toDate?.();
  const expired = isDiscountExpired(data);

  if (expired) {
    const historyEntry = {
      percentage: discount,
      startDate: data.createdAt || Timestamp.now(),
      endDate: data.discountEndDate,
      closedAt: Timestamp.now(),
      reason: 'expired'
    };
    await updateDoc(docRef, {
      discount: 0,
      discountEndDate: null,
      discountHistory: arrayUnion(historyEntry)
    });
  }

  return {
    id: docSnap.id,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate?.() || undefined,
    discountEndDate: expired ? undefined : (endDate || undefined),
    discount: expired ? 0 : (discount || 0),
    discountHistory: parseHistory(data.discountHistory)
  } as Product;
};

export const createProduct = async (
  data: ProductFormData,
  userId: string
): Promise<string> => {
  // Firestore rechaza valores undefined (ej. minStock/maxStock sin tocar en el form)
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...cleanData,
    userId,
    createdAt: Timestamp.now()
  });
  return docRef.id;
};

export interface CancelDiscountInfo {
  percentage: number;
  endDate: Date;
}

export const updateProduct = async (
  id: string,
  data: Partial<ProductFormData>,
  cancelledDiscount?: CancelDiscountInfo,
  // "Última edición" no debe moverse solo por agregar/quitar un descuento —
  // el llamador decide si el resto de los datos del producto cambió.
  recordEdit = true
): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  // Firestore rechaza valores undefined — solo incluir campos definidos
  const updateData: Record<string, unknown> = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );
  if (recordEdit) {
    updateData.updatedAt = Timestamp.now();
  }
  if (data.discountEndDate) {
    updateData.discountEndDate = Timestamp.fromDate(
      typeof data.discountEndDate === 'string'
        ? new Date(data.discountEndDate + 'T00:00:00')
        : data.discountEndDate
    );
  } else if ('discountEndDate' in data) {
    updateData.discountEndDate = null;
  }
  // minStock/maxStock son opcionales: si el llamador manda el campo como
  // undefined (el usuario borró el valor en el form) hay que escribir null
  // explícito, si no el filtro de arriba lo descarta y el valor viejo queda
  // huérfano en Firestore.
  if ('minStock' in data) {
    updateData.minStock = data.minStock ?? null;
  }
  if ('maxStock' in data) {
    updateData.maxStock = data.maxStock ?? null;
  }

  if (cancelledDiscount) {
    updateData.discountHistory = arrayUnion({
      percentage: cancelledDiscount.percentage,
      startDate: Timestamp.fromDate(cancelledDiscount.endDate),
      endDate: Timestamp.fromDate(cancelledDiscount.endDate),
      closedAt: Timestamp.now(),
      reason: 'cancelled'
    });
  }

  await updateDoc(docRef, updateData);
};

export const deleteProduct = async (id: string): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};

