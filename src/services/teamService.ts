import {
  collection, query, where, getDocs, onSnapshot,
  updateDoc, doc, getDoc, Timestamp, setDoc
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db, auth } from './firebase';

const fns = getFunctions(auth.app, 'us-central1');
import type { User } from '../types/User';
import { makeMemberEmail, generateUsername } from '../constants/member';
import i18n from '../i18n';

export { generateUsername };

export interface MemberFormData {
  firstName: string;
  lastName: string;
  password: string;
  phone: string;
  phoneCountryCode: string;
  birthDate: string;
}

// Create employee account using Firebase REST API (doesn't sign out admin)
export const createMember = async (
  data: MemberFormData,
  businessUid: string,
  businessName: string,
): Promise<string> => {
  const username = generateUsername();

  const authEmail = makeMemberEmail(username);
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
    where('businessUid', '==', businessUid),
    where('role', '==', 'member'),
  ));
  const maxNumber = allSnap.docs.reduce((max, d) => {
    const n = parseInt((d.data() as { memberNumber?: string }).memberNumber ?? '0', 10);
    return isNaN(n) ? max : Math.max(max, n);
  }, 0);
  const memberNumber = String(maxNumber + 1).padStart(4, '0');

  const newUser: Omit<User, 'registeredAt'> & { registeredAt: ReturnType<typeof Timestamp.now> } = {
    uid,
    email: authEmail,
    username,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    phoneCountryCode: data.phoneCountryCode,
    birthDate: data.birthDate,
    memberNumber,
    businessUid,
    role: 'member',
    businessName,
    registeredAt: Timestamp.now(),
    active: true,
  };

  await setDoc(doc(db, 'users', uid), newUser);
  return uid;
};

// Get all active employees of a business
export const getMembers = async (businessUid: string): Promise<User[]> => {
  const snap = await getDocs(query(
    collection(db, 'users'),
    where('businessUid', '==', businessUid),
    where('role', '==', 'member'),
  ));
  return snap.docs
    .map(d => d.data() as User)
    .filter(u => u.active !== false);
};

// Real-time listener for active employees
export const subscribeToMembers = (
  businessUid: string,
  callback: (members: User[]) => void,
): (() => void) => {
  const q = query(
    collection(db, 'users'),
    where('businessUid', '==', businessUid),
    where('role', '==', 'member'),
  );
  return onSnapshot(q, (snap) => {
    const members = snap.docs
      .map(d => d.data() as User)
      .filter(u => u.active !== false);
    callback(members);
  });
};

// Deactivate (remove) employee — keeps Firebase Auth account but disables access
export const deactivateMember = async (uid: string): Promise<void> => {
  await updateDoc(doc(db, 'users', uid), { active: false });
};

// Update editable fields of an employee
export const updateMember = async (
  uid: string,
  data: Partial<Pick<User, 'firstName' | 'lastName' | 'phone' | 'phoneCountryCode' | 'birthDate'>>,
): Promise<void> => {
  await updateDoc(doc(db, 'users', uid), data);
};

export const updateMemberPassword = async (uid: string, newPassword: string): Promise<void> => {
  if (newPassword.length < 8) throw new Error(i18n.t('errors.passwordTooShort'));
  const updatePassword = httpsCallable<{ uid: string; password: string }, void>(fns, 'updateMemberPassword');
  await updatePassword({ uid, password: newPassword });
};

// Get admin user by UID
export const getAdminByUid = async (uid: string): Promise<User | null> => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as User) : null;
};

// Employee leaves voluntarily — makes them standalone admin again
export const leaveBusiness = async (uid: string): Promise<void> => {
  await updateDoc(doc(db, 'users', uid), {
    businessUid: uid,
    role: 'admin',
  });
};
