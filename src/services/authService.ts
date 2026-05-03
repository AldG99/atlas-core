import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  sendPasswordResetEmail,
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs, writeBatch, Timestamp, deleteField } from 'firebase/firestore';
import { ref, uploadBytes } from 'firebase/storage';
import { auth, db, storage } from './firebase';
import type { User, LoginCredentials, RegisterCredentials, Plantillas } from '../types/User';
import { compressImage } from '../utils/imageUtils';
import { waitForModeration } from '../utils/imageModeration';

export const registerUser = async (credentials: RegisterCredentials): Promise<User> => {
  const { email, password, nombreNegocio, nombre, apellido, fechaNacimiento, telefono, telefonoCodigoPais } = credentials;

  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const { uid } = userCredential.user;

  const newUser: User = {
    uid,
    email,
    nombreNegocio,
    nombre,
    apellido,
    fechaNacimiento,
    telefono,
    telefonoCodigoPais,
    fechaRegistro: new Date(),
    role: 'admin',
    negocioUid: uid,
  };

  await setDoc(doc(db, 'users', uid), newUser);

  return newUser;
};

const normalizeUserData = (data: Record<string, unknown>): User => {
  return {
    ...data,
    fechaRegistro: data.fechaRegistro instanceof Timestamp
      ? data.fechaRegistro.toDate()
      : new Date(data.fechaRegistro as string | number | Date),
  } as User;
};

export const loginUser = async (credentials: LoginCredentials): Promise<User> => {
  const { email, password } = credentials;

  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const { uid } = userCredential.user;

  const userDoc = await getDoc(doc(db, 'users', uid));

  if (!userDoc.exists()) {
    throw new Error('Usuario no encontrado');
  }

  return normalizeUserData(userDoc.data());
};

export const logoutUser = async (): Promise<void> => {
  await signOut(auth);
};

export const getCurrentUser = (): Promise<FirebaseUser | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

export const getUserData = async (uid: string): Promise<User | null> => {
  const userDoc = await getDoc(doc(db, 'users', uid));

  if (!userDoc.exists()) {
    return null;
  }

  return normalizeUserData(userDoc.data());
};

export interface UpdateProfileData {
  nombreNegocio?: string;
  nombre?: string;
  apellido?: string;
  fechaNacimiento?: string;
  telefono?: string;
  telefonoCodigoPais?: string;
  direccion?: string;
  fotoPerfil?: string;
  moneda?: string;
  plantillas?: Plantillas;
}

export const updateUserProfile = async (uid: string, data: UpdateProfileData): Promise<User> => {
  const userRef = doc(db, 'users', uid);

  const updateData: Record<string, unknown> = { ...data };
  if (data.fotoPerfil === '') {
    updateData.fotoPerfil = deleteField();
  }

  await updateDoc(userRef, updateData);

  const updatedDoc = await getDoc(userRef);
  return normalizeUserData(updatedDoc.data() as Record<string, unknown>);
};

export const changeUserPassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.email) throw new Error('No hay sesión activa');

  const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
  await reauthenticateWithCredential(currentUser, credential);
  await updatePassword(currentUser, newPassword);
};

export const deleteAllUserDataWithAuth = async (password: string, uid: string): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.email) throw new Error('No hay sesión activa');
  const credential = EmailAuthProvider.credential(currentUser.email, password);
  await reauthenticateWithCredential(currentUser, credential);
  await deleteAllUserData(uid);
};

export const deleteAllUserData = async (uid: string): Promise<void> => {
  const cols = ['clientes', 'productos', 'pedidos', 'etiquetas'];
  for (const col of cols) {
    const snap = await getDocs(query(collection(db, col), where('userId', '==', uid)));
    for (let i = 0; i < snap.docs.length; i += 400) {
      const batch = writeBatch(db);
      snap.docs.slice(i, i + 400).forEach(d => batch.delete(d.ref));
      await batch.commit();
    }
  }
};

export const deleteAccount = async (password: string, uid: string): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.email) throw new Error('No hay sesión activa');

  const credential = EmailAuthProvider.credential(currentUser.email, password);
  await reauthenticateWithCredential(currentUser, credential);

  await deleteAllUserData(uid);
  await deleteDoc(doc(db, 'users', uid));
  await deleteUser(currentUser);
};

export const loginMiembro = async (username: string, password: string): Promise<User> => {
  // Email sintético construido desde el username — no requiere consulta previa
  const authEmail = `${username}@skytla.miembro`;

  let userCredential;
  try {
    userCredential = await signInWithEmailAndPassword(auth, authEmail, password);
  } catch {
    throw new Error('Usuario o contraseña incorrectos');
  }

  const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
  if (!userDoc.exists()) throw new Error('Usuario no encontrado');
  const userData = normalizeUserData(userDoc.data());
  if (userData.activo === false) {
    await signOut(auth);
    throw new Error('Tu cuenta ha sido desactivada. Contacta con tu administrador.');
  }
  return userData;
};

export const uploadProfileImage = async (file: File, uid: string): Promise<string> => {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Solo se permiten imágenes en formato JPEG, PNG o WebP');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('La imagen no puede superar 5 MB');
  }
  const compressed = await compressImage(file, 400, 0.75);
  const moderationId = crypto.randomUUID();
  const fileName = `profile_${Date.now()}.jpg`;
  const storageRef = ref(storage, `pending/${uid}/profile/${fileName}`);
  await uploadBytes(storageRef, compressed, { customMetadata: { moderationId } });
  return waitForModeration(moderationId);
};

export const resetPassword = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};
