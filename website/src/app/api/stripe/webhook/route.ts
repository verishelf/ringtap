import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';

const STRIPE_SECRET = (process.env.STRIPE_SECRET_KEY ?? '').replace(/^["'\s]+|["'\s]+$/g, '').trim();
const WEBHOOK_SECRET = (process.env.STRIPE_WEBHOOK_SECRET ?? '').replace(/^["'\s]+|["'\s]+$/g, '').trim();

export async function POST(request: NextRequest) {
  if (!STRIPE_SECRET || !WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Stripe webhook not configured (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET)' },
      { status: 500 }
    );
  }

  const rawBody = await request.text();
  const sig = request.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = new Stripe(STRIPE_SECRET);
    event = stripe.webhooks.constructEvent(rawBody, sig, WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
  }

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '').replace(/^["'\s]+|["'\s]+$/g, '');
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').replace(/^["']|["']$/g, '').trim();
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const stripe = new Stripe(STRIPE_SECRET);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = (session.metadata?.user_id ?? '').trim();
        const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id ?? null;

        if (!userId) {
          console.warn('[stripe-webhook] checkout.session.completed missing user_id in metadata');
          break;
        }

        let subStatus = 'active';
        let currentPeriodEnd: string | null = null;

        if (subscriptionId) {
          try {
            const sub = await stripe.subscriptions.retrieve(subscriptionId);
            subStatus = sub.status ?? 'active';
            currentPeriodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null;
          } catch {
            // use defaults
          }
        }

        await supabase.from('subscriptions').upsert(
          {
            user_id: userId,
            plan: 'pro',
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            status: subStatus,
            current_period_end: currentPeriodEnd,
            cancel_at_period_end: false,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const subId = subscription.id;
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id ?? null;
        const userId = (subscription.metadata?.user_id ?? '').trim();
        const status = event.type === 'customer.subscription.deleted' ? 'canceled' : (subscription.status ?? 'active');
        const currentPeriodEnd = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null;
        const plan = status === 'active' ? 'pro' : 'free';

        const updatePayload = {
          plan,
          status,
          current_period_end: currentPeriodEnd,
          cancel_at_period_end: subscription.cancel_at_period_end ?? false,
          updated_at: new Date().toISOString(),
        };

        if (userId) {
          await supabase.from('subscriptions').upsert(
            {
              user_id: userId,
              ...updatePayload,
              stripe_customer_id: customerId,
              stripe_subscription_id: subId,
            },
            { onConflict: 'user_id' }
          );
        } else {
          const { data: existing } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', subId)
            .single();

          if (existing) {
            await supabase.from('subscriptions').update(updatePayload).eq('user_id', existing.user_id);
          }
        }
        break;
      }

      default:
        // Unhandled event type
        break;
    }
  } catch (err) {
    console.error('[stripe-webhook]', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
