import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './useToast';
import { savePlantillas } from '../services/templateService';
import { type Plantillas, PLANTILLAS_DEFAULT } from '../types/User';

export const useTemplates = () => {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();

  const current: Plantillas = {
    confirmacion: user?.plantillas?.confirmacion ?? PLANTILLAS_DEFAULT.confirmacion,
    preparacion:  user?.plantillas?.preparacion  ?? PLANTILLAS_DEFAULT.preparacion,
    entrega:      user?.plantillas?.entrega      ?? PLANTILLAS_DEFAULT.entrega,
  };

  const [draft, setDraft] = useState<Plantillas>(current);
  const [saving, setSaving] = useState(false);

  const reset = useCallback(() => {
    setDraft(current);
  }, [current.confirmacion, current.preparacion, current.entrega]);

  const resetToDefaults = useCallback(() => {
    setDraft(PLANTILLAS_DEFAULT);
  }, []);

  const save = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    try {
      await savePlantillas(user.uid, draft);
      await updateProfile({ plantillas: draft });
      showToast('Plantillas guardadas', 'success');
    } catch {
      showToast('Error al guardar las plantillas', 'error');
    } finally {
      setSaving(false);
    }
  }, [user, draft, updateProfile, showToast]);

  const isDirty =
    draft.confirmacion !== current.confirmacion ||
    draft.preparacion  !== current.preparacion  ||
    draft.entrega      !== current.entrega;

  return { draft, setDraft, saving, isDirty, save, reset, resetToDefaults };
};
