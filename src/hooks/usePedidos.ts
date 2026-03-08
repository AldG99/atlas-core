import { useState, useEffect, useCallback, useRef } from 'react';
import type { QueryDocumentSnapshot } from 'firebase/firestore';
import type { Pedido, PedidoFormData, PedidoStatus } from '../types/Pedido';
import {
  getPedidos,
  getPedidosByStatus,
  getArchivedPedidos,
  createPedido,
  updatePedidoStatus,
  deletePedido,
  archivePedido,
  unarchivePedido,
  addAbono
} from '../services/pedidoService';
import { useAuth } from './useAuth';

export const usePedidos = () => {
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [allPedidos, setAllPedidos] = useState<Pedido[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const lastDocRef = useRef<QueryDocumentSnapshot | null>(null);

  const fetchPedidos = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const result = await getPedidos(user.uid);
      const active = result.pedidos.filter((p) => !p.archivado);
      setPedidos(active);
      setAllPedidos(active);
      lastDocRef.current = result.lastDoc;
      setHasMore(result.hasMore);
      setShowArchived(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadMore = useCallback(async () => {
    if (!user || !hasMore || !lastDocRef.current) return;

    try {
      setLoading(true);
      setError(null);
      const result = await getPedidos(user.uid, lastDocRef.current);
      const active = result.pedidos.filter((p) => !p.archivado);
      setPedidos((prev) => [...prev, ...active]);
      setAllPedidos((prev) => [...prev, ...active]);
      lastDocRef.current = result.lastDoc;
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar más pedidos');
    } finally {
      setLoading(false);
    }
  }, [user, hasMore]);

  const fetchArchived = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getArchivedPedidos(user.uid);
      setPedidos(data);
      setShowArchived(true);
      setHasMore(false);
      lastDocRef.current = null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar pedidos archivados');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchByStatus = useCallback(async (estado: PedidoStatus) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getPedidosByStatus(user.uid, estado);
      setPedidos(data.filter((p) => !p.archivado));
      setHasMore(false);
      lastDocRef.current = null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addPedido = useCallback(async (data: PedidoFormData) => {
    if (!user) return;

    try {
      setError(null);
      const newPedido = await createPedido(data, user.uid);
      setPedidos((prev) => [newPedido, ...prev]);
      setAllPedidos((prev) => [newPedido, ...prev]);
      return newPedido;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear pedido');
      throw err;
    }
  }, [user]);

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
      const pedido = pedidos.find((p) => p.id === pedidoId);
      const opts = pedido
        ? {
            total: pedido.total,
            estadoActual: pedido.estado,
            pagadoHastaAhora: (pedido.abonos || []).reduce((s, a) => s + a.monto, 0)
          }
        : undefined;

      const { abono: nuevoAbono, nuevoEstado } = await addAbono(pedidoId, monto, productoIndex, opts);

      const updateFn = (prev: Pedido[]) =>
        prev.map((p) => {
          if (p.id !== pedidoId) return p;
          const updatedAbonos = [...(p.abonos || []), nuevoAbono];
          return { ...p, abonos: updatedAbonos, estado: nuevoEstado ?? p.estado };
        });
      setPedidos(updateFn);
      setAllPedidos(updateFn);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar abono');
      throw err;
    }
  }, [pedidos]);

  useEffect(() => {
    fetchPedidos();
  }, [fetchPedidos]);

  return {
    pedidos,
    allPedidos,
    loading,
    error,
    hasMore,
    showArchived,
    fetchPedidos,
    fetchArchived,
    fetchByStatus,
    loadMore,
    addPedido,
    changeStatus,
    removePedido,
    archive,
    restore,
    registrarAbono
  };
};
