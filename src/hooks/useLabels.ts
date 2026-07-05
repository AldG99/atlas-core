import { useContext } from 'react';
import { LabelsContext } from '../context/LabelsContext';

export const useLabels = () => {
  const context = useContext(LabelsContext);
  if (!context) throw new Error('useLabels debe usarse dentro de LabelsProvider');
  return context;
};
