export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount);
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

import type { ProductoItem } from '../types/Pedido';

interface PedidoForWhatsApp {
  clienteNombre: string;
  clienteTelefono: string;
  productos: ProductoItem[];
  total: number;
  notas?: string;
}

const formatProductosText = (productos: ProductoItem[]): string => {
  return productos.map(p => {
    const clave = p.clave ? `[${p.clave}] ` : '';
    return `${p.cantidad}x ${clave}${p.nombre} - $${p.subtotal.toFixed(2)}`;
  }).join('\n');
};

export const formatPedidoForWhatsApp = (pedido: PedidoForWhatsApp): string => {
  let message = `*Pedido - ${pedido.clienteNombre}*\n`;
  message += `${pedido.clienteTelefono}\n\n`;
  message += `*Productos:*\n${formatProductosText(pedido.productos)}\n\n`;
  message += `*Total: ${formatCurrency(pedido.total)}*`;

  if (pedido.notas) {
    message += `\n\n_${pedido.notas}_`;
  }

  return message;
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

interface PedidoForCSV {
  id: string;
  clienteNombre: string;
  clienteTelefono: string;
  productos: ProductoItem[];
  total: number;
  notas?: string;
  estado: string;
  fechaCreacion: Date;
}

export const exportToCSV = (pedidos: PedidoForCSV[], filename: string = 'pedidos'): void => {
  const headers = ['ID', 'Cliente', 'Teléfono', 'Productos', 'Total', 'Estado', 'Notas', 'Fecha'];

  const escapeCSV = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const rows = pedidos.map((pedido) => [
    pedido.id,
    escapeCSV(pedido.clienteNombre),
    escapeCSV(pedido.clienteTelefono),
    escapeCSV(formatProductosText(pedido.productos).replace(/\n/g, ' | ')),
    pedido.total.toFixed(2),
    pedido.estado,
    escapeCSV(pedido.notas || ''),
    formatDate(pedido.fechaCreacion)
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(','))
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
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
