import { createContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import type { QueryDocumentSnapshot } from 'firebase/firestore';
import type { Pedido, PedidoFormData, PedidoStatus, CreadoPor } from '../types/Pedido';
import type { User } from '../types/User';
import { getPlanLimits, checkPlanLimit } from '../constants/planLimits';
import {
  getPedidos,
  getPedidosByStatus,
  getArchivedPedidos,
  createPedido,
  updatePedidoStatus,
  deletePedido,
  archivePedido,
  unarchivePedido,
  addAbono,
  countPedidosMes,
  subscribeToPedidos,
} from '../services/pedidoService';
import { useAuth } from '../hooks/useAuth';

export const buildCreadoPor = (user: User): CreadoPor => {
  const base = user.nombre
    ? `${user.nombre}${user.apellido ? ' ' + user.apellido : ''}`
    : user.nombreNegocio;
  const sufijo = user.role === 'miembro'
    ? (user.numeroMiembro ? ` #${user.numeroMiembro}` : '')
    : ' (Adm.)';
  return { uid: user.uid, nombre: `${base}${sufijo}` };
};

interface PedidosContextType {
  pedidos: Pedido[];
  allPedidos: Pedido[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  showArchived: boolean;
  fetchPedidos: () => Promise<void>;
  fetchArchived: () => Promise<void>;
  fetchByStatus: (estado: PedidoStatus) => Promise<void>;
  loadMore: () => Promise<void>;
  addPedido: (data: PedidoFormData) => Promise<Pedido | undefined>;
  changeStatus: (pedidoId: string, estado: PedidoStatus) => Promise<void>;
  removePedido: (pedidoId: string) => Promise<void>;
  archive: (pedidoId: string) => Promise<void>;
  restore: (pedidoId: string) => Promise<void>;
  registrarAbono: (pedidoId: string, monto: number, productoIndex?: number) => Promise<void>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const PedidosContext = createContext<PedidosContextType | null>(null);

export const PedidosProvider = ({ children }: { children: ReactNode }) => {
  const { user, negocioUid } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [allPedidos, setAllPedidos] = useState<Pedido[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const lastDocRef = useRef<QueryDocumentSnapshot | null>(null);
  const allPedidosRef = useRef<Pedido[]>([]);
  const isLiveViewRef = useRef(true);
  const hasMoreFromSnapshotRef = useRef(false);

  useEffect(() => {
    if (!user || !negocioUid) {
      setPedidos([]);
      setAllPedidos([]);
      allPedidosRef.current = [];
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToPedidos(
      negocioUid,
      ({ pedidos: data, hasMore: more, lastDoc: doc }) => {
        const active = data.filter((p) => !p.archivado);
        setAllPedidos(active);
        allPedidosRef.current = active;
        lastDocRef.current = doc;
        hasMoreFromSnapshotRef.current = more;
        if (isLiveViewRef.current) {
          setPedidos(active);
          setHasMore(more);
          setShowArchived(false);
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user, negocioUid]);

  const fetchPedidos = useCallback(async () => {
    if (!user || !negocioUid) return;
    isLiveViewRef.current = true;
    const active = allPedidosRef.current;
    setPedidos(active);
    setAllPedidos(active);
    setHasMore(hasMoreFromSnapshotRef.current);
    setShowArchived(false);
    setError(null);
  }, [user, negocioUid]);

  const loadMore = useCallback(async () => {
    if (!user || !negocioUid || !hasMore || !lastDocRef.current) return;
    try {
      setLoading(true);
      setError(null);
      if (showArchived) {
        const result = await getArchivedPedidos(negocioUid, lastDocRef.current);
        setPedidos((prev) => [...prev, ...result.pedidos]);
        lastDocRef.current = result.lastDoc;
        setHasMore(result.hasMore);
      } else {
        const result = await getPedidos(negocioUid, lastDocRef.current);
        const active = result.pedidos.filter((p) => !p.archivado);
        setPedidos((prev) => [...prev, ...active]);
        setAllPedidos((prev) => {
          const updated = [...prev, ...active];
          allPedidosRef.current = updated;
          return updated;
        });
        lastDocRef.current = result.lastDoc;
        setHasMore(result.hasMore);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar más pedidos');
    } finally {
      setLoading(false);
    }
  }, [user, negocioUid, hasMore, showArchived]);

  const fetchArchived = useCallback(async () => {
    if (!user || !negocioUid) return;
    try {
      setLoading(true);
      setError(null);
      isLiveViewRef.current = false;
      const result = await getArchivedPedidos(negocioUid);
      setPedidos(result.pedidos);
      setShowArchived(true);
      setHasMore(result.hasMore);
      lastDocRef.current = result.lastDoc;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar pedidos archivados');
    } finally {
      setLoading(false);
    }
  }, [user, negocioUid]);

  const fetchByStatus = useCallback(async (estado: PedidoStatus) => {
    if (!user || !negocioUid) return;
    try {
      setLoading(true);
      setError(null);
      isLiveViewRef.current = false;
      const data = await getPedidosByStatus(negocioUid, estado);
      setPedidos(data.filter((p) => !p.archivado));
      setHasMore(false);
      lastDocRef.current = null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  }, [user, negocioUid]);

  const addPedido = useCallback(async (data: PedidoFormData) => {
    if (!user || !negocioUid) return;
    try {
      setError(null);
      const limites = getPlanLimits(user.plan);
      const pedidosEsteMes = await countPedidosMes(negocioUid);
      checkPlanLimit(pedidosEsteMes, limites.pedidosMes, 'pedidos este mes');
      const newPedido = await createPedido(data, negocioUid, buildCreadoPor(user));
      setPedidos((prev) => [newPedido, ...prev]);
      setAllPedidos((prev) => [newPedido, ...prev]);
      return newPedido;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear pedido');
      throw err;
    }
  }, [user, negocioUid]);

  const changeStatus = useCallback(async (pedidoId: string, estado: PedidoStatus) => {
    try {
      setError(null);
      await updatePedidoStatus(pedidoId, estado);
      const updateFn = (prev: Pedido[]) =>
        prev.map((p) => {
          if (p.id !== pedidoId) return p;
          const updated = { ...p, estado };
          if (estado === 'entregado') updated.fechaEntrega = new Date();
          return updated;
        });
      setPedidos(updateFn);
      setAllPedidos(updateFn);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar estado');
      throw err;
    }
  }, []);

  const removePedido = useCallback(async (pedidoId: string) => {
    try {
      setError(null);
      await deletePedido(pedidoId);
      const filterFn = (prev: Pedido[]) => prev.filter((p) => p.id !== pedidoId);
      setPedidos(filterFn);
      setAllPedidos(filterFn);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar pedido');
      throw err;
    }
  }, []);

  const archive = useCallback(async (pedidoId: string) => {
    try {
      setError(null);
      await archivePedido(pedidoId);
      const filterFn = (prev: Pedido[]) => prev.filter((p) => p.id !== pedidoId);
      setPedidos(filterFn);
      setAllPedidos(filterFn);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al archivar pedido');
      throw err;
    }
  }, []);

  const restore = useCallback(async (pedidoId: string) => {
    try {
      setError(null);
      await unarchivePedido(pedidoId);
      setPedidos((prev) => prev.filter((p) => p.id !== pedidoId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al restaurar pedido');
      throw err;
    }
  }, []);

  const registrarAbono = useCallback(async (pedidoId: string, monto: number, productoIndex?: number) => {
    try {
      setError(null);
      const { abono: nuevoAbono, nuevoEstado } = await addAbono(
        pedidoId,
        monto,
        productoIndex,
        user ? buildCreadoPor(user) : undefined
      );
      const updateFn = (prev: Pedido[]) =>
        prev.map((p) => {
          if (p.id !== pedidoId) return p;
          return { ...p, abonos: [...(p.abonos || []), nuevoAbono], estado: nuevoEstado ?? p.estado };
        });
      setPedidos(updateFn);
      setAllPedidos(updateFn);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar abono');
      throw err;
    }
  }, [user]);

  return (
    <PedidosContext.Provider value={{
      pedidos, allPedidos, loading, error, hasMore, showArchived,
      fetchPedidos, fetchArchived, fetchByStatus, loadMore,
      addPedido, changeStatus, removePedido, archive, restore, registrarAbono,
    }}>
      {children}
    </PedidosContext.Provider>
  );
};
