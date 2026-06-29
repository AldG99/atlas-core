import { useContext } from 'react';
import { EtiquetasContext } from '../context/EtiquetasContext';

export const useEtiquetas = () => {
  const context = useContext(EtiquetasContext);
  if (!context) throw new Error('useEtiquetas debe usarse dentro de EtiquetasProvider');
  return context;
};
