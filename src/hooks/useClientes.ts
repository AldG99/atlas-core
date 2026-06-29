import { useContext } from 'react';
import { ClientesContext } from '../context/ClientesContext';

export const useClientes = () => {
  const context = useContext(ClientesContext);
  if (!context) throw new Error('useClientes debe usarse dentro de ClientesProvider');
  return context;
};
