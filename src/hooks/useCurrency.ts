import { useAuth } from './useAuth';
import { formatCurrency } from '../utils/formatters';

// Migración: usuarios con código ISO guardado antes del cambio
const LEGACY_MAP: Record<string, string> = {
  MXN: '$', USD: '$', EUR: '€', COP: '$', ARS: '$', CLP: '$', PEN: 'S/', BRL: 'R$', GTQ: 'Q',
};

export const useCurrency = () => {
  const { user } = useAuth();
  const raw = user?.moneda ?? '$';
  const simbolo = LEGACY_MAP[raw] ?? raw;

  return {
    simbolo,
    format: (amount: number) => formatCurrency(amount, simbolo),
  };
};
