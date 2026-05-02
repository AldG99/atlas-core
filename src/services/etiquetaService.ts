import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Etiqueta } from '../types/Producto';

const COLLECTION_NAME = 'etiquetas';

export const getEtiquetas = async (userId: string): Promise<Etiqueta[]> => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Etiqueta[];
};

export const createEtiqueta = async (
  nombre: string,
  color: string,
  icono: string,
  userId: string
): Promise<Etiqueta> => {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    nombre,
    color,
    icono,
    userId,
  });
  return { id: docRef.id, nombre, color, icono, userId };
};

export const deleteEtiqueta = async (id: string): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};
