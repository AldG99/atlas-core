import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import type { User } from '../types/User';
import {
  suscribirMiembros,
  createEmpleado,
  desactivarEmpleado,
  type EmpleadoFormData,
} from '../services/equipoService';
import { getPlanLimits } from '../constants/planLimits';

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

    const limites = getPlanLimits(user.plan);
    if (limites.miembros === 0) {
      throw new Error('Tu plan no incluye miembros del equipo. Actualiza tu plan para agregar colaboradores.');
    }
    if (miembros.length >= limites.miembros) {
      throw new Error(`Has alcanzado el límite de ${limites.miembros} miembros en tu plan. Actualiza tu plan para agregar más.`);
    }

    await createEmpleado(data, negocioUid, user.nombreNegocio);
    // onSnapshot actualizará la lista automáticamente
  };

  const remover = async (uid: string): Promise<void> => {
    await desactivarEmpleado(uid);
    // onSnapshot actualizará la lista automáticamente
  };

  return { miembros, loading, crearEmpleado, remover };
};
