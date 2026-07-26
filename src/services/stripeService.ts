import { auth } from './firebase';
import { ROUTES } from '../config/routes';

// ── Precios de Stripe (configurar en .env) ────────────────────────────────────
export const STRIPE_PRICES = {
  pro: import.meta.env.VITE_STRIPE_PRICE_PRO as string,
  enterprise: import.meta.env.VITE_STRIPE_PRICE_BUSINESS as string,
} as const;

const callApi = async <T>(path: string, body: unknown): Promise<T> => {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error('Must be logged in');

  const response = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message ?? data.error ?? 'Request failed');

  return data as T;
};

// ── Checkout: iniciar suscripción nueva ───────────────────────────────────────
export const redirectToCheckout = async (priceId: string): Promise<void> => {
  const result = await callApi<{ url: string }>('/api/create-checkout-session', {
    priceId,
    successUrl: `${window.location.origin}${ROUTES.PLANS}?checkout=success`,
    cancelUrl: `${window.location.origin}${ROUTES.PLANS}?checkout=canceled`,
  });

  window.location.href = result.url;
};

// ── Portal: gestionar / cambiar / cancelar suscripción existente ──────────────
export const redirectToPortal = async (): Promise<void> => {
  const result = await callApi<{ url: string }>('/api/create-portal-session', {
    returnUrl: `${window.location.origin}${ROUTES.PLANS}`,
  });

  window.location.href = result.url;
};
