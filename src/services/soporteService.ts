import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  increment,
  Timestamp
} from 'firebase/firestore';
import emailjs from '@emailjs/browser';
import { db } from './firebase';

const DAILY_LIMIT = 3;
const COOLDOWN_MS = 5 * 60 * 1000;

const getRateLimitDocId = (userId: string): string => {
  const today = new Date().toISOString().slice(0, 10);
  return `${userId}_${today}`;
};

export const getRateLimitStatus = async (
  userId: string
): Promise<{ mensajesHoy: number; cooldownEnds: Date | null }> => {
  const snap = await getDoc(doc(db, 'soporteRateLimit', getRateLimitDocId(userId)));
  if (!snap.exists()) return { mensajesHoy: 0, cooldownEnds: null };

  const data = snap.data();
  const mensajesHoy: number = data.count ?? 0;
  const lastSent: Date | null = (data.lastSent as Timestamp)?.toDate?.() ?? null;
  const cooldownEnds =
    lastSent && Date.now() - lastSent.getTime() < COOLDOWN_MS
      ? new Date(lastSent.getTime() + COOLDOWN_MS)
      : null;

  return { mensajesHoy, cooldownEnds };
};

export const sendSupportMessage = async (
  userId: string,
  asunto: string,
  mensaje: string
): Promise<void> => {
  const limitDocId = getRateLimitDocId(userId);
  const limitRef = doc(db, 'soporteRateLimit', limitDocId);
  const snap = await getDoc(limitRef);

  if (snap.exists()) {
    const data = snap.data();
    if ((data.count ?? 0) >= DAILY_LIMIT) throw new Error('DAILY_LIMIT');
    const lastSent: Date | null = (data.lastSent as Timestamp)?.toDate?.() ?? null;
    if (lastSent && Date.now() - lastSent.getTime() < COOLDOWN_MS) throw new Error('COOLDOWN');
  }

  await addDoc(collection(db, 'soporte'), {
    userId,
    asunto: asunto.trim(),
    mensaje: mensaje.trim(),
    fecha: Timestamp.now()
  });

  await emailjs.send(
    import.meta.env.VITE_EMAILJS_SERVICE_ID,
    import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
    {
      user_id: userId,
      subject: asunto.trim(),
      message: mensaje.trim(),
      date: new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }),
    },
    import.meta.env.VITE_EMAILJS_PUBLIC_KEY
  );

  if (snap.exists()) {
    await updateDoc(limitRef, { count: increment(1), lastSent: Timestamp.now() });
  } else {
    await setDoc(limitRef, { count: 1, lastSent: Timestamp.now() });
  }
};
