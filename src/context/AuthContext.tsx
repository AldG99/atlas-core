import type { ReactNode } from 'react';
import { createContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import type { User, AuthState, LoginCredentials, RegisterCredentials } from '../types/User';
import { loginUser, registerUser, logoutUser, getUserData, updateUserProfile, uploadProfileImage, changeUserPassword, deleteAllUserDataWithAuth, deleteAccount as deleteAccountService, loginEmpleado as loginEmpleadoService, resetPassword } from '../services/authService';
import type { UpdateProfileData } from '../services/authService';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  loginEmpleado: (username: string, password: string) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileData, imageFile?: File | null) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAllData: (password: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  negocioUid: string | null;
  role: 'admin' | 'empleado';
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
        if (userData?.activo === false) {
          await logoutUser();
          setUser(null);
        } else {
          setUser(userData);
        }
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

  const loginEmpleado = async (username: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const userData = await loginEmpleadoService(username, password);
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

  const deleteAllData = async (password: string) => {
    if (!user) return;
    try {
      setError(null);
      await deleteAllUserDataWithAuth(password, user.uid);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar los datos');
      throw err;
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      await resetPassword(email);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al enviar el correo');
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

  const negocioUid = user?.negocioUid ?? user?.uid ?? null;
  const role = (user?.role ?? 'admin') as 'admin' | 'empleado';

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    loginEmpleado,
    register,
    logout,
    updateProfile,
    changePassword,
    deleteAllData,
    deleteAccount,
    sendPasswordReset,
    negocioUid,
    role,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
