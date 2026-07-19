import { createAvatar } from '@dicebear/core';
import * as thumbs from '@dicebear/thumbs';

// Dos tonos de azul fijos (en vez del set de colores por defecto) — el fondo
// más oscuro que la figura, para que se distingan entre sí.
const AVATAR_BACKGROUND_BLUE = 'f9c157';
const AVATAR_SHAPE_BLUE = '2f3f53';

// Avatar generado (sin subir ni almacenar ninguna imagen): a partir de una semilla
// (id de cliente, uid de usuario, etc.) siempre produce el mismo dibujo SVG.
export const generateAvatarUri = (seed: string): string =>
  createAvatar(thumbs, {
    seed,
    backgroundColor: [AVATAR_BACKGROUND_BLUE],
    shapeColor: [AVATAR_SHAPE_BLUE],
  }).toDataUri();

export const generateAvatarSeed = (): string => crypto.randomUUID();
