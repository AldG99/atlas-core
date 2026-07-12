export interface Templates {
  confirmation: string;
  preparing: string;
  delivery: string;
}

export const DEFAULT_TEMPLATES: Templates = {
  confirmation: '*{{negocio}}*\n{{folio}}\n─────────────────────\n{{nombre}}\n\n*PRODUCTOS*\n{{productos}}\n─────────────────────\n*Total: {{total}}*\nAbonado: {{pagado}}\n*Restante: {{restante}}*\n─────────────────────',
  preparing: '*{{negocio}}*\n─────────────────────\n{{nombre}}, tu pedido {{folio}} está en preparación.',
  delivery: '*{{negocio}}*\n{{folio}}\n─────────────────────\n{{nombre}}, tu pedido está listo.\n─────────────────────\n*Total: {{total}}*\nAbonado: {{pagado}}\n*Restante: {{restante}}*\n─────────────────────',
};

export interface User {
  uid: string;
  email: string;
  businessName: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  phone?: string;
  phoneCountryCode?: string;
  street?: string;
  exteriorNumber?: string;
  interiorNumber?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  reference?: string;
  profilePhoto?: string;
  registeredAt: Date;
  plan?: 'free' | 'pro' | 'enterprise';
  currency?: string;
  templates?: Templates;
  role?: 'admin' | 'member';
  businessUid?: string;
  username?: string;
  memberNumber?: string;
  active?: boolean;
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
  businessName: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  phone: string;
  phoneCountryCode: string;
  street: string;
  exteriorNumber: string;
  interiorNumber?: string;
  neighborhood: string;
  city: string;
  state?: string;
  postalCode: string;
  country?: string;
  reference?: string;
}
