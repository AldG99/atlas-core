import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import type { Etiqueta } from '../types/Producto';
import {
  getEtiquetas,
  createEtiqueta,
  deleteEtiqueta,
} from '../services/etiquetaService';

export const useEtiquetas = () => {
  const [etiquetas, setEtiquetas] = useState<Etiqueta[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchEtiquetas = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const data = await getEtiquetas(user.uid);
      setEtiquetas(data);
    } catch (err) {
      console.error('Error al cargar etiquetas:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEtiquetas();
  }, [fetchEtiquetas]);

  const addEtiqueta = async (nombre: string, color: string, icono: string) => {
    if (!user) return;

    const nueva = await createEtiqueta(nombre, color, icono, user.uid);
    setEtiquetas((prev) => [...prev, nueva]);
    return nueva;
  };

  const removeEtiqueta = async (id: string) => {
    await deleteEtiqueta(id);
    setEtiquetas((prev) => prev.filter((e) => e.id !== id));
  };

  return { etiquetas, loading, addEtiqueta, removeEtiqueta };
};
