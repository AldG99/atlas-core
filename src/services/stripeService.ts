import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from './firebase';

const fns = getFunctions(auth.app, 'us-central1');

// ── Precios de Stripe (configurar en .env) ────────────────────────────────────
export const STRIPE_PRICES = {
  pro: import.meta.env.VITE_STRIPE_PRICE_PRO as string,
  enterprise: import.meta.env.VITE_STRIPE_PRICE_BUSINESS as string,
} as const;

// ── Checkout: iniciar suscripción nueva ───────────────────────────────────────
export const redirectToCheckout = async (priceId: string): Promise<void> => {
  const createSession = httpsCallable<
    { priceId: string; successUrl: string; cancelUrl: string },
    { url: string }
  >(fns, 'createCheckoutSession');

  const result = await createSession({
    priceId,
    successUrl: `${window.location.origin}/planes?checkout=success`,
    cancelUrl: `${window.location.origin}/planes?checkout=canceled`,
  });

  window.location.href = result.data.url;
};

// ── Portal: gestionar / cambiar / cancelar suscripción existente ──────────────
export const redirectToPortal = async (): Promise<void> => {
  const createPortal = httpsCallable<
    { returnUrl: string },
    { url: string }
  >(fns, 'createPortalSession');

  const result = await createPortal({
    returnUrl: `${window.location.origin}/planes`,
  });

  window.location.href = result.data.url;
};
