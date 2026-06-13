import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import type { Producto, ProductoFormData } from '../types/Producto';
import {
  getProductos,
  createProducto,
  updateProducto,
  deleteProducto
} from '../services/productoService';
import { getPlanLimits, checkPlanLimit } from '../constants/planLimits';

export const useProductos = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, negocioUid } = useAuth();

  const fetchProductos = useCallback(async () => {
    if (!user || !negocioUid) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getProductos(negocioUid);
      setProductos(data);
    } catch {
      setError('Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  }, [user, negocioUid]);

  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

  const addProducto = async (data: ProductoFormData): Promise<Producto | undefined> => {
    if (!user || !negocioUid) return;

    const limites = getPlanLimits(user.plan);
    checkPlanLimit(productos.length, limites.productos, 'productos');

    const id = await createProducto(data, negocioUid);
    const newProducto = {
      id,
      ...data,
      userId: negocioUid!,
      fechaCreacion: new Date()
    } as Producto;
    setProductos((prev) => [...prev, newProducto].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    return newProducto;
  };

  const editProducto = async (id: string, data: Partial<ProductoFormData>) => {
    const snapshot = productos;
    setProductos((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } as typeof p : p)));
    try {
      await updateProducto(id, data);
    } catch (err) {
      setProductos(snapshot);
      throw err;
    }
  };

  const removeProducto = async (id: string) => {
    const snapshot = productos;
    setProductos((prev) => prev.filter((p) => p.id !== id));
    try {
      await deleteProducto(id);
    } catch (err) {
      setProductos(snapshot);
      throw err;
    }
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
