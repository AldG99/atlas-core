// Formatea 10 dígitos como XXX XXX XXXX
export const formatPhone = (number: string): string => {
  const d = number.replace(/\D/g, '');
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 10)}`;
};

export const formatCurrency = (amount: number, symbol = '$'): string => {
  const formatted = new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${symbol}${formatted}`;
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export const formatShortDate = (date: Date): string => {
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

import type { Order, OrderItem } from '../types/Order';
import type { Templates } from '../types/User';
import { getCountryCode } from '../data/countryCodes';
import i18n from '../i18n';

export const getTotalPaid = (order: Order): number =>
  (order.payments || []).reduce((sum, p) => sum + p.amount, 0);

interface OrderForWhatsApp {
  clientName: string;
  clientPhone: string;
  items: OrderItem[];
  total: number;
  notes?: string;
}

const formatItemsText = (items: OrderItem[], symbol = '$'): string => {
  return items.map(i => {
    const sku = i.sku ? `[${i.sku}] ` : '';
    const discount = i.discount ? ` (-${i.discount}%)` : '';
    const detail = `  ${i.quantity} × ${formatCurrency(i.unitPrice, symbol)} = *${formatCurrency(i.subtotal, symbol)}*`;
    return `• ${sku}${i.name}${discount}\n${detail}`;
  }).join('\n');
};

export const formatOrderForWhatsApp = (order: OrderForWhatsApp, symbol = '$'): string => {
  let message = `*Pedido - ${order.clientName}*\n`;
  message += `${order.clientPhone}\n\n`;
  message += `*Productos:*\n${formatItemsText(order.items, symbol)}\n\n`;
  message += `*Total: ${formatCurrency(order.total, symbol)}*`;

  if (order.notes) {
    message += `\n\n_${order.notes}_`;
  }

  return message;
};

export const applyTemplate = (
  template: string,
  order: OrderForWhatsApp & { orderNumber?: string; notes?: string; payments?: { amount: number }[] },
  symbol = '$',
  businessName = ''
): string => {
  const paid = (order.payments || []).reduce((s, p) => s + p.amount, 0);
  const remaining = Math.max(0, order.total - paid);

  return template
    .replace(/\{\{nombre\}\}/g, order.clientName)
    .replace(/\{\{folio\}\}/g, order.orderNumber ?? '')
    .replace(/\{\{total\}\}/g, formatCurrency(order.total, symbol))
    .replace(/\{\{pagado\}\}/g, formatCurrency(paid, symbol))
    .replace(/\{\{restante\}\}/g, formatCurrency(remaining, symbol))
    .replace(/\{\{productos\}\}/g, formatItemsText(order.items, symbol))
    .replace(/\{\{notas\}\}/g, order.notes ?? '')
    .replace(/\{\{negocio\}\}/g, businessName);
};

export const buildOrderMessage = (
  order: OrderForWhatsApp & { orderNumber?: string; status: string; notes?: string; payments?: { amount: number }[] },
  templates: Templates,
  symbol: string,
  businessName: string
): string => {
  const template =
    order.status === 'delivered' ? templates.delivery :
    order.status === 'preparing' ? templates.preparing :
    templates.confirmation;
  return applyTemplate(template, order, symbol, businessName);
};

export const openWhatsApp = (phone: string, message: string): void => {
  const cleanPhone = phone.replace(/\D/g, '');
  const encodedMessage = encodeURIComponent(message);
  window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

interface OrderForCSV {
  id: string;
  orderNumber?: string;
  clientName: string;
  clientPhone: string;
  clientCountryCode?: string;
  clientPostalCode?: string;
  items: OrderItem[];
  payments?: { amount: number; date: Date; itemIndex?: number }[];
  total: number;
  notes?: string;
  status: string;
  createdAt: Date;
}

const escapeCSV = (value: string): string => {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

export const generateCSVContent = (orders: OrderForCSV[]): string => {
  const headers = i18n.t('common.csvHeaders.orders', { returnObjects: true }) as string[];

  const rows = orders.map((order) => [
    escapeCSV(order.clientName),
    escapeCSV(order.clientCountryCode ? `${order.clientCountryCode} ${formatPhone(order.clientPhone)}` : formatPhone(order.clientPhone)),
    escapeCSV(order.clientPostalCode || ''),
    escapeCSV(order.orderNumber || ''),
    escapeCSV(formatItemsText(order.items).replace(/\n/g, ' | ')),
    (order.payments?.reduce((sum, p) => sum + p.amount, 0) ?? 0).toFixed(2),
    order.total.toFixed(2),
    order.status,
    escapeCSV(order.notes || ''),
    formatDate(order.createdAt)
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
};

export const exportToCSV = (orders: OrderForCSV[], filename: string = 'orders'): void => {
  const csvContent = generateCSVContent(orders);

  const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

interface ClientForCSV {
  firstName: string;
  lastName: string;
  phone: string;
  phoneCountryCode?: string;
  email?: string;
  street: string;
  exteriorNumber: string;
  interiorNumber?: string;
  neighborhood: string;
  city: string;
  postalCode: string;
  country?: string;
  reference?: string;
  favorite?: boolean;
  createdAt: Date;
}

export const exportClientsCSV = (clients: ClientForCSV[]): void => {

  const headers = i18n.t('common.csvHeaders.clients', { returnObjects: true }) as string[];

  const rows = clients.map(c => [
    escapeCSV(c.firstName),
    escapeCSV(c.lastName),
    escapeCSV(c.phoneCountryCode ? `${getCountryCode(c.phoneCountryCode)?.code ?? c.phoneCountryCode} ${formatPhone(c.phone)}` : formatPhone(c.phone)),
    escapeCSV(c.email || ''),
    escapeCSV(c.street),
    escapeCSV(c.exteriorNumber),
    escapeCSV(c.interiorNumber || ''),
    escapeCSV(c.neighborhood),
    escapeCSV(c.city),
    escapeCSV(c.postalCode),
    escapeCSV(c.country || ''),
    escapeCSV(c.reference || ''),
    c.favorite ? 'Sí' : 'No',
    formatDate(c.createdAt)
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `clients_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

interface ProductForCSV {
  sku: string;
  name: string;
  price: number;
  description?: string;
  discount?: number;
  discountEndDate?: Date;
  trackStock?: boolean;
  stock?: number;
  unit?: string;
  unitQuantity?: number;
  labels?: string[];
  createdAt: Date;
}

export const exportProductsCSV = (products: ProductForCSV[], labelNames: (ids: string[]) => string): void => {
  const headers = i18n.t('common.csvHeaders.products', { returnObjects: true }) as string[];

  const rows = products.map(p => [
    escapeCSV(p.sku),
    escapeCSV(p.name),
    p.price.toFixed(2),
    p.discount ? p.discount.toString() : '',
    p.discountEndDate ? formatDate(p.discountEndDate) : '',
    p.trackStock ? (p.stock ?? 0).toString() : '',
    escapeCSV(p.unit || ''),
    p.unitQuantity ? p.unitQuantity.toString() : '',
    escapeCSV(labelNames(p.labels || [])),
    formatDate(p.createdAt)
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `products_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
