import {
  PiStarBold,
  PiHeartBold,
  PiFireBold,
  PiSnowflakeBold,
  PiLeafBold,
  PiCrownBold,
  PiLightningBold,
  PiDiamondBold,
  PiSparkleBold,
  PiTagBold,
  PiGiftBold,
  PiCakeBold,
  PiCookingPotBold,
  PiFlowerBold,
} from 'react-icons/pi';
import type { IconType } from 'react-icons';

export const ETIQUETA_ICONS: Record<string, { icon: IconType; label: string }> = {
  star: { icon: PiStarBold, label: 'Estrella' },
  heart: { icon: PiHeartBold, label: 'Corazón' },
  fire: { icon: PiFireBold, label: 'Fuego' },
  snowflake: { icon: PiSnowflakeBold, label: 'Copo' },
  leaf: { icon: PiLeafBold, label: 'Hoja' },
  crown: { icon: PiCrownBold, label: 'Corona' },
  lightning: { icon: PiLightningBold, label: 'Rayo' },
  diamond: { icon: PiDiamondBold, label: 'Diamante' },
  sparkle: { icon: PiSparkleBold, label: 'Destello' },
  tag: { icon: PiTagBold, label: 'Etiqueta' },
  gift: { icon: PiGiftBold, label: 'Regalo' },
  cake: { icon: PiCakeBold, label: 'Pastel' },
  pot: { icon: PiCookingPotBold, label: 'Olla' },
  flower: { icon: PiFlowerBold, label: 'Flor' },
};

export const ETIQUETA_COLORES = [
  '#C0392B', // terracota
  '#B45309', // ámbar
  '#D97706', // dorado
  '#2E7D5A', // musgo
  '#334E68', // pizarra
  '#5B8A8A', // teal muted
  '#7C5C8E', // ciruela
  '#A0522D', // cobre
  '#6B7C3B', // oliva
  '#524F4A', // grafito cálido
];
