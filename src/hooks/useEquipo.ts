import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import type { User } from '../types/User';
import {
  suscribirMiembros,
  createEmpleado,
  desactivarEmpleado,
  type EmpleadoFormData,
} from '../services/equipoService';

export const useEquipo = () => {
  const { user, role, negocioUid } = useAuth();
  const [miembros, setMiembros] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || role !== 'admin' || !negocioUid) return;
    setLoading(true);
    const unsub = suscribirMiembros(negocioUid, (data) => {
      setMiembros(data);
      setLoading(false);
    });
    return unsub;
  }, [user, role, negocioUid]);

  const crearEmpleado = async (data: EmpleadoFormData): Promise<void> => {
    if (!user || !negocioUid) throw new Error('No autenticado');
    await createEmpleado(data, negocioUid, user.nombreNegocio);
    // onSnapshot actualizará la lista automáticamente
  };

  const remover = async (uid: string): Promise<void> => {
    await desactivarEmpleado(uid);
    // onSnapshot actualizará la lista automáticamente
  };

  return { miembros, loading, crearEmpleado, remover };
};
