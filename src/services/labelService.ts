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
import type { Label } from '../types/Product';

const COLLECTION_NAME = 'labels';

export const getLabels = async (userId: string): Promise<Label[]> => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Label[];
};

export const createLabel = async (
  name: string,
  color: string,
  icon: string,
  userId: string
): Promise<Label> => {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    name,
    color,
    icon,
    userId,
  });
  return { id: docRef.id, name, color, icon, userId };
};

export const deleteLabel = async (id: string): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};
