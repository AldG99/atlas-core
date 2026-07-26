import Stripe from 'stripe';
import { adminDb } from './firebaseAdmin.js';

export const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY as string);

// Mapeo de Stripe Price ID → plan interno
export const getPriceMap = (): Record<string, string> => ({
  [process.env.STRIPE_PRICE_PRO as string]: 'pro',
  [process.env.STRIPE_PRICE_BUSINESS as string]: 'enterprise',
});

export async function getOrCreateCustomer(uid: string): Promise<string> {
  const stripe = getStripe();
  const userDoc = await adminDb.collection('users').doc(uid).get();
  const userData = userDoc.data();

  if (!userData) throw new Error('User not found');

  if (userData.stripeCustomerId) return userData.stripeCustomerId as string;

  const customer = await stripe.customers.create({
    email: userData.email as string,
    metadata: { firebaseUid: uid },
  });

  // Solo el servidor puede escribir stripeCustomerId (reglas de Firestore lo protegen)
  await adminDb.collection('users').doc(uid).update({ stripeCustomerId: customer.id });
  return customer.id;
}

export async function updateUserPlan(stripeCustomerId: string, plan: string): Promise<void> {
  const snapshot = await adminDb
    .collection('users')
    .where('stripeCustomerId', '==', stripeCustomerId)
    .limit(1)
    .get();

  if (snapshot.empty) return;
  await snapshot.docs[0].ref.update({ plan });
}
