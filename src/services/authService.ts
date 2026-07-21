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
import { ref, deleteObject } from 'firebase/storage';
import { auth, db, storage } from './firebase';
import type { User, LoginCredentials, RegisterCredentials, Templates } from '../types/User';
import i18n from '../i18n';

export const registerUser = async (credentials: RegisterCredentials): Promise<User> => {
  const {
    email, password, businessName, firstName, lastName, birthDate, phone, phoneCountryCode,
    street, exteriorNumber, interiorNumber, neighborhood, city, state, postalCode, country, reference,
  } = credentials;

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
    street,
    exteriorNumber,
    interiorNumber: interiorNumber ?? '',
    neighborhood,
    city,
    state: state ?? '',
    postalCode,
    country: country ?? '',
    reference: reference ?? '',
    registeredAt: new Date(),
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
    throw new Error(i18n.t('errors.userNotFound'));
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
  street?: string;
  exteriorNumber?: string;
  interiorNumber?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  reference?: string;
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
  if (!currentUser || !currentUser.email) throw new Error(i18n.t('errors.noActiveSession'));

  const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
  await reauthenticateWithCredential(currentUser, credential);
  await updatePassword(currentUser, newPassword);
};

export const deleteAllUserDataWithAuth = async (password: string, uid: string): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.email) throw new Error(i18n.t('errors.noActiveSession'));
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
  if (!currentUser || !currentUser.email) throw new Error(i18n.t('errors.noActiveSession'));

  const credential = EmailAuthProvider.credential(currentUser.email, password);
  await reauthenticateWithCredential(currentUser, credential);

  await deleteAllUserData(uid);
  await deleteDoc(doc(db, 'users', uid));
  await deleteUser(currentUser);
};

export const resetPassword = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};
