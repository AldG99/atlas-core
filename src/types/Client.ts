export interface Client {
  id: string;
  // Información personal
  profilePhoto?: string;
  firstName: string;
  lastName: string;
  phone: string;
  phoneCountryCode?: string; // ISO code, e.g. 'MX'
  email?: string;
  // Dirección
  street: string;
  exteriorNumber: string;
  interiorNumber?: string;
  neighborhood: string;
  city: string;
  state?: string;
  postalCode: string;
  country?: string;
  reference?: string;
  // Otros
  favorite?: boolean;
  userId: string;
  createdAt: Date;
}

export interface ClientFormData {
  profilePhoto?: string;
  firstName: string;
  lastName: string;
  phone: string;
  phoneCountryCode?: string; // ISO code, e.g. 'MX'
  email?: string;
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
