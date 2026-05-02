export interface Etiqueta {
  id: string;
  nombre: string;
  color: string;
  icono: string;
  userId: string;
}

export interface DescuentoHistorial {
  porcentaje: number;
  fechaInicio: Date;
  fechaFin: Date;
  fechaCierre: Date;
  motivo: 'cancelado' | 'expirado';
}

export interface Producto {
  id: string;
  clave: string;
  nombre: string;
  precio: number;
  descripcion?: string;
  imagen?: string;
  etiquetas?: string[];
  descuento?: number;
  fechaFinDescuento?: Date;
  historialDescuentos?: DescuentoHistorial[];
  controlStock?: boolean;
  stock?: number;
  unidad?: string;
  unidadCantidad?: number;
  userId: string;
  fechaCreacion: Date;
}

export interface ProductoFormData {
  clave: string;
  nombre: string;
  precio: number;
  descripcion?: string;
  imagen?: string;
  etiquetas?: string[];
  descuento?: number;
  fechaFinDescuento?: Date | string;
  controlStock?: boolean;
  stock?: number;
  unidad?: string;
  unidadCantidad?: number;
}
