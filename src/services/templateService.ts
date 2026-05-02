import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Plantillas } from '../types/User';

export const savePlantillas = async (userId: string, plantillas: Plantillas): Promise<void> => {
  await updateDoc(doc(db, 'users', userId), { plantillas });
};
