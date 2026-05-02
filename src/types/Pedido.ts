export type PedidoStatus = 'pendiente' | 'en_preparacion' | 'entregado';

export interface CreadoPor {
  uid: string;
  nombre: string;
}

export interface Abono {
  id: string;
  monto: number;
  fecha: Date;
  productoIndex?: number;
  montoOriginal?: number;
  editadoEn?: Date;
  creadoPor?: CreadoPor;
}

export interface ProductoItem {
  nombre: string;
  clave?: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  precioOriginal?: number;
  descuento?: number;
  productoId?: string;
  controlStock?: boolean;
}

export interface Pedido {
  id: string;
  folio?: string;
  clienteNombre: string;
  clienteTelefono: string;
  clienteFoto?: string;
  clienteCodigoPostal?: string;
  productos: ProductoItem[];
  total: number;
  notas?: string;
  estado: PedidoStatus;
  archivado: boolean;
  fechaCreacion: Date;
  fechaEntrega?: Date;
  userId: string;
  abonos?: Abono[];
  creadoPor?: CreadoPor;
  entregadoPor?: CreadoPor;
}

export interface PedidoFormData {
  clienteNombre: string;
  clienteTelefono: string;
  clienteFoto?: string;
  clienteCodigoPostal?: string;
  productos: ProductoItem[];
  total: number;
  notas?: string;
}
