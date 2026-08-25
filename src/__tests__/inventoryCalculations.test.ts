import { describe, it, expect } from 'vitest';
import { calculateInventoryStats, getStockStatus } from '../utils/inventoryCalculations';
import type { Product } from '../types/Product';

const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 'prod1',
  sku: 'P001',
  name: 'Producto',
  price: 50,
  costPrice: 30,
  trackStock: true,
  stock: 10,
  labels: [],
  createdAt: new Date('2024-01-01'),
  userId: 'user1',
  ...overrides,
});

describe('calculateInventoryStats', () => {
  it('correctly classifies outOfStock and lowStock', () => {
    const products = [
      makeProduct({ id: '1', stock: 0, trackStock: true }),
      makeProduct({ id: '2', stock: 3, trackStock: true }),
      makeProduct({ id: '3', stock: 10, trackStock: true }),
      makeProduct({ id: '4', stock: 0, trackStock: false }), // sin control → ignore
    ];
    const stats = calculateInventoryStats(products);
    expect(stats.totalTracked).toBe(3);
    expect(stats.outOfStock).toHaveLength(1);
    expect(stats.outOfStock[0].id).toBe('1');
    expect(stats.lowStock).toHaveLength(1);
    expect(stats.lowStock[0].id).toBe('2');
  });

  it('returns empty stats when no products with stock control', () => {
    const stats = calculateInventoryStats([]);
    expect(stats.totalTracked).toBe(0);
    expect(stats.outOfStock).toHaveLength(0);
    expect(stats.lowStock).toHaveLength(0);
  });

  it('uses a product\'s own minStock instead of the default threshold', () => {
    const products = [
      // Sin minStock propio → cae al umbral por defecto (5): 4 es bajo, 8 no.
      makeProduct({ id: '1', stock: 4, trackStock: true }),
      makeProduct({ id: '2', stock: 8, trackStock: true }),
      // Con minStock propio → se usa ese valor en vez del default.
      makeProduct({ id: '3', stock: 8, trackStock: true, minStock: 10 }),
      makeProduct({ id: '4', stock: 2, trackStock: true, minStock: 1 }),
    ];
    const stats = calculateInventoryStats(products);
    expect(stats.lowStock.map((p) => p.id)).toEqual(['1', '3']);
    expect(stats.lowStock.find((p) => p.id === '1')?.minStock).toBe(5);
    expect(stats.lowStock.find((p) => p.id === '3')?.minStock).toBe(10);
  });

  it('suggests a restock quantity up to maxStock, only when maxStock is set', () => {
    const products = [
      makeProduct({ id: '1', stock: 2, trackStock: true, maxStock: 20 }),
      makeProduct({ id: '2', stock: 0, trackStock: true, maxStock: 15 }),
      makeProduct({ id: '3', stock: 3, trackStock: true }), // sin maxStock → sin sugerencia
    ];
    const stats = calculateInventoryStats(products);
    expect(stats.lowStock.find((p) => p.id === '1')?.suggestedRestock).toBe(18);
    expect(stats.outOfStock.find((p) => p.id === '2')?.suggestedRestock).toBe(15);
    expect(stats.lowStock.find((p) => p.id === '3')?.suggestedRestock).toBeUndefined();
  });

  it('computes totalValue as stock × costPrice, only for tracked products', () => {
    const products = [
      makeProduct({ id: '1', stock: 5, costPrice: 30, trackStock: true }),
      makeProduct({ id: '2', stock: 2, costPrice: 100, trackStock: true }),
      makeProduct({ id: '3', stock: 999, costPrice: 50, trackStock: false }), // sin control → ignore
    ];
    const stats = calculateInventoryStats(products);
    expect(stats.totalValue).toBe(5 * 30 + 2 * 100);
  });

  it('totalValue is 0 when there are no tracked products', () => {
    const stats = calculateInventoryStats([makeProduct({ trackStock: false })]);
    expect(stats.totalValue).toBe(0);
  });
});

describe('getStockStatus', () => {
  it('returns "out" when stock is 0', () => {
    expect(getStockStatus(makeProduct({ stock: 0 }))).toBe('out');
  });

  it('returns "low" when stock is above 0 and at or below minStock', () => {
    expect(getStockStatus(makeProduct({ stock: 5, minStock: 5 }))).toBe('low');
    expect(getStockStatus(makeProduct({ stock: 3, minStock: 5 }))).toBe('low');
  });

  it('falls back to DEFAULT_LOW_STOCK_THRESHOLD when minStock is not set', () => {
    expect(getStockStatus(makeProduct({ stock: 5, minStock: undefined }))).toBe('low');
    expect(getStockStatus(makeProduct({ stock: 6, minStock: undefined }))).toBe('ok');
  });

  it('returns "ok" when stock is above minStock', () => {
    expect(getStockStatus(makeProduct({ stock: 6, minStock: 5 }))).toBe('ok');
  });
});
