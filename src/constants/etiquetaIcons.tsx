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
  '#ef4444', '#f97316', '#f59e0b', '#10b981',
  '#3b82f6', '#8b5cf6', '#ec4899', '#6366f1',
  '#14b8a6', '#84cc16',
];
