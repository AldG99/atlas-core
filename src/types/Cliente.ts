export interface Cliente {
  id: string;
  // Información personal
  fotoPerfil?: string;
  nombre: string;
  apellido: string;
  telefono: string;
  telefonoCodigoPais?: string; // ISO code, e.g. 'MX'
  correo?: string;
  // Dirección
  calle: string;
  numeroExterior: string;
  numeroInterior?: string;
  colonia: string;
  ciudad: string;
  estado?: string;
  codigoPostal: string;
  pais?: string;
  referencia?: string;
  // Otros
  favorito?: boolean;
  userId: string;
  fechaCreacion: Date;
}

export interface ClienteFormData {
  fotoPerfil?: string;
  nombre: string;
  apellido: string;
  telefono: string;
  telefonoCodigoPais?: string; // ISO code, e.g. 'MX'
  correo?: string;
  calle: string;
  numeroExterior: string;
  numeroInterior?: string;
  colonia: string;
  ciudad: string;
  estado?: string;
  codigoPostal: string;
  pais?: string;
  referencia?: string;
}
