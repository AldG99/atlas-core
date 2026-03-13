import { useAuth } from './useAuth';
import { formatCurrency } from '../utils/formatters';

export const useCurrency = () => {
  const { user } = useAuth();
  const currency = user?.moneda ?? 'MXN';

  return {
    currency,
    format: (amount: number) => formatCurrency(amount, currency),
  };
};
