import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { Producto, ProductoFormData } from '../types/Producto';
import {
  getProductos,
  createProducto,
  updateProducto,
  deleteProducto,
} from '../services/productoService';
import { getPlanLimits, checkPlanLimit } from '../constants/planLimits';

interface ProductosContextType {
  productos: Producto[];
  loading: boolean;
  error: string | null;
  addProducto: (data: ProductoFormData) => Promise<Producto | undefined>;
  editProducto: (id: string, data: Partial<ProductoFormData>) => Promise<void>;
  removeProducto: (id: string) => Promise<void>;
  fetchProductos: () => Promise<void>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const ProductosContext = createContext<ProductosContextType | null>(null);

export const ProductosProvider = ({ children }: { children: ReactNode }) => {
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
    if (!user || !negocioUid) {
      setProductos([]);
      setLoading(false);
      return;
    }
    fetchProductos();
  }, [user, negocioUid, fetchProductos]);

  const addProducto = async (data: ProductoFormData): Promise<Producto | undefined> => {
    if (!user || !negocioUid) return;
    const limites = getPlanLimits(user.plan);
    checkPlanLimit(productos.length, limites.productos, 'productos');
    const id = await createProducto(data, negocioUid);
    const newProducto = { id, ...data, userId: negocioUid, fechaCreacion: new Date() } as Producto;
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

  return (
    <ProductosContext.Provider value={{
      productos, loading, error,
      addProducto, editProducto, removeProducto, fetchProductos,
    }}>
      {children}
    </ProductosContext.Provider>
  );
};
