import { useContext } from 'react';
import { OrdersContext } from '../context/OrdersContext';

export const useOrders = () => {
  const context = useContext(OrdersContext);
  if (!context) throw new Error('useOrders debe usarse dentro de OrdersProvider');
  return context;
};
