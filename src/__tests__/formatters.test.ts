import { describe, it, expect } from 'vitest';
import {
  formatPhone,
  formatCurrency,
  applyTemplate,
  generateCSVContent,
  getTotalPaid,
  formatOrderForWhatsApp,
  buildOrderMessage,
} from '../utils/formatters';
import type { Order } from '../types/Order';
import i18n from '../i18n';

const makeOrder = (amounts: number[]): Order => ({
  id: 'test',
  clientName: 'Test',
  clientPhone: '1234567890',
  items: [],
  total: amounts.reduce((s, m) => s + m, 0),
  status: 'pending',
  archived: false,
  createdAt: new Date(),
  userId: 'user1',
  payments: amounts.map((amount, i) => ({ id: `a${i}`, amount, date: new Date() })),
});

// ── formatPhone ────────────────────────────────────────────────────────────

describe('formatPhone', () => {
  it('formats 10-digit number as XXX XXX XXXX', () => {
    expect(formatPhone('5551234567')).toBe('555 123 4567');
  });

  it('strips non-digits before formatting', () => {
    expect(formatPhone('(555) 123-4567')).toBe('555 123 4567');
  });

  it('handles partial numbers', () => {
    expect(formatPhone('555')).toBe('555');
    expect(formatPhone('55512')).toBe('555 12');
  });

  it('returns empty string for empty input', () => {
    expect(formatPhone('')).toBe('');
  });
});

// ── formatCurrency ────────────────────────────────────────────────────────────

describe('formatCurrency', () => {
  it('formats with default dollar symbol', () => {
    expect(formatCurrency(1000)).toBe('$1,000.00');
  });

  it('formats with custom symbol', () => {
    expect(formatCurrency(50.5, '€')).toBe('€50.50');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('handles large numbers', () => {
    expect(formatCurrency(1234567.89)).toBe('$1,234,567.89');
  });
});

// ── applyTemplate ─────────────────────────────────────────────────────────────

describe('applyTemplate', () => {
  const order = {
    clientName: 'María López',
    clientPhone: '5559876543',
    orderNumber: 'ORD-20240615-0001',
    total: 500,
    items: [
      { name: 'Pizza', quantity: 2, subtotal: 400, unitPrice: 200 },
    ],
    notes: 'Sin cebolla',
    payments: [{ amount: 200 }],
  };

  it('replaces {{nombre}}', () => {
    expect(applyTemplate('Hola {{nombre}}', order)).toBe('Hola María López');
  });

  it('replaces {{folio}}', () => {
    expect(applyTemplate('Folio: {{folio}}', order)).toBe('Folio: ORD-20240615-0001');
  });

  it('replaces {{total}}, {{pagado}}, {{restante}}', () => {
    const result = applyTemplate('Total: {{total}} / Pagado: {{pagado}} / Resto: {{restante}}', order);
    expect(result).toContain('$500.00');
    expect(result).toContain('$200.00');
    expect(result).toContain('$300.00');
  });

  it('replaces {{negocio}}', () => {
    expect(applyTemplate('{{negocio}}', order, '$', 'Mi Negocio')).toBe('Mi Negocio');
  });

  it('replaces {{notas}}', () => {
    expect(applyTemplate('Notas: {{notas}}', order)).toBe('Notas: Sin cebolla');
  });

  it('leaves unknown placeholders unchanged (no match)', () => {
    const result = applyTemplate('{{unknown}}', order);
    expect(result).toBe('{{unknown}}');
  });
});

// ── getTotalPaid ─────────────────────────────────────────────────────────────

describe('getTotalPaid', () => {
  it('sums all payments', () => {
    expect(getTotalPaid(makeOrder([100, 50, 25]))).toBe(175);
  });

  it('returns 0 when there are no payments', () => {
    expect(getTotalPaid(makeOrder([]))).toBe(0);
  });

  it('handles single payment', () => {
    expect(getTotalPaid(makeOrder([300]))).toBe(300);
  });
});

// ── formatOrderForWhatsApp ────────────────────────────────────────────────────

describe('formatOrderForWhatsApp', () => {
  const order = {
    clientName: 'Juan Pérez',
    clientPhone: '5551234567',
    items: [
      { name: 'Tacos', quantity: 3, subtotal: 150, unitPrice: 50 },
    ],
    total: 150,
  };

  it('includes client name in bold', () => {
    const result = formatOrderForWhatsApp(order);
    expect(result).toContain('*Pedido - Juan Pérez*');
  });

  it('includes phone number', () => {
    const result = formatOrderForWhatsApp(order);
    expect(result).toContain('5551234567');
  });

  it('includes product line with quantity and subtotal', () => {
    const result = formatOrderForWhatsApp(order);
    expect(result).toContain('• Tacos');
    expect(result).toContain('3 ×');
    expect(result).toContain('$150.00');
  });

  it('includes total in bold', () => {
    const result = formatOrderForWhatsApp(order);
    expect(result).toContain('*Total: $150.00*');
  });

  it('appends notes when present', () => {
    const result = formatOrderForWhatsApp({ ...order, notes: 'Sin cebolla' });
    expect(result).toContain('_Sin cebolla_');
  });

  it('omits notes line when empty', () => {
    const result = formatOrderForWhatsApp({ ...order, notes: '' });
    expect(result).not.toContain('_');
  });
});

// ── buildOrderMessage ────────────────────────────────────────────────────────

describe('buildOrderMessage', () => {
  const templates = {
    confirmation: 'Confirmado {{nombre}}',
    preparing: 'En preparacion {{nombre}}',
    delivery: 'Entregado {{nombre}}',
  };

  const baseOrder = {
    clientName: 'Ana',
    clientPhone: '5550000000',
    items: [],
    total: 0,
    orderNumber: 'ORD-001',
    notes: '',
    payments: [],
  };

  it('uses confirmation template for pending', () => {
    const result = buildOrderMessage({ ...baseOrder, status: 'pending' }, templates, '$', '');
    expect(result).toBe('Confirmado Ana');
  });

  it('uses preparing template for preparing', () => {
    const result = buildOrderMessage({ ...baseOrder, status: 'preparing' }, templates, '$', '');
    expect(result).toBe('En preparacion Ana');
  });

  it('uses delivery template for delivered', () => {
    const result = buildOrderMessage({ ...baseOrder, status: 'delivered' }, templates, '$', '');
    expect(result).toBe('Entregado Ana');
  });
});

// ── generateCSVContent ────────────────────────────────────────────────────────

describe('generateCSVContent', () => {
  it('includes header row', () => {
    const csv = generateCSVContent([]);
    const [firstHeader] = i18n.t('common.csvHeaders.orders', { returnObjects: true }) as string[];
    expect(csv.startsWith(`${firstHeader},`)).toBe(true);
  });

  it('generates one data row per order', () => {
    const order = {
      id: 'p1',
      orderNumber: 'ORD-20240101-0001',
      clientName: 'Carlos',
      clientPhone: '5551234567',
      items: [{ name: 'Pan', quantity: 1, subtotal: 10, unitPrice: 10 }],
      total: 10,
      status: 'delivered',
      notes: '',
      createdAt: new Date('2024-01-01T10:00:00'),
    };
    const lines = generateCSVContent([order]).trim().split('\n');
    expect(lines).toHaveLength(2); // header + 1 row
    expect(lines[1]).toContain('Carlos');
  });

  it('escapes commas in client names', () => {
    const order = {
      id: 'p1',
      clientName: 'Empresa, S.A.',
      clientPhone: '5551234567',
      items: [],
      total: 0,
      status: 'pending',
      notes: '',
      createdAt: new Date('2024-01-01'),
    };
    const csv = generateCSVContent([order]);
    expect(csv).toContain('"Empresa, S.A."');
  });
});
