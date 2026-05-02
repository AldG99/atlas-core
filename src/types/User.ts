export interface Plantillas {
  confirmacion: string;
  preparacion: string;
  entrega: string;
}

export const PLANTILLAS_DEFAULT: Plantillas = {
  confirmacion: '*Pedido confirmado — {{nombre}}*\n{{folio}}\n\n*Productos:*\n{{productos}}\n\n*Total: {{total}}*',
  preparacion: '{{nombre}}, tu pedido *{{folio}}* está en preparación. 🍳',
  entrega: '{{nombre}}, tu pedido *{{folio}}* está listo para entrega. ✅\n\n*Total: {{total}}*\n_Restante: {{restante}}_',
};

export interface User {
  uid: string;
  email: string;
  nombreNegocio: string;
  nombre?: string;
  apellido?: string;
  fechaNacimiento?: string;
  telefono?: string;
  telefonoCodigoPais?: string;
  direccion?: string;
  fotoPerfil?: string;
  fechaRegistro: Date;
  plan?: 'gratuito' | 'pro' | 'enterprise';
  moneda?: string;
  plantillas?: Plantillas;
  role?: 'admin' | 'miembro';
  negocioUid?: string;
  username?: string;
  numeroMiembro?: string;
  activo?: boolean;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  nombreNegocio: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  telefono: string;
  telefonoCodigoPais: string;
}
