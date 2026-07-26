import { getUidFromRequest } from './_lib/auth.js';
import { getStripe, getOrCreateCustomer } from './_lib/stripeClient.js';

export async function POST(request: Request): Promise<Response> {
  let uid: string;
  try {
    uid = await getUidFromRequest(request);
  } catch {
    return Response.json({ error: 'unauthenticated', message: 'Must be logged in' }, { status: 401 });
  }

  const { priceId, successUrl, cancelUrl } = (await request.json()) as {
    priceId?: string;
    successUrl?: string;
    cancelUrl?: string;
  };

  if (!priceId || !successUrl || !cancelUrl) {
    return Response.json({ error: 'invalid-argument', message: 'Missing required fields' }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const customerId = await getOrCreateCustomer(uid);

    // Si ya tiene suscripción activa, no permitir checkout duplicado
    const existingSubs = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });

    if (existingSubs.data.length > 0) {
      return Response.json(
        {
          error: 'already-exists',
          message: 'Ya tienes una suscripción activa. Usa el portal para cambiar de plan.',
        },
        { status: 409 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: { firebaseUid: uid },
      },
    });

    return Response.json({ url: session.url });
  } catch (err) {
    console.error('create-checkout-session error:', err instanceof Error ? err.message : String(err));
    return Response.json({ error: 'internal', message: 'Checkout error' }, { status: 500 });
  }
}
