import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { Etiqueta } from '../types/Producto';
import {
  getEtiquetas,
  createEtiqueta,
  deleteEtiqueta,
} from '../services/etiquetaService';
import { getPlanLimits, checkPlanLimit } from '../constants/planLimits';

interface EtiquetasContextType {
  etiquetas: Etiqueta[];
  loading: boolean;
  error: string | null;
  addEtiqueta: (nombre: string, color: string, icono: string) => Promise<Etiqueta | undefined>;
  removeEtiqueta: (id: string) => Promise<void>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const EtiquetasContext = createContext<EtiquetasContextType | null>(null);

export const EtiquetasProvider = ({ children }: { children: ReactNode }) => {
  const [etiquetas, setEtiquetas] = useState<Etiqueta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, negocioUid } = useAuth();

  const fetchEtiquetas = useCallback(async () => {
    if (!user || !negocioUid) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getEtiquetas(negocioUid);
      setEtiquetas(data);
    } catch {
      setError('Error al cargar las etiquetas');
    } finally {
      setLoading(false);
    }
  }, [user, negocioUid]);

  useEffect(() => {
    if (!user || !negocioUid) {
      setEtiquetas([]);
      setLoading(false);
      return;
    }
    fetchEtiquetas();
  }, [user, negocioUid, fetchEtiquetas]);

  const addEtiqueta = async (nombre: string, color: string, icono: string) => {
    if (!user || !negocioUid) return;
    const limites = getPlanLimits(user.plan);
    checkPlanLimit(etiquetas.length, limites.etiquetas, 'etiquetas');
    const nueva = await createEtiqueta(nombre, color, icono, negocioUid);
    setEtiquetas((prev) => [...prev, nueva]);
    return nueva;
  };

  const removeEtiqueta = async (id: string) => {
    await deleteEtiqueta(id);
    setEtiquetas((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <EtiquetasContext.Provider value={{ etiquetas, loading, error, addEtiqueta, removeEtiqueta }}>
      {children}
    </EtiquetasContext.Provider>
  );
};
