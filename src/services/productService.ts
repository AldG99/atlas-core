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

const parseHistory = (raw: unknown[]): DiscountHistory[] => {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => {
    const e = entry as Record<string, unknown>;
    return {
      percentage: e.percentage as number,
      startDate: (e.startDate as Timestamp)?.toDate?.() || new Date(e.startDate as string),
      endDate: (e.endDate as Timestamp)?.toDate?.() || new Date(e.endDate as string),
      closedAt: (e.closedAt as Timestamp)?.toDate?.() || new Date(e.closedAt as string),
      reason: e.reason as 'cancelled' | 'expired'
    };
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
    discountEndDate: expired ? undefined : (endDate || undefined),
    discount: expired ? 0 : (discount || 0),
    discountHistory: parseHistory(data.discountHistory)
  } as Product;
};

export const createProduct = async (
  data: ProductFormData,
  userId: string
): Promise<string> => {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...data,
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
  cancelledDiscount?: CancelDiscountInfo
): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  // Firestore rechaza valores undefined — solo incluir campos definidos
  const updateData: Record<string, unknown> = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );
  if (data.discountEndDate) {
    updateData.discountEndDate = Timestamp.fromDate(
      typeof data.discountEndDate === 'string'
        ? new Date(data.discountEndDate + 'T00:00:00')
        : data.discountEndDate
    );
  } else if ('discountEndDate' in data) {
    updateData.discountEndDate = null;
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

