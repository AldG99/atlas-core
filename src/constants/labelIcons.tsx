import {
  PiStar,
  PiHeart,
  PiFire,
  PiSnowflake,
  PiLeaf,
  PiCrown,
  PiLightning,
  PiDiamond,
  PiSparkle,
  PiTag,
  PiGift,
  PiCake,
  PiCookingPot,
  PiFlower,
} from 'react-icons/pi';
import type { IconType } from 'react-icons';

export const LABEL_ICONS: Record<string, { icon: IconType; label: string }> = {
  star: { icon: PiStar, label: 'Estrella' },
  heart: { icon: PiHeart, label: 'Corazón' },
  fire: { icon: PiFire, label: 'Fuego' },
  snowflake: { icon: PiSnowflake, label: 'Copo' },
  leaf: { icon: PiLeaf, label: 'Hoja' },
  crown: { icon: PiCrown, label: 'Corona' },
  lightning: { icon: PiLightning, label: 'Rayo' },
  diamond: { icon: PiDiamond, label: 'Diamante' },
  sparkle: { icon: PiSparkle, label: 'Destello' },
  tag: { icon: PiTag, label: 'Etiqueta' },
  gift: { icon: PiGift, label: 'Regalo' },
  cake: { icon: PiCake, label: 'Pastel' },
  pot: { icon: PiCookingPot, label: 'Olla' },
  flower: { icon: PiFlower, label: 'Flor' },
};

export const LABEL_COLORS = [
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
