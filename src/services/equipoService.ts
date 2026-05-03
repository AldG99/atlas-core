import {
  collection, query, where, getDocs, onSnapshot,
  updateDoc, doc, getDoc, Timestamp, setDoc
} from 'firebase/firestore';
import { db, auth } from './firebase';
import type { User } from '../types/User';

export interface MiembroFormData {
  nombre: string;
  apellido: string;
  password: string;
  telefono: string;
  telefonoCodigoPais: string;
  fechaNacimiento: string;
}

// Genera username con 10 caracteres aleatorios criptográficamente seguros.
// No contiene datos personales ni patrones predecibles.
const generarUsername = (): string => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(bytes, b => alphabet[b % alphabet.length]).join('');
};

// Create employee account using Firebase REST API (doesn't sign out admin)
export const createMiembro = async (
  data: MiembroFormData,
  negocioUid: string,
  negocioNombre: string,
): Promise<string> => {
  const username = generarUsername();

  const authEmail = `${username}@skytla.miembro`;
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string;

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: authEmail, password: data.password, returnSecureToken: false }),
    }
  );

  const result = await response.json() as { localId?: string; error?: { message: string } };
  if (result.error) {
    throw new Error(result.error.message);
  }

  const uid = result.localId!;

  // Auto-assign next member number (never reuse deleted numbers)
  const allSnap = await getDocs(query(
    collection(db, 'users'),
    where('negocioUid', '==', negocioUid),
    where('role', '==', 'miembro'),
  ));
  const maxNumero = allSnap.docs.reduce((max, d) => {
    const n = parseInt((d.data() as { numeroMiembro?: string }).numeroMiembro ?? '0', 10);
    return isNaN(n) ? max : Math.max(max, n);
  }, 0);
  const numeroMiembro = String(maxNumero + 1).padStart(4, '0');

  const newUser: Omit<User, 'fechaRegistro'> & { fechaRegistro: ReturnType<typeof Timestamp.now> } = {
    uid,
    email: authEmail,
    username,
    nombre: data.nombre,
    apellido: data.apellido,
    telefono: data.telefono,
    telefonoCodigoPais: data.telefonoCodigoPais,
    fechaNacimiento: data.fechaNacimiento,
    numeroMiembro,
    negocioUid,
    role: 'miembro',
    nombreNegocio: negocioNombre,
    fechaRegistro: Timestamp.now(),
    activo: true,
  };

  await setDoc(doc(db, 'users', uid), newUser);
  return uid;
};

// Get all active employees of a negocio
export const getMiembros = async (negocioUid: string): Promise<User[]> => {
  const snap = await getDocs(query(
    collection(db, 'users'),
    where('negocioUid', '==', negocioUid),
    where('role', '==', 'miembro'),
  ));
  return snap.docs
    .map(d => d.data() as User)
    .filter(u => u.activo !== false);
};

// Real-time listener for active employees
export const suscribirMiembros = (
  negocioUid: string,
  callback: (miembros: User[]) => void,
): (() => void) => {
  const q = query(
    collection(db, 'users'),
    where('negocioUid', '==', negocioUid),
    where('role', '==', 'miembro'),
  );
  return onSnapshot(q, (snap) => {
    const miembros = snap.docs
      .map(d => d.data() as User)
      .filter(u => u.activo !== false);
    callback(miembros);
  });
};

// Deactivate (remove) employee — keeps Firebase Auth account but disables access
export const desactivarMiembro = async (uid: string): Promise<void> => {
  await updateDoc(doc(db, 'users', uid), { activo: false });
};

// Update editable fields of an employee
export const actualizarMiembro = async (
  uid: string,
  data: Partial<Pick<User, 'nombre' | 'apellido' | 'telefono' | 'telefonoCodigoPais' | 'fechaNacimiento'>>,
): Promise<void> => {
  await updateDoc(doc(db, 'users', uid), data);
};

// Update employee password via Firebase REST API
// NOTE: This operation should eventually be migrated to a Cloud Function
// to avoid exposing the API key in network requests.
export const actualizarContrasenaMiembro = async (uid: string, nuevaContrasena: string): Promise<void> => {
  // Verify the caller is an authenticated admin
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('No hay sesión activa');

  const callerSnap = await getDoc(doc(db, 'users', currentUser.uid));
  if (!callerSnap.exists() || callerSnap.data().role !== 'admin') {
    throw new Error('No autorizado');
  }

  // Verify the target employee belongs to the same negocio
  const targetSnap = await getDoc(doc(db, 'users', uid));
  if (!targetSnap.exists()) throw new Error('Miembro no encontrado');
  if (targetSnap.data().negocioUid !== callerSnap.data().negocioUid) {
    throw new Error('No autorizado');
  }

  // Validate password strength
  if (nuevaContrasena.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres');

  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string;
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ localId: uid, password: nuevaContrasena, returnSecureToken: false }),
    }
  );
  const result = await response.json() as { error?: { message: string } };
  if (result.error) throw new Error('Error al actualizar la contraseña');
};

// Get admin user by UID
export const getAdminPorUid = async (uid: string): Promise<User | null> => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as User) : null;
};

// Employee leaves voluntarily — makes them standalone admin again
export const salirDelNegocio = async (uid: string): Promise<void> => {
  await updateDoc(doc(db, 'users', uid), {
    negocioUid: uid,
    role: 'admin',
  });
};
