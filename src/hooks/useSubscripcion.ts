import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from './useToast';
import { redirectToCheckout, redirectToPortal } from '../services/stripeService';

export const useSubscripcion = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const subscribe = async (priceId: string) => {
    setLoading(true);
    try {
      await redirectToCheckout(priceId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      // Si ya tiene suscripción activa, redirigir al portal
      if (msg.includes('already-exists') || msg.includes('Ya tienes una suscripción')) {
        showToast(t('plans.alreadySubscribed'), 'warning');
      } else {
        showToast(t('plans.checkoutError'), 'error');
      }
      setLoading(false);
    }
    // No hacer setLoading(false) en éxito: la página redirige y desmonta el componente
  };

  const manage = async () => {
    setLoading(true);
    try {
      await redirectToPortal();
    } catch {
      showToast(t('plans.portalError'), 'error');
      setLoading(false);
    }
  };

  return { subscribe, manage, loading };
};
