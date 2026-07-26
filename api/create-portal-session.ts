import { getUidFromRequest } from './_lib/auth.js';
import { getStripe, getOrCreateCustomer } from './_lib/stripeClient.js';

export async function POST(request: Request): Promise<Response> {
  let uid: string;
  try {
    uid = await getUidFromRequest(request);
  } catch {
    return Response.json({ error: 'unauthenticated', message: 'Must be logged in' }, { status: 401 });
  }

  const { returnUrl } = (await request.json()) as { returnUrl?: string };

  if (!returnUrl) {
    return Response.json({ error: 'invalid-argument', message: 'Missing required fields' }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const customerId = await getOrCreateCustomer(uid);

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    console.error('create-portal-session error:', err instanceof Error ? err.message : String(err));
    return Response.json({ error: 'internal', message: 'Portal error' }, { status: 500 });
  }
}
