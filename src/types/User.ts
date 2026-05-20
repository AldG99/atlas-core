export interface Plantillas {
  confirmacion: string;
  preparacion: string;
  entrega: string;
}

export const PLANTILLAS_DEFAULT: Plantillas = {
  confirmacion: '*{{negocio}}*\n{{folio}}\n─────────────────────\n{{nombre}}\n\n*PRODUCTOS*\n{{productos}}\n─────────────────────\n*Total: {{total}}*\nAbonado: {{pagado}}\n*Restante: {{restante}}*\n─────────────────────',
  preparacion: '*{{negocio}}*\n─────────────────────\n{{nombre}}, tu pedido {{folio}} está en preparación.',
  entrega: '*{{negocio}}*\n{{folio}}\n─────────────────────\n{{nombre}}, tu pedido está listo.\n─────────────────────\n*Total: {{total}}*\nAbonado: {{pagado}}\n*Restante: {{restante}}*\n─────────────────────',
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
