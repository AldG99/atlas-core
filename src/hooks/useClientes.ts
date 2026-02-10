import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import type { Cliente, ClienteFormData } from '../types/Cliente';
import {
  getClientes,
  createCliente,
  updateCliente,
  deleteCliente,
  toggleClienteFavorito
} from '../services/clienteService';

export const useClientes = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchClientes = useCallback(async () => {
    console.log('useClientes - fetchClientes called, user:', user?.uid);
    if (!user) {
      console.log('useClientes - No user, skipping fetch');
      setLoading(false);
      return;
    }

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

  const addCliente = async (data: ClienteFormData): Promise<Cliente> => {
    if (!user) throw new Error('Usuario no autenticado');

    const id = await createCliente(data, user.uid);
    const newCliente: Cliente = {
      id,
      fotoPerfil: data.fotoPerfil || '',
      nombre: data.nombre,
      apellido: data.apellido,
      telefono: data.telefono,
      correo: data.correo || '',
      calle: data.calle,
      numeroExterior: data.numeroExterior,
      colonia: data.colonia,
      ciudad: data.ciudad,
      codigoPostal: data.codigoPostal,
      referencia: data.referencia || '',
      numeroVisible: data.numeroVisible,
      horarioEntrega: data.horarioEntrega || '',
      notas: data.notas || '',
      userId: user.uid,
      fechaCreacion: new Date()
    };
    setClientes((prev) => [...prev, newCliente].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    return newCliente;
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

  const toggleFavorito = async (id: string) => {
    const cliente = clientes.find((c) => c.id === id);
    if (!cliente) return;
    const nuevoValor = !cliente.favorito;
    await toggleClienteFavorito(id, nuevoValor);
    setClientes((prev) =>
      prev.map((c) => (c.id === id ? { ...c, favorito: nuevoValor } : c))
    );
  };

  return {
    clientes,
    loading,
    error,
    addCliente,
    editCliente,
    removeCliente,
    toggleFavorito,
    fetchClientes
  };
};
