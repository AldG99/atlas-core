import { describe, it, expect } from 'vitest';
import {
  getDateRange,
  filterOrdersByDate,
  calculateKPIs,
  calculateStatusBreakdown,
  calculateTopClients,
  calculateTopProducts,
  calculateInventoryStats,
  calculateChartData,
} from '../utils/reportCalculations';
import type { Order } from '../types/Order';
import type { Product } from '../types/Product';

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeOrder = (overrides: Partial<Order> = {}): Order => ({
  id: 'p1',
  orderNumber: 'ORD-20240101-0001',
  clientName: 'Juan Pérez',
  clientPhone: '5551234567',
  items: [],
  total: 100,
  status: 'delivered',
  archived: false,
  createdAt: new Date('2024-06-15T10:00:00'),
  userId: 'user1',
  ...overrides,
});

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

// ── getDateRange ──────────────────────────────────────────────────────────────

describe('getDateRange', () => {
  it('hoy: start at 00:00:00, end at 23:59:59', () => {
    const { start, end } = getDateRange('today');
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
  });

  it('semana: spans 7 calendar days (6 days back + today)', () => {
    const { start, end } = getDateRange('week');
    // start = 00:00 of 6 days ago, end = 23:59 of today → 7 calendar days
    const startDay = new Date(start).setHours(0, 0, 0, 0);
    const endDay = new Date(end).setHours(0, 0, 0, 0);
    const diffDays = (endDay - startDay) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBe(6);
  });

  it('mes: start is first day of current month', () => {
    const { start } = getDateRange('month');
    expect(start.getDate()).toBe(1);
    expect(start.getHours()).toBe(0);
  });

  it('unknown period falls back to mes range', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { start } = getDateRange('anio' as any);
    expect(start.getDate()).toBe(1);
    expect(start.getHours()).toBe(0);
  });
});

// ── filterOrdersByDate ───────────────────────────────────────────────────────

describe('filterOrdersByDate', () => {
  const orders = [
    makeOrder({ id: 'a', createdAt: new Date('2024-06-10T12:00:00') }),
    makeOrder({ id: 'b', createdAt: new Date('2024-06-15T12:00:00') }),
    makeOrder({ id: 'c', createdAt: new Date('2024-06-20T12:00:00') }),
  ];

  it('returns only orders within range', () => {
    const range = {
      start: new Date('2024-06-14T00:00:00'),
      end: new Date('2024-06-16T23:59:59'),
    };
    const result = filterOrdersByDate(orders, range);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('b');
  });

  it('returns empty when no orders match', () => {
    const range = {
      start: new Date('2024-07-01T00:00:00'),
      end: new Date('2024-07-31T23:59:59'),
    };
    expect(filterOrdersByDate(orders, range)).toHaveLength(0);
  });
});

// ── calculateKPIs ─────────────────────────────────────────────────────────────

describe('calculateKPIs', () => {
  it('returns zeros when no orders', () => {
    const kpis = calculateKPIs([]);
    expect(kpis.totalSales).toBe(0);
    expect(kpis.totalOrders).toBe(0);
    expect(kpis.averageTicket).toBe(0);
  });

  it('calculates totals correctly', () => {
    const orders = [
      makeOrder({ id: 'a', total: 200, clientName: 'Ana',  clientPhone: '1111111111' }),
      makeOrder({ id: 'b', total: 300, clientName: 'Luis', clientPhone: '2222222222' }),
      makeOrder({ id: 'c', total: 100, clientName: 'Ana',  clientPhone: '1111111111' }),
    ];
    const kpis = calculateKPIs(orders);
    expect(kpis.totalSales).toBe(600);
    expect(kpis.totalOrders).toBe(3);
    expect(kpis.averageTicket).toBe(200);
  });

  it('calculates profit and margin from item unitCost', () => {
    const orders = [
      makeOrder({
        total: 100,
        items: [{ name: 'Pan', quantity: 2, subtotal: 100, unitPrice: 50, unitCost: 30 }],
      }),
    ];
    const kpis = calculateKPIs(orders);
    expect(kpis.totalCost).toBe(60);
    expect(kpis.totalProfit).toBe(40);
    expect(kpis.profitMargin).toBe(40);
    expect(kpis.hasIncompleteCost).toBe(false);
  });

  it('flags hasIncompleteCost when an item has no unitCost, without subtracting cost for it', () => {
    const orders = [
      makeOrder({
        total: 100,
        items: [{ name: 'Pan', quantity: 1, subtotal: 100, unitPrice: 100 }],
      }),
    ];
    const kpis = calculateKPIs(orders);
    expect(kpis.hasIncompleteCost).toBe(true);
    expect(kpis.totalCost).toBe(0);
    expect(kpis.totalProfit).toBe(100);
  });
});

// ── calculateStatusBreakdown ──────────────────────────────────────────────────

describe('calculateStatusBreakdown', () => {
  it('returns correct counts and percentages', () => {
    const orders = [
      makeOrder({ status: 'pending', total: 100 }),
      makeOrder({ status: 'pending', total: 100 }),
      makeOrder({ status: 'delivered', total: 200 }),
    ];
    const breakdown = calculateStatusBreakdown(orders);
    const pending = breakdown.find(b => b.status === 'pending')!;
    const delivered = breakdown.find(b => b.status === 'delivered')!;
    expect(pending.count).toBe(2);
    expect(Math.round(pending.percentage)).toBe(67);
    expect(delivered.count).toBe(1);
    expect(Math.round(delivered.percentage)).toBe(33);
  });
});

// ── calculateTopClients ──────────────────────────────────────────────────────

describe('calculateTopClients', () => {
  it('returns top N clients sorted by total, grouped by phone', () => {
    const orders = [
      makeOrder({ clientName: 'Ana',  clientPhone: '1111111111', total: 500 }),
      makeOrder({ clientName: 'Luis', clientPhone: '2222222222', total: 200 }),
      makeOrder({ clientName: 'Ana',  clientPhone: '1111111111', total: 300 }),
      makeOrder({ clientName: 'Sara', clientPhone: '3333333333', total: 900 }),
    ];
    const top = calculateTopClients(orders, 2);
    expect(top).toHaveLength(2);
    expect(top[0].name).toBe('Sara');
    expect(top[1].name).toBe('Ana');
    expect(top[1].total).toBe(800);
  });

  it('two clients with same name but different phones count separately', () => {
    const orders = [
      makeOrder({ clientName: 'Juan', clientPhone: '1111111111', total: 100 }),
      makeOrder({ clientName: 'Juan', clientPhone: '9999999999', total: 100 }),
    ];
    expect(calculateTopClients(orders, 5)).toHaveLength(2);
  });
});

// ── calculateTopProducts ─────────────────────────────────────────────────────

describe('calculateTopProducts', () => {
  it('aggregates products across orders', () => {
    const orders = [
      makeOrder({
        items: [
          { name: 'Pan', quantity: 3, subtotal: 30, unitPrice: 10 },
          { name: 'Leche', quantity: 1, subtotal: 20, unitPrice: 20 },
        ],
      }),
      makeOrder({
        items: [
          { name: 'Pan', quantity: 2, subtotal: 20, unitPrice: 10 },
        ],
      }),
    ];
    const top = calculateTopProducts(orders, 3);
    const pan = top.find(t => t.name === 'Pan')!;
    expect(pan.units).toBe(5);
    expect(pan.total).toBe(50);
  });

  it('computes profit per product when unitCost is present, undefined otherwise', () => {
    const orders = [
      makeOrder({
        items: [
          { name: 'Pan', quantity: 2, subtotal: 20, unitPrice: 10, unitCost: 6 },
          { name: 'Leche', quantity: 1, subtotal: 20, unitPrice: 20 },
        ],
      }),
    ];
    const top = calculateTopProducts(orders, 3);
    expect(top.find(t => t.name === 'Pan')!.profit).toBe(8);
    expect(top.find(t => t.name === 'Leche')!.profit).toBeUndefined();
  });
});

// ── calculateChartData ────────────────────────────────────────────────────────

describe('calculateChartData (groupByDay)', () => {
  const dateRange = {
    start: new Date('2024-06-10T00:00:00'),
    end:   new Date('2024-06-12T23:59:59'),
  };
  const orders = [
    makeOrder({ createdAt: new Date('2024-06-10T10:00:00'), total: 100 }),
    makeOrder({ createdAt: new Date('2024-06-10T15:00:00'), total: 200 }),
    makeOrder({ createdAt: new Date('2024-06-12T09:00:00'), total: 50 }),
  ];

  it('generates one data point per calendar day in range', () => {
    const data = calculateChartData(orders, 'week', dateRange, 'es');
    expect(data).toHaveLength(3);
  });

  it('aggregates totals correctly per day', () => {
    const data = calculateChartData(orders, 'week', dateRange, 'es');
    expect(data[0].value).toBe(300);   // día 10: 100 + 200
    expect(data[0].orders).toBe(2);
    expect(data[1].value).toBe(0);     // día 11: sin pedidos
    expect(data[2].value).toBe(50);    // día 12
  });

  it('day labels use the given locale (es → "Lun", en → "Mon")', () => {
    const dataEs = calculateChartData(orders, 'week', dateRange, 'es');
    const dataEn = calculateChartData(orders, 'week', dateRange, 'en');
    // June 10, 2024 is a Monday
    expect(dataEs[0].label).toMatch(/^Lun/);
    expect(dataEn[0].label).toMatch(/^Mon/);
  });

  it('returns empty days (value 0) for days without orders', () => {
    const data = calculateChartData([], 'week', dateRange, 'es');
    expect(data.every(d => d.value === 0 && d.orders === 0)).toBe(true);
  });
});

// ── calculateInventoryStats ──────────────────────────────────────────────────

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
});
