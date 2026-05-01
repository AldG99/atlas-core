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
  '#EF4444', // rojo
  '#F97316', // naranja
  '#F59E0B', // ámbar
  '#84CC16', // lima
  '#10B981', // esmeralda
  '#14B8A6', // teal
  '#3B82F6', // azul
  '#8B5CF6', // violeta
  '#EC4899', // rosa
  '#F43F5E', // carmín
];
