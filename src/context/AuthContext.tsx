import type { ReactNode } from 'react';
import { createContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import type { User, AuthState, LoginCredentials, RegisterCredentials } from '../types/User';
import { loginUser, registerUser, logoutUser, getUserData, updateUserProfile, uploadProfileImage, changeUserPassword, deleteAllUserData, deleteAccount as deleteAccountService } from '../services/authService';
import type { UpdateProfileData } from '../services/authService';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileData, imageFile?: File | null) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAllData: () => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
}

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
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
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
      setError(err instanceof Error ? err.message : 'Error al registrarse');
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
      setError(err instanceof Error ? err.message : 'Error al cerrar sesión');
      throw err;
    }
  };

  const updateProfile = async (data: UpdateProfileData, imageFile?: File | null) => {
    if (!user) return;

    try {
      setError(null);
      let profileData = { ...data };

      if (imageFile) {
        const imageUrl = await uploadProfileImage(imageFile, user.uid);
        profileData.fotoPerfil = imageUrl;
      }

      const updatedUser = await updateUserProfile(user.uid, profileData);
      setUser(updatedUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar perfil');
      throw err;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setError(null);
      await changeUserPassword(currentPassword, newPassword);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar contraseña');
      throw err;
    }
  };

  const deleteAllData = async () => {
    if (!user) return;
    try {
      setError(null);
      await deleteAllUserData(user.uid);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar los datos');
      throw err;
    }
  };

  const deleteAccount = async (password: string) => {
    if (!user) return;
    try {
      setError(null);
      await deleteAccountService(password, user.uid);
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar la cuenta');
      throw err;
    }
  };

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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
