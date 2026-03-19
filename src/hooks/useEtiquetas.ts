import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import type { Etiqueta } from '../types/Producto';
import {
  getEtiquetas,
  createEtiqueta,
  deleteEtiqueta,
} from '../services/etiquetaService';
import { getPlanLimits } from '../constants/planLimits';

export const useEtiquetas = () => {
  const [etiquetas, setEtiquetas] = useState<Etiqueta[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, negocioUid } = useAuth();

  const fetchEtiquetas = useCallback(async () => {
    if (!user || !negocioUid) return;

    setLoading(true);
    try {
      const data = await getEtiquetas(negocioUid);
      setEtiquetas(data);
    } catch (err) {
      console.error('Error al cargar etiquetas:', err);
    } finally {
      setLoading(false);
    }
  }, [user, negocioUid]);

  useEffect(() => {
    fetchEtiquetas();
  }, [fetchEtiquetas]);

  const addEtiqueta = async (nombre: string, color: string, icono: string) => {
    if (!user || !negocioUid) return;

    const limites = getPlanLimits(user.plan);
    if (etiquetas.length >= limites.etiquetas) {
      throw new Error(`Has alcanzado el límite de ${limites.etiquetas} etiquetas en tu plan. Actualiza tu plan para agregar más.`);
    }

    const nueva = await createEtiqueta(nombre, color, icono, negocioUid);
    setEtiquetas((prev) => [...prev, nueva]);
    return nueva;
  };

  const removeEtiqueta = async (id: string) => {
    await deleteEtiqueta(id);
    setEtiquetas((prev) => prev.filter((e) => e.id !== id));
  };

  return { etiquetas, loading, addEtiqueta, removeEtiqueta };
};
