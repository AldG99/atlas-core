import type { ReactNode } from 'react';
import { createContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import type { User, AuthState, LoginCredentials, RegisterCredentials } from '../types/User';
import { loginUser, registerUser, logoutUser, getUserData, updateUserProfile, changeUserPassword, deleteAllUserDataWithAuth, deleteAccount as deleteAccountService, resetPassword } from '../services/authService';
import type { UpdateProfileData } from '../services/authService';
import i18n from '../i18n';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAllData: (password: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  businessUid: string | null;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await getUserData(firebaseUser.uid);
        setUser(userData);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      setError(null);
      setLoading(true);
      const userData = await loginUser(credentials);
      setUser(userData);
    } catch (err) {
      setError(err instanceof Error ? err.message : i18n.t('auth.messages.loginError'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    try {
      setError(null);
      setLoading(true);
      const userData = await registerUser(credentials);
      setUser(userData);
    } catch (err) {
      setError(err instanceof Error ? err.message : i18n.t('auth.register.errors.generic'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : i18n.t('errors.logoutError'));
      throw err;
    }
  };

  const updateProfile = async (data: UpdateProfileData) => {
    if (!user) return;

    try {
      setError(null);
      const updatedUser = await updateUserProfile(user.uid, data);
      setUser(updatedUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : i18n.t('profile.updateError'));
      throw err;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setError(null);
      await changeUserPassword(currentPassword, newPassword);
    } catch (err) {
      setError(err instanceof Error ? err.message : i18n.t('errors.passwordChangeError'));
      throw err;
    }
  };

  const deleteAllData = async (password: string) => {
    if (!user) return;
    try {
      setError(null);
      await deleteAllUserDataWithAuth(password, user.uid);
    } catch (err) {
      setError(err instanceof Error ? err.message : i18n.t('errors.deleteDataError'));
      throw err;
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      await resetPassword(email);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : i18n.t('errors.emailSendError'));
    }
  };

  const deleteAccount = async (password: string) => {
    if (!user) return;
    try {
      setError(null);
      await deleteAccountService(password, user.uid);
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : i18n.t('errors.deleteAccountError'));
      throw err;
    }
  };

  const businessUid = user?.uid ?? null;

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    deleteAllData,
    deleteAccount,
    sendPasswordReset,
    businessUid,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
