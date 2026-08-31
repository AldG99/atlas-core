import type { Product } from '../types/Product';

// Un descuento está activo solo si tiene un porcentaje > 0 y su fecha de fin
// no ha pasado (se compara por día, ignorando la hora).
export const isDiscountActive = (p: Product): boolean => {
  if (!p.discount || p.discount <= 0) return false;
  if (!p.discountEndDate) return false;
  return new Date(p.discountEndDate) >= new Date(new Date().toDateString());
};

export const getDiscountedPrice = (price: number, discount: number): number =>
  price * (1 - discount / 100);
