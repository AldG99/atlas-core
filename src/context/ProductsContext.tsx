import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { Product, ProductFormData } from '../types/Product';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../services/productService';
import { getPlanLimits, checkPlanLimit } from '../constants/planLimits';
import i18n from '../i18n';

interface ProductsContextType {
  products: Product[];
  loading: boolean;
  error: string | null;
  addProduct: (data: ProductFormData) => Promise<Product | undefined>;
  editProduct: (id: string, data: Partial<ProductFormData>) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;
  fetchProducts: () => Promise<void>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const ProductsContext = createContext<ProductsContextType | null>(null);

export const ProductsProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, businessUid } = useAuth();

  const fetchProducts = useCallback(async () => {
    if (!user || !businessUid) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getProducts(businessUid);
      setProducts(data);
    } catch {
      setError('Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  }, [user, businessUid]);

  useEffect(() => {
    if (!user || !businessUid) {
      setProducts([]);
      setLoading(false);
      return;
    }
    fetchProducts();
  }, [user, businessUid, fetchProducts]);

  const addProduct = async (data: ProductFormData): Promise<Product | undefined> => {
    if (!user || !businessUid) return;
    const limits = getPlanLimits(user.plan);
    checkPlanLimit(products.length, limits.products, i18n.t('common.resources.products'));
    const id = await createProduct(data, businessUid);
    const newProduct = { id, ...data, userId: businessUid, createdAt: new Date() } as Product;
    setProducts((prev) => [...prev, newProduct].sort((a, b) => a.name.localeCompare(b.name)));
    return newProduct;
  };

  const editProduct = async (id: string, data: Partial<ProductFormData>) => {
    const snapshot = products;
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } as typeof p : p)));
    try {
      await updateProduct(id, data);
    } catch (err) {
      setProducts(snapshot);
      throw err;
    }
  };

  const removeProduct = async (id: string) => {
    const snapshot = products;
    setProducts((prev) => prev.filter((p) => p.id !== id));
    try {
      await deleteProduct(id);
    } catch (err) {
      setProducts(snapshot);
      throw err;
    }
  };

  return (
    <ProductsContext.Provider value={{
      products, loading, error,
      addProduct, editProduct, removeProduct, fetchProducts,
    }}>
      {children}
    </ProductsContext.Provider>
  );
};
