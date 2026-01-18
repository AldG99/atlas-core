import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import type { Producto, ProductoFormData } from '../types/Producto';
import {
  getProductos,
  createProducto,
  updateProducto,
  deleteProducto
} from '../services/productoService';

export const useProductos = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchProductos = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getProductos(user.uid);
      setProductos(data);
    } catch {
      setError('Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

  const addProducto = async (data: ProductoFormData) => {
    if (!user) return;

    const id = await createProducto(data, user.uid);
    const newProducto: Producto = {
      id,
      ...data,
      userId: user.uid,
      fechaCreacion: new Date()
    };
    setProductos((prev) => [...prev, newProducto].sort((a, b) => a.nombre.localeCompare(b.nombre)));
  };

  const editProducto = async (id: string, data: Partial<ProductoFormData>) => {
    await updateProducto(id, data);
    setProductos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...data } : p))
    );
  };

  const removeProducto = async (id: string) => {
    await deleteProducto(id);
    setProductos((prev) => prev.filter((p) => p.id !== id));
  };

  return {
    productos,
    loading,
    error,
    addProducto,
    editProducto,
    removeProducto,
    fetchProductos
  };
};
