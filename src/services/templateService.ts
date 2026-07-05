import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Templates } from '../types/User';

export const saveTemplates = async (userId: string, templates: Templates): Promise<void> => {
  await updateDoc(doc(db, 'users', userId), { templates });
};
