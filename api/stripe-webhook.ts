import Stripe from 'stripe';
import { getStripe, getPriceMap, updateUserPlan } from './_lib/stripeClient.js';

export async function POST(request: Request): Promise<Response> {
  const sig = request.headers.get('stripe-signature');
  if (!sig) return new Response('Missing stripe-signature header', { status: 400 });

  const rawBody = await request.text();
  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET as string);
  } catch (err) {
    return new Response(`Webhook Error: ${(err as Error).message}`, { status: 400 });
  }

  const priceMap = getPriceMap();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== 'subscription' || !session.subscription) break;

        const sub = await stripe.subscriptions.retrieve(session.subscription as string);
        const priceId = sub.items.data[0]?.price.id ?? '';
        const plan = priceMap[priceId] ?? 'free';
        await updateUserPlan(session.customer as string, plan);
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const priceId = sub.items.data[0]?.price.id ?? '';
        const plan = priceMap[priceId] ?? 'free';

        if (sub.status === 'active') {
          await updateUserPlan(sub.customer as string, plan);
        } else if (['canceled', 'unpaid', 'past_due'].includes(sub.status)) {
          await updateUserPlan(sub.customer as string, 'free');
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await updateUserPlan(sub.customer as string, 'free');
        break;
      }
    }
  } catch (err) {
    console.error('Error processing webhook:', err);
    return new Response('Internal error', { status: 500 });
  }

  return Response.json({ received: true });
}
