import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import type { Cliente, ClienteFormData } from '../types/Cliente';
import {
  getClientes,
  createCliente,
  updateCliente,
  deleteCliente
} from '../services/clienteService';

export const useClientes = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchClientes = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getClientes(user.uid);
      setClientes(data);
    } catch {
      setError('Error al cargar los clientes');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  const addCliente = async (data: ClienteFormData) => {
    if (!user) return;

    const id = await createCliente(data, user.uid);
    const newCliente: Cliente = {
      id,
      ...data,
      userId: user.uid,
      fechaCreacion: new Date()
    };
    setClientes((prev) => [...prev, newCliente].sort((a, b) => a.nombre.localeCompare(b.nombre)));
  };

  const editCliente = async (id: string, data: Partial<ClienteFormData>) => {
    await updateCliente(id, data);
    setClientes((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...data } : c))
    );
  };

  const removeCliente = async (id: string) => {
    await deleteCliente(id);
    setClientes((prev) => prev.filter((c) => c.id !== id));
  };

  return {
    clientes,
    loading,
    error,
    addCliente,
    editCliente,
    removeCliente,
    fetchClientes
  };
};
