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
import type { Cliente, ClienteFormData } from '../types/Cliente';
import { compressImage } from '../utils/imageUtils';
import { waitForModeration } from '../utils/imageModeration';

const COLLECTION_NAME = 'clientes';

export const getClientes = async (userId: string): Promise<Cliente[]> => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId)
  );

  const snapshot = await getDocs(q);
  const clientes = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      apellido: data.apellido || '',
      fechaCreacion: data.fechaCreacion?.toDate() || new Date()
    } as Cliente;
  });

  // Ordenar en el cliente para evitar necesidad de índice compuesto
  return clientes.sort((a, b) => a.nombre.localeCompare(b.nombre));
};

export const getClienteById = async (id: string): Promise<Cliente | null> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    apellido: data.apellido || '',
    fechaCreacion: data.fechaCreacion?.toDate() || new Date()
  } as Cliente;
};

type OptionalStringField = string | FieldValue | undefined;

const optionalField = (value: string | undefined): OptionalStringField =>
  value?.trim() || deleteField();

export const createCliente = async (
  data: ClienteFormData,
  userId: string
): Promise<string> => {
  // addDoc no admite deleteField() — omitir campos opcionales vacíos directamente
  const doc: Record<string, unknown> = {
    ...data,
    userId,
    fechaCreacion: Timestamp.now()
  };
  const optionalFields: (keyof ClienteFormData)[] = ['correo', 'numeroInterior', 'pais', 'referencia', 'estado'];
  for (const field of optionalFields) {
    const val = data[field];
    if (!val || !(val as string).trim()) {
      delete doc[field];
    }
  }
  const docRef = await addDoc(collection(db, COLLECTION_NAME), doc);
  return docRef.id;
};

export const updateCliente = async (
  id: string,
  data: Partial<ClienteFormData>
): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  // Firestore rechaza undefined — filtrar antes de construir el objeto
  const defined = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
  await updateDoc(docRef, {
    ...defined,
    correo: optionalField(data.correo),
    numeroInterior: optionalField(data.numeroInterior),
    pais: optionalField(data.pais),
    estado: optionalField(data.estado),
    referencia: optionalField(data.referencia)
  });
};

export const deleteCliente = async (id: string): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};

export const toggleClienteFavorito = async (
  id: string,
  favorito: boolean
): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, { favorito });
};

export const uploadClienteImage = async (
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
  const storageRef = ref(storage, `pending/${userId}/clientes/${fileName}`);
  await uploadBytes(storageRef, compressed, { customMetadata: { moderationId } });
  return waitForModeration(moderationId);
};
