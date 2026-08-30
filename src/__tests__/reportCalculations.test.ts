import { describe, it, expect } from 'vitest';
import {
  getDateRange,
  getPreviousPeriodDateRange,
  filterOrdersByDate,
  calculateKPIs,
  calculateStatusBreakdown,
  calculateTopClients,
  calculateTopProducts,
  calculateChartData,
} from '../utils/reportCalculations';
import type { Order } from '../types/Order';

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

// ── getPreviousPeriodDateRange ────────────────────────────────────────────────

describe('getPreviousPeriodDateRange', () => {
  it('hoy: previous period is exactly yesterday', () => {
    const range = {
      start: new Date('2024-06-15T00:00:00'),
      end: new Date('2024-06-15T23:59:59'),
    };
    const prev = getPreviousPeriodDateRange(range);
    expect(prev.start).toEqual(new Date('2024-06-14T00:00:00'));
    expect(prev.end.getFullYear()).toBe(2024);
    expect(prev.end.getMonth()).toBe(5);
    expect(prev.end.getDate()).toBe(14);
    expect(prev.end.getHours()).toBe(23);
  });

  it('semana: previous period is the 7 days immediately before', () => {
    const range = {
      start: new Date('2024-06-09T00:00:00'), // Sun
      end: new Date('2024-06-15T23:59:59'),   // Sat, 7 days total
    };
    const prev = getPreviousPeriodDateRange(range);
    expect(prev.start).toEqual(new Date('2024-06-02T00:00:00'));
    expect(prev.end.getDate()).toBe(8);
    const days = Math.round((prev.end.getTime() - prev.start.getTime()) / (1000 * 60 * 60 * 24));
    expect(days).toBe(7); // same 7-day span as the current period
  });

  it('mes-a-la-fecha: previous period has the same number of elapsed days, ending the day before day 1', () => {
    const range = {
      start: new Date('2024-08-01T00:00:00'),
      end: new Date('2024-08-27T23:59:59'), // 27 days elapsed
    };
    const prev = getPreviousPeriodDateRange(range);
    expect(prev.end.getMonth()).toBe(6); // July
    expect(prev.end.getDate()).toBe(31);
    expect(prev.start.getMonth()).toBe(6); // July
    expect(prev.start.getDate()).toBe(5);
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
