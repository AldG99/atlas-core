import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './useToast';
import { saveTemplates } from '../services/templateService';
import { type Templates, DEFAULT_TEMPLATES } from '../types/User';

export const useTemplates = () => {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();

  const current: Templates = {
    confirmation: user?.templates?.confirmation ?? DEFAULT_TEMPLATES.confirmation,
    preparing:    user?.templates?.preparing    ?? DEFAULT_TEMPLATES.preparing,
    delivery:     user?.templates?.delivery     ?? DEFAULT_TEMPLATES.delivery,
  };

  const [draft, setDraft] = useState<Templates>(current);
  const [saving, setSaving] = useState(false);

  const reset = useCallback(() => {
    setDraft({
      confirmation: user?.templates?.confirmation ?? DEFAULT_TEMPLATES.confirmation,
      preparing:    user?.templates?.preparing    ?? DEFAULT_TEMPLATES.preparing,
      delivery:     user?.templates?.delivery     ?? DEFAULT_TEMPLATES.delivery,
    });
  }, [user?.templates?.confirmation, user?.templates?.preparing, user?.templates?.delivery]);

  const resetToDefaults = useCallback(() => {
    setDraft(DEFAULT_TEMPLATES);
  }, []);

  const save = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    try {
      await saveTemplates(user.uid, draft);
      await updateProfile({ templates: draft });
      showToast('Plantillas guardadas', 'success');
    } catch {
      showToast('Error al guardar las plantillas', 'error');
    } finally {
      setSaving(false);
    }
  }, [user, draft, updateProfile, showToast]);

  const isDirty =
    draft.confirmation !== current.confirmation ||
    draft.preparing    !== current.preparing    ||
    draft.delivery      !== current.delivery;

  return { draft, setDraft, saving, isDirty, save, reset, resetToDefaults };
};
