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
  deleteField,
  type FieldValue
} from 'firebase/firestore';
import { ref, uploadBytes } from 'firebase/storage';
import { db, storage } from './firebase';
import type { Client, ClientFormData } from '../types/Client';
import { compressImage } from '../utils/imageUtils';
import { waitForModeration } from '../utils/imageModeration';

const COLLECTION_NAME = 'clients';

export const getClients = async (userId: string): Promise<Client[]> => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId)
  );

  const snapshot = await getDocs(q);
  const clients = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      lastName: data.lastName || '',
      createdAt: data.createdAt?.toDate() || new Date()
    } as Client;
  });

  // Ordenar en el cliente para evitar necesidad de índice compuesto
  return clients.sort((a, b) => a.firstName.localeCompare(b.firstName));
};

export const getClientById = async (id: string): Promise<Client | null> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    lastName: data.lastName || '',
    createdAt: data.createdAt?.toDate() || new Date()
  } as Client;
};

type OptionalStringField = string | FieldValue | undefined;

const optionalField = (value: string | undefined): OptionalStringField =>
  value?.trim() || deleteField();

export const createClient = async (
  data: ClientFormData,
  userId: string
): Promise<string> => {
  // addDoc no admite deleteField() — omitir campos opcionales vacíos directamente
  const doc: Record<string, unknown> = {
    ...data,
    userId,
    createdAt: Timestamp.now()
  };
  const optionalFields: (keyof ClientFormData)[] = ['email', 'interiorNumber', 'country', 'reference', 'state'];
  for (const field of optionalFields) {
    const val = data[field];
    if (!val || !(val as string).trim()) {
      delete doc[field];
    }
  }
  const docRef = await addDoc(collection(db, COLLECTION_NAME), doc);
  return docRef.id;
};

export const updateClient = async (
  id: string,
  data: Partial<ClientFormData>
): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  // Firestore rechaza undefined — filtrar antes de construir el objeto
  const defined = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
  await updateDoc(docRef, {
    ...defined,
    email: optionalField(data.email),
    interiorNumber: optionalField(data.interiorNumber),
    country: optionalField(data.country),
    state: optionalField(data.state),
    reference: optionalField(data.reference)
  });
};

export const deleteClient = async (id: string): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};

export const toggleClientFavorite = async (
  id: string,
  favorite: boolean
): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, { favorite });
};

export const uploadClientImage = async (
  file: File,
  userId: string
): Promise<string> => {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Solo se permiten imágenes en formato JPEG, PNG o WebP');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('La imagen no puede superar 5 MB');
  }
  const compressed = await compressImage(file, 400, 0.75);
  const moderationId = crypto.randomUUID();
  const fileName = `${Date.now()}.jpg`;
  const storageRef = ref(storage, `pending/${userId}/clients/${fileName}`);
  await uploadBytes(storageRef, compressed, { customMetadata: { moderationId } });
  return waitForModeration(moderationId);
};
