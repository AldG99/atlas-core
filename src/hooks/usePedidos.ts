import { useContext } from 'react';
import { PedidosContext } from '../context/PedidosContext';

export { buildCreadoPor } from '../context/PedidosContext';

export const usePedidos = () => {
  const context = useContext(PedidosContext);
  if (!context) throw new Error('usePedidos debe usarse dentro de PedidosProvider');
  return context;
};
