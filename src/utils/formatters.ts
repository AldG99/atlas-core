// Formatea 10 dígitos como XXX XXX XXXX
export const formatTelefono = (numero: string): string => {
  const d = numero.replace(/\D/g, '');
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 10)}`;
};

export const formatCurrency = (amount: number, simbolo = '$'): string => {
  const formatted = new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${simbolo}${formatted}`;
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

import type { Pedido, ProductoItem } from '../types/Pedido';
import { getCodigoPais } from '../data/codigosPais';

export const getTotalPagado = (pedido: Pedido): number =>
  (pedido.abonos || []).reduce((sum, a) => sum + a.monto, 0);

interface PedidoForWhatsApp {
  clienteNombre: string;
  clienteTelefono: string;
  productos: ProductoItem[];
  total: number;
  notas?: string;
}

const formatProductosText = (productos: ProductoItem[], simbolo = '$'): string => {
  return productos.map(p => {
    const clave = p.clave ? `[${p.clave}] ` : '';
    return `${p.cantidad}x ${clave}${p.nombre} - ${formatCurrency(p.subtotal, simbolo)}`;
  }).join('\n');
};

export const formatPedidoForWhatsApp = (pedido: PedidoForWhatsApp, simbolo = '$'): string => {
  let message = `*Pedido - ${pedido.clienteNombre}*\n`;
  message += `${pedido.clienteTelefono}\n\n`;
  message += `*Productos:*\n${formatProductosText(pedido.productos, simbolo)}\n\n`;
  message += `*Total: ${formatCurrency(pedido.total, simbolo)}*`;

  if (pedido.notas) {
    message += `\n\n_${pedido.notas}_`;
  }

  return message;
};

export const applyTemplate = (
  template: string,
  pedido: PedidoForWhatsApp & { folio?: string; notas?: string; abonos?: { monto: number }[] },
  simbolo = '$',
  negocio = ''
): string => {
  const pagado = (pedido.abonos || []).reduce((s, a) => s + a.monto, 0);
  const restante = Math.max(0, pedido.total - pagado);

  return template
    .replace(/\{\{nombre\}\}/g, pedido.clienteNombre)
    .replace(/\{\{folio\}\}/g, pedido.folio ?? '')
    .replace(/\{\{total\}\}/g, formatCurrency(pedido.total, simbolo))
    .replace(/\{\{pagado\}\}/g, formatCurrency(pagado, simbolo))
    .replace(/\{\{restante\}\}/g, formatCurrency(restante, simbolo))
    .replace(/\{\{productos\}\}/g, formatProductosText(pedido.productos, simbolo))
    .replace(/\{\{notas\}\}/g, pedido.notas ?? '')
    .replace(/\{\{negocio\}\}/g, negocio);
};

interface PlantillasConfig {
  confirmacion: string;
  preparacion: string;
  entrega: string;
}

export const buildMensajePedido = (
  pedido: PedidoForWhatsApp & { folio?: string; estado: string; notas?: string; abonos?: { monto: number }[] },
  plantillas: PlantillasConfig,
  simbolo: string,
  negocio: string
): string => {
  const template =
    pedido.estado === 'entregado' ? plantillas.entrega :
    pedido.estado === 'en_preparacion' ? plantillas.preparacion :
    plantillas.confirmacion;
  return applyTemplate(template, pedido, simbolo, negocio);
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
  folio?: string;
  clienteNombre: string;
  clienteTelefono: string;
  clienteCodigoPais?: string;
  clienteCodigoPostal?: string;
  productos: ProductoItem[];
  abonos?: { monto: number; fecha: Date; productoIndex?: number }[];
  total: number;
  notas?: string;
  estado: string;
  fechaCreacion: Date;
}

const escapeCSV = (value: string): string => {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

export const generateCSVContent = (pedidos: PedidoForCSV[]): string => {
  const headers = ['Cliente', 'Teléfono', 'C.P.', 'Folio', 'Productos', 'Abonado', 'Total', 'Estado', 'Notas', 'Fecha'];

  const rows = pedidos.map((pedido) => [
    escapeCSV(pedido.clienteNombre),
    escapeCSV(pedido.clienteCodigoPais ? `${pedido.clienteCodigoPais} ${formatTelefono(pedido.clienteTelefono)}` : formatTelefono(pedido.clienteTelefono)),
    escapeCSV(pedido.clienteCodigoPostal || ''),
    escapeCSV(pedido.folio || ''),
    escapeCSV(formatProductosText(pedido.productos).replace(/\n/g, ' | ')),
    (pedido.abonos?.reduce((sum, a) => sum + a.monto, 0) ?? 0).toFixed(2),
    pedido.total.toFixed(2),
    pedido.estado,
    escapeCSV(pedido.notas || ''),
    formatDate(pedido.fechaCreacion)
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
};

export const exportToCSV = (pedidos: PedidoForCSV[], filename: string = 'pedidos'): void => {
  const csvContent = generateCSVContent(pedidos);

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

interface ClienteForCSV {
  nombre: string;
  apellido: string;
  telefono: string;
  telefonoCodigoPais?: string;
  correo?: string;
  calle: string;
  numeroExterior: string;
  numeroInterior?: string;
  colonia: string;
  ciudad: string;
  codigoPostal: string;
  pais?: string;
  referencia?: string;
  favorito?: boolean;
  fechaCreacion: Date;
}

export const exportClientesCSV = (clientes: ClienteForCSV[]): void => {

  const headers = ['Nombre', 'Apellido', 'Teléfono', 'Correo', 'Calle', 'Núm. Ext.', 'Núm. Int.', 'Colonia', 'Ciudad', 'C.P.', 'País', 'Referencia', 'Favorito', 'Registro'];

  const rows = clientes.map(c => [
    escapeCSV(c.nombre),
    escapeCSV(c.apellido),
    escapeCSV(c.telefonoCodigoPais ? `${getCodigoPais(c.telefonoCodigoPais)?.codigo ?? c.telefonoCodigoPais} ${formatTelefono(c.telefono)}` : formatTelefono(c.telefono)),
    escapeCSV(c.correo || ''),
    escapeCSV(c.calle),
    escapeCSV(c.numeroExterior),
    escapeCSV(c.numeroInterior || ''),
    escapeCSV(c.colonia),
    escapeCSV(c.ciudad),
    escapeCSV(c.codigoPostal),
    escapeCSV(c.pais || ''),
    escapeCSV(c.referencia || ''),
    c.favorito ? 'Sí' : 'No',
    formatDate(c.fechaCreacion)
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `clientes_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

interface ProductoForCSV {
  clave: string;
  nombre: string;
  precio: number;
  descripcion?: string;
  descuento?: number;
  fechaFinDescuento?: Date;
  controlStock?: boolean;
  stock?: number;
  unidad?: string;
  unidadCantidad?: number;
  etiquetas?: string[];
  fechaCreacion: Date;
}

export const exportProductosCSV = (productos: ProductoForCSV[], etiquetaNombres: (ids: string[]) => string): void => {
  const headers = ['Clave', 'Nombre', 'Precio', 'Descuento %', 'Fin descuento', 'Stock', 'Unidad', 'Cant. unidad', 'Etiquetas', 'Registro'];

  const rows = productos.map(p => [
    escapeCSV(p.clave),
    escapeCSV(p.nombre),
    p.precio.toFixed(2),
    p.descuento ? p.descuento.toString() : '',
    p.fechaFinDescuento ? formatDate(p.fechaFinDescuento) : '',
    p.controlStock ? (p.stock ?? 0).toString() : '',
    escapeCSV(p.unidad || ''),
    p.unidadCantidad ? p.unidadCantidad.toString() : '',
    escapeCSV(etiquetaNombres(p.etiquetas || [])),
    formatDate(p.fechaCreacion)
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `productos_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
