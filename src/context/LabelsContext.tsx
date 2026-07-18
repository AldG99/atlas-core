import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { Label } from '../types/Product';
import {
  getLabels,
  createLabel,
  deleteLabel,
} from '../services/labelService';
import { getPlanLimits, checkPlanLimit } from '../constants/planLimits';
import i18n from '../i18n';

interface LabelsContextType {
  labels: Label[];
  loading: boolean;
  error: string | null;
  addLabel: (name: string, color: string, icon: string) => Promise<Label | undefined>;
  removeLabel: (id: string) => Promise<void>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const LabelsContext = createContext<LabelsContextType | null>(null);

export const LabelsProvider = ({ children }: { children: ReactNode }) => {
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, businessUid } = useAuth();

  const fetchLabels = useCallback(async () => {
    if (!user || !businessUid) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getLabels(businessUid);
      setLabels(data);
    } catch {
      setError(i18n.t('errors.loadLabelsError'));
    } finally {
      setLoading(false);
    }
  }, [user, businessUid]);

  useEffect(() => {
    if (!user || !businessUid) {
      setLabels([]);
      setLoading(false);
      return;
    }
    fetchLabels();
  }, [user, businessUid, fetchLabels]);

  const addLabel = async (name: string, color: string, icon: string) => {
    if (!user || !businessUid) return;
    const limits = getPlanLimits(user.plan);
    checkPlanLimit(labels.length, limits.labels, i18n.t('common.resources.labels'));
    const created = await createLabel(name, color, icon, businessUid);
    setLabels((prev) => [...prev, created]);
    return created;
  };

  const removeLabel = async (id: string) => {
    await deleteLabel(id);
    setLabels((prev) => prev.filter((l) => l.id !== id));
  };

  return (
    <LabelsContext.Provider value={{ labels, loading, error, addLabel, removeLabel }}>
      {children}
    </LabelsContext.Provider>
  );
};
