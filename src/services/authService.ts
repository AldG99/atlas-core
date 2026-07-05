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
import { ref, uploadBytes, deleteObject } from 'firebase/storage';
import { auth, db, storage } from './firebase';
import type { User, LoginCredentials, RegisterCredentials, Templates } from '../types/User';
import { compressImage } from '../utils/imageUtils';
import { waitForModeration } from '../utils/imageModeration';
import { makeMemberEmail } from '../constants/member';

export const registerUser = async (credentials: RegisterCredentials): Promise<User> => {
  const { email, password, businessName, firstName, lastName, birthDate, phone, phoneCountryCode } = credentials;

  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const { uid } = userCredential.user;

  const newUser: User = {
    uid,
    email,
    businessName,
    firstName,
    lastName,
    birthDate,
    phone,
    phoneCountryCode,
    registeredAt: new Date(),
    role: 'admin',
    businessUid: uid,
  };

  await setDoc(doc(db, 'users', uid), newUser);

  return newUser;
};

const normalizeUserData = (data: Record<string, unknown>): User => {
  return {
    ...data,
    registeredAt: data.registeredAt instanceof Timestamp
      ? data.registeredAt.toDate()
      : new Date(data.registeredAt as string | number | Date),
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
  businessName?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  phone?: string;
  phoneCountryCode?: string;
  address?: string;
  profilePhoto?: string;
  currency?: string;
  templates?: Templates;
}

export const updateUserProfile = async (uid: string, data: UpdateProfileData): Promise<User> => {
  const userRef = doc(db, 'users', uid);

  const updateData: Record<string, unknown> = { ...data };
  if (data.profilePhoto === '') {
    updateData.profilePhoto = deleteField();
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

const parseStoragePath = (url: string): string | null => {
  try {
    const match = new URL(url).pathname.match(/\/o\/(.+)$/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
};

const deleteStorageFile = async (url: string): Promise<void> => {
  const path = parseStoragePath(url);
  if (!path) return;
  try { await deleteObject(ref(storage, path)); } catch { /* best effort */ }
};

export const deleteAllUserData = async (uid: string): Promise<void> => {
  // Fetch before deleting to collect Storage URLs
  const [clientsSnap, productsSnap, userSnap] = await Promise.all([
    getDocs(query(collection(db, 'clients'), where('userId', '==', uid))),
    getDocs(query(collection(db, 'products'), where('userId', '==', uid))),
    getDoc(doc(db, 'users', uid)),
  ]);

  const storageUrls: string[] = [];
  clientsSnap.docs.forEach(d => {
    const url = d.data().profilePhoto as string | undefined;
    if (url) storageUrls.push(url);
  });
  productsSnap.docs.forEach(d => {
    const url = d.data().image as string | undefined;
    if (url) storageUrls.push(url);
  });
  if (userSnap.exists()) {
    const url = userSnap.data().profilePhoto as string | undefined;
    if (url) storageUrls.push(url);
  }

  // Delete Firestore docs, reusing already-fetched snaps for clients y products
  const deleteSnap = async (snap: typeof clientsSnap) => {
    for (let i = 0; i < snap.docs.length; i += 400) {
      const batch = writeBatch(db);
      snap.docs.slice(i, i + 400).forEach(d => batch.delete(d.ref));
      await batch.commit();
    }
  };

  await Promise.all([deleteSnap(clientsSnap), deleteSnap(productsSnap)]);

  for (const col of ['orders', 'labels', 'orderCounters']) {
    const snap = await getDocs(query(collection(db, col), where('userId', '==', uid)));
    await deleteSnap(snap);
  }

  // Best-effort: delete Storage files (no falla el proceso si Storage falla)
  await Promise.allSettled(storageUrls.map(deleteStorageFile));
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

export const loginMember = async (username: string, password: string): Promise<User> => {
  // Email sintético construido desde el username — no requiere consulta previa
  const authEmail = makeMemberEmail(username);

  let userCredential;
  try {
    userCredential = await signInWithEmailAndPassword(auth, authEmail, password);
  } catch {
    throw new Error('Usuario o contraseña incorrectos');
  }

  const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
  if (!userDoc.exists()) throw new Error('Usuario no encontrado');
  const userData = normalizeUserData(userDoc.data());
  if (userData.active === false) {
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
