import { doc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const TIMEOUT_MS = 30_000;

export const waitForModeration = (moderationId: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const docRef = doc(db, 'imagenModerada', moderationId);

    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        unsubscribe();
        deleteDoc(docRef).catch(() => { /* no-op */ });

        if (data['aprobada'] && data['url']) {
          resolve(data['url'] as string);
        } else if (data['rechazada']) {
          reject(new Error(data['error'] ? 'MODERACION_ERROR' : 'IMAGEN_RECHAZADA'));
        }
      },
      (err) => {
        unsubscribe();
        reject(err);
      }
    );

    setTimeout(() => {
      unsubscribe();
      reject(new Error('MODERACION_TIMEOUT'));
    }, TIMEOUT_MS);
  });
};
