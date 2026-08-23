import {
  Star,
  Heart,
  Flame,
  Snowflake,
  Leaf,
  Crown,
  Zap,
  Diamond,
  Sparkle,
  Tag,
  Gift,
  Cake,
  CookingPot,
  Flower2,
  type LucideIcon,
} from 'lucide-react';

export const LABEL_ICONS: Record<string, { icon: LucideIcon; label: string }> = {
  star: { icon: Star, label: 'Estrella' },
  heart: { icon: Heart, label: 'Corazón' },
  fire: { icon: Flame, label: 'Fuego' },
  snowflake: { icon: Snowflake, label: 'Copo' },
  leaf: { icon: Leaf, label: 'Hoja' },
  crown: { icon: Crown, label: 'Corona' },
  lightning: { icon: Zap, label: 'Rayo' },
  diamond: { icon: Diamond, label: 'Diamante' },
  sparkle: { icon: Sparkle, label: 'Destello' },
  tag: { icon: Tag, label: 'Etiqueta' },
  gift: { icon: Gift, label: 'Regalo' },
  cake: { icon: Cake, label: 'Pastel' },
  pot: { icon: CookingPot, label: 'Olla' },
  flower: { icon: Flower2, label: 'Flor' },
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
