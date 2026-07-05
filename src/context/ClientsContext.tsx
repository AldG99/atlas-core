import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { Client, ClientFormData } from '../types/Client';
import {
  getClients,
  createClient,
  updateClient,
  deleteClient,
  toggleClientFavorite,
} from '../services/clientService';
import { getPlanLimits, checkPlanLimit } from '../constants/planLimits';

interface ClientsContextType {
  clients: Client[];
  loading: boolean;
  error: string | null;
  addClient: (data: ClientFormData) => Promise<Client>;
  editClient: (id: string, data: Partial<ClientFormData>) => Promise<void>;
  removeClient: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  fetchClients: () => Promise<void>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const ClientsContext = createContext<ClientsContextType | null>(null);

export const ClientsProvider = ({ children }: { children: ReactNode }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, businessUid } = useAuth();

  const fetchClients = useCallback(async () => {
    if (!user || !businessUid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getClients(businessUid);
      setClients(data);
    } catch {
      setError('Error al cargar los clientes');
    } finally {
      setLoading(false);
    }
  }, [user, businessUid]);

  useEffect(() => {
    if (!user || !businessUid) {
      setClients([]);
      setLoading(false);
      return;
    }
    fetchClients();
  }, [user, businessUid, fetchClients]);

  const addClient = async (data: ClientFormData): Promise<Client> => {
    if (!user || !businessUid) throw new Error('Usuario no autenticado');
    const limits = getPlanLimits(user.plan);
    checkPlanLimit(clients.length, limits.clients, 'clientes');
    const id = await createClient(data, businessUid);
    const newClient: Client = {
      id,
      profilePhoto: data.profilePhoto || '',
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      phoneCountryCode: data.phoneCountryCode,
      email: data.email || '',
      street: data.street,
      exteriorNumber: data.exteriorNumber,
      interiorNumber: data.interiorNumber || '',
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state || '',
      postalCode: data.postalCode,
      country: data.country || '',
      reference: data.reference || '',
      userId: businessUid,
      createdAt: new Date(),
    };
    setClients((prev) => [...prev, newClient].sort((a, b) => a.firstName.localeCompare(b.firstName)));
    return newClient;
  };

  const editClient = async (id: string, data: Partial<ClientFormData>) => {
    const snapshot = clients;
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
    try {
      await updateClient(id, data);
    } catch (err) {
      setClients(snapshot);
      throw err;
    }
  };

  const removeClient = async (id: string) => {
    const snapshot = clients;
    setClients((prev) => prev.filter((c) => c.id !== id));
    try {
      await deleteClient(id);
    } catch (err) {
      setClients(snapshot);
      throw err;
    }
  };

  const toggleFavorite = async (id: string) => {
    const client = clients.find((c) => c.id === id);
    if (!client) return;
    const newValue = !client.favorite;
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, favorite: newValue } : c)));
    try {
      await toggleClientFavorite(id, newValue);
    } catch {
      setClients((prev) => prev.map((c) => (c.id === id ? { ...c, favorite: !newValue } : c)));
    }
  };

  return (
    <ClientsContext.Provider value={{
      clients, loading, error,
      addClient, editClient, removeClient, toggleFavorite, fetchClients,
    }}>
      {children}
    </ClientsContext.Provider>
  );
};
