import { useState, useEffect, useCallback } from 'react';
import type { Pedido, PedidoFormData, PedidoStatus } from '../types/Pedido';
import {
  getPedidos,
  getPedidosByStatus,
  getArchivedPedidos,
  createPedido,
  updatePedido,
  updatePedidoStatus,
  deletePedido,
  archivePedido,
  unarchivePedido
} from '../services/pedidoService';
import { useAuth } from './useAuth';

export const usePedidos = () => {
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPedidos = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getPedidos(user.uid);
      // Filter out archived by default
      setPedidos(data.filter((p) => !p.archivado));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchArchived = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getArchivedPedidos(user.uid);
      setPedidos(data);
      setShowArchived(true);
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
      setPedidos(data);
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
      return newPedido;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear pedido');
      throw err;
    }
  }, [user]);

  const editPedido = useCallback(async (pedidoId: string, data: Partial<PedidoFormData>) => {
    try {
      setError(null);
      await updatePedido(pedidoId, data);
      setPedidos((prev) =>
        prev.map((p) => (p.id === pedidoId ? { ...p, ...data } : p))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar pedido');
      throw err;
    }
  }, []);

  const changeStatus = useCallback(async (pedidoId: string, estado: PedidoStatus) => {
    try {
      setError(null);
      await updatePedidoStatus(pedidoId, estado);
      setPedidos((prev) =>
        prev.map((p) => (p.id === pedidoId ? { ...p, estado } : p))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar estado');
      throw err;
    }
  }, []);

  const removePedido = useCallback(async (pedidoId: string) => {
    try {
      setError(null);
      await deletePedido(pedidoId);
      setPedidos((prev) => prev.filter((p) => p.id !== pedidoId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar pedido');
      throw err;
    }
  }, []);

  const archive = useCallback(async (pedidoId: string) => {
    try {
      setError(null);
      await archivePedido(pedidoId);
      setPedidos((prev) => prev.filter((p) => p.id !== pedidoId));
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

  useEffect(() => {
    fetchPedidos();
  }, [fetchPedidos]);

  return {
    pedidos,
    loading,
    error,
    showArchived,
    fetchPedidos,
    fetchArchived,
    fetchByStatus,
    addPedido,
    editPedido,
    changeStatus,
    removePedido,
    archive,
    restore
  };
};
