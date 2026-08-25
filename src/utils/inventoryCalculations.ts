import type { Product } from '../types/Product';
import { DEFAULT_LOW_STOCK_THRESHOLD } from '../constants/stock';
import type { InventoryStats } from '../types/Inventory';

export type StockStatus = 'out' | 'low' | 'ok';

export const getStockStatus = (p: Product): StockStatus => {
  const stock = p.stock ?? 0;
  const minStock = p.minStock ?? DEFAULT_LOW_STOCK_THRESHOLD;
  if (stock === 0) return 'out';
  if (stock <= minStock) return 'low';
  return 'ok';
};

// Cuánto pedir para llegar al máximo configurado. Sin maxStock no hay
// referencia para sugerir una cantidad.
export const suggestRestock = (p: Product): number | undefined =>
  p.maxStock !== undefined ? Math.max(0, p.maxStock - (p.stock ?? 0)) : undefined;

export const calculateInventoryStats = (products: Product[]): InventoryStats => {
  const tracked = products.filter((p) => p.trackStock);
  const toItem = (p: Product) => ({
    id: p.id, name: p.name, sku: p.sku, stock: p.stock ?? 0,
    minStock: p.minStock ?? DEFAULT_LOW_STOCK_THRESHOLD,
    suggestedRestock: suggestRestock(p),
  });
  const outOfStock = tracked.filter((p) => getStockStatus(p) === 'out').map(toItem);
  const lowStock = tracked.filter((p) => getStockStatus(p) === 'low').map(toItem);
  const totalValue = tracked.reduce((sum, p) => sum + (p.stock ?? 0) * p.costPrice, 0);

  return { totalTracked: tracked.length, totalValue, outOfStock, lowStock };
};
