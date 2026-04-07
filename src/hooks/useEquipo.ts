import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import type { User } from '../types/User';
import {
  suscribirMiembros,
  createMiembro,
  desactivarMiembro,
  actualizarMiembro,
  actualizarContrasenaMiembro,
  type MiembroFormData,
} from '../services/equipoService';
import { getPlanLimits } from '../constants/planLimits';

export const useEquipo = () => {
  const { user, role, negocioUid } = useAuth();
  const [miembros, setMiembros] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || role !== 'admin' || !negocioUid) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const unsub = suscribirMiembros(negocioUid, (data) => {
      setMiembros(data);
      setLoading(false);
    });
    return unsub;
  }, [user, role, negocioUid]);

  const crearMiembro = async (data: MiembroFormData): Promise<void> => {
    if (!user || !negocioUid) throw new Error('No autenticado');

    const limites = getPlanLimits(user.plan);
    if (limites.miembros === 0) {
      throw new Error('Tu plan no incluye miembros del equipo. Actualiza tu plan para agregar colaboradores.');
    }
    if (miembros.length >= limites.miembros) {
      throw new Error(`Has alcanzado el límite de ${limites.miembros} miembros en tu plan. Actualiza tu plan para agregar más.`);
    }

    await createMiembro(data, negocioUid, user.nombreNegocio);
    // onSnapshot actualizará la lista automáticamente
  };

  const remover = async (uid: string): Promise<void> => {
    await desactivarMiembro(uid);
  };

  const actualizar = async (
    uid: string,
    data: Partial<Pick<User, 'nombre' | 'apellido' | 'telefono' | 'telefonoCodigoPais' | 'fechaNacimiento'>>,
  ): Promise<void> => {
    await actualizarMiembro(uid, data);
  };

  const actualizarContrasena = async (uid: string, nuevaContrasena: string): Promise<void> => {
    await actualizarContrasenaMiembro(uid, nuevaContrasena);
  };

  return { miembros, loading, crearMiembro, remover, actualizar, actualizarContrasena };
};
