import { createAvatar } from '@dicebear/core';
import * as shapes from '@dicebear/shapes';

// Dos tonos de azul fijos (en vez del set de colores por defecto) — el fondo
// más oscuro que la figura, para que se distingan entre sí.
const AVATAR_BACKGROUND_BLUE = 'f9c157';
const AVATAR_SHAPE_BLUE = '2f3f53';

// Avatar generado (sin subir ni almacenar ninguna imagen): a partir de una semilla
// (id de cliente, uid de usuario, etc.) siempre produce el mismo dibujo SVG.
export const generateAvatarUri = (seed: string): string =>
  createAvatar(shapes, {
    seed,
    backgroundColor: [AVATAR_BACKGROUND_BLUE],
    shape1Color: [AVATAR_SHAPE_BLUE],
    shape2Color: [AVATAR_SHAPE_BLUE],
    shape3Color: [AVATAR_SHAPE_BLUE],
  }).toDataUri();

export const generateAvatarSeed = (): string => crypto.randomUUID();

// Iniciales para el avatar de un cliente: primera letra del nombre + primera letra del primer apellido.
export const getInitials = (firstName?: string, lastName?: string): string =>
  `${firstName?.trim()?.[0] ?? ''}${lastName?.trim()?.[0] ?? ''}`.toUpperCase();

// Paleta de colores para avatares de iniciales (estilo WhatsApp: cada persona
// tiene un color fijo y distinto, calculado a partir de su id, no elegido al azar).
// Tonos industriales/desaturados en vez de colores vivos.
const AVATAR_COLOR_PALETTE = [
  '#5B7CA8', // azul acero
  '#5F8087', // gris metálico
  '#4D8085', // teal oscuro
  '#5C9169', // verde oliva
  '#7A6E60', // marrón carbón
  '#9C8570', // taupe
  '#B08D52', // bronce
  '#BC7350', // terracota
  '#83699A', // ciruela apagado
];

export const getAvatarColor = (seed: string): string => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLOR_PALETTE[Math.abs(hash) % AVATAR_COLOR_PALETTE.length];
};
