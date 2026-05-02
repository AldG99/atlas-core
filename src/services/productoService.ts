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
import { ref, uploadBytes } from 'firebase/storage';
import { db, storage } from './firebase';
import type { Producto, ProductoFormData, DescuentoHistorial } from '../types/Producto';
import { compressImage } from '../utils/imageUtils';
import { waitForModeration } from '../utils/imageModeration';

const COLLECTION_NAME = 'productos';

const parseHistorial = (raw: unknown[]): DescuentoHistorial[] => {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => {
    const e = entry as Record<string, unknown>;
    return {
      porcentaje: e.porcentaje as number,
      fechaInicio: (e.fechaInicio as Timestamp)?.toDate?.() || new Date(e.fechaInicio as string),
      fechaFin: (e.fechaFin as Timestamp)?.toDate?.() || new Date(e.fechaFin as string),
      fechaCierre: (e.fechaCierre as Timestamp)?.toDate?.() || new Date(e.fechaCierre as string),
      motivo: e.motivo as 'cancelado' | 'expirado'
    };
  });
};

const isDescuentoExpired = (data: Record<string, unknown>): boolean => {
  const descuento = data.descuento as number;
  const fechaFin = (data.fechaFinDescuento as Timestamp)?.toDate?.();
  if (!descuento || descuento <= 0 || !fechaFin) return false;
  return fechaFin < new Date(new Date().toDateString());
};

export const getProductos = async (userId: string): Promise<Producto[]> => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId)
  );

  const snapshot = await getDocs(q);
  const hoy = new Date(new Date().toDateString());
  const ahora = Timestamp.now();

  const batch = writeBatch(db);
  let batchCount = 0;

  const productos = snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    const descuento = data.descuento as number;
    const fechaFin = (data.fechaFinDescuento as Timestamp)?.toDate?.();
    const expired = descuento > 0 && !!fechaFin && fechaFin < hoy;

    if (expired) {
      const historialEntry = {
        porcentaje: descuento,
        fechaInicio: data.fechaCreacion || ahora,
        fechaFin: data.fechaFinDescuento,
        fechaCierre: ahora,
        motivo: 'expirado'
      };
      batch.update(doc(db, COLLECTION_NAME, docSnap.id), {
        descuento: 0,
        fechaFinDescuento: null,
        historialDescuentos: arrayUnion(historialEntry)
      });
      batchCount++;
    }

    return {
      id: docSnap.id,
      ...data,
      fechaCreacion: data.fechaCreacion?.toDate() || new Date(),
      fechaFinDescuento: expired ? undefined : (fechaFin || undefined),
      descuento: expired ? 0 : (descuento || 0),
      historialDescuentos: parseHistorial(data.historialDescuentos)
    } as Producto;
  });

  if (batchCount > 0) await batch.commit();

  return productos.sort((a, b) => a.nombre.localeCompare(b.nombre));
};

export const getProductoById = async (id: string): Promise<Producto | null> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  const data = docSnap.data();
  const descuento = data.descuento as number;
  const fechaFin = (data.fechaFinDescuento as Timestamp)?.toDate?.();
  const expired = isDescuentoExpired(data);

  if (expired) {
    const historialEntry = {
      porcentaje: descuento,
      fechaInicio: data.fechaCreacion || Timestamp.now(),
      fechaFin: data.fechaFinDescuento,
      fechaCierre: Timestamp.now(),
      motivo: 'expirado'
    };
    await updateDoc(docRef, {
      descuento: 0,
      fechaFinDescuento: null,
      historialDescuentos: arrayUnion(historialEntry)
    });
  }

  return {
    id: docSnap.id,
    ...data,
    fechaCreacion: data.fechaCreacion?.toDate() || new Date(),
    fechaFinDescuento: expired ? undefined : (fechaFin || undefined),
    descuento: expired ? 0 : (descuento || 0),
    historialDescuentos: parseHistorial(data.historialDescuentos)
  } as Producto;
};

export const createProducto = async (
  data: ProductoFormData,
  userId: string
): Promise<string> => {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...data,
    userId,
    fechaCreacion: Timestamp.now()
  });
  return docRef.id;
};

export interface CancelDescuentoInfo {
  porcentaje: number;
  fechaFin: Date;
}

export const updateProducto = async (
  id: string,
  data: Partial<ProductoFormData>,
  cancelledDescuento?: CancelDescuentoInfo
): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  // Firestore rechaza valores undefined — solo incluir campos definidos
  const updateData: Record<string, unknown> = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );
  if (data.fechaFinDescuento) {
    updateData.fechaFinDescuento = Timestamp.fromDate(
      typeof data.fechaFinDescuento === 'string'
        ? new Date(data.fechaFinDescuento + 'T00:00:00')
        : data.fechaFinDescuento
    );
  } else if ('fechaFinDescuento' in data) {
    updateData.fechaFinDescuento = null;
  }

  if (cancelledDescuento) {
    updateData.historialDescuentos = arrayUnion({
      porcentaje: cancelledDescuento.porcentaje,
      fechaInicio: Timestamp.fromDate(cancelledDescuento.fechaFin),
      fechaFin: Timestamp.fromDate(cancelledDescuento.fechaFin),
      fechaCierre: Timestamp.now(),
      motivo: 'cancelado'
    });
  }

  await updateDoc(docRef, updateData);
};

export const deleteProducto = async (id: string): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};

export const uploadProductoImage = async (
  file: File,
  userId: string
): Promise<string> => {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Solo se permiten imágenes en formato JPEG, PNG o WebP');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('La imagen no puede superar 5 MB');
  }
  const compressed = await compressImage(file, 800, 0.78);
  const moderationId = crypto.randomUUID();
  const fileName = `${Date.now()}.jpg`;
  const storageRef = ref(storage, `pending/${userId}/productos/${fileName}`);
  await uploadBytes(storageRef, compressed, { customMetadata: { moderationId } });
  return waitForModeration(moderationId);
};
