import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';

const STRIPE_SECRET = (process.env.STRIPE_SECRET_KEY ?? '').replace(/^["'\s]+|["'\s]+$/g, '').trim();
const PRO_PRICE_ID_MONTHLY = (process.env.STRIPE_PRO_PRICE_ID ?? '').replace(/^["'\s]+|["'\s]+$/g, '').trim();
const PRO_PRICE_ID_YEARLY = (process.env.STRIPE_PRO_PRICE_ID_YEARLY ?? '').replace(/^["'\s]+|["'\s]+$/g, '').trim();
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.ringtap.me';

export async function POST(request: NextRequest) {
  if (!STRIPE_SECRET || !PRO_PRICE_ID_MONTHLY) {
    return NextResponse.json(
      {
        error: 'Stripe not configured. Add STRIPE_SECRET_KEY and STRIPE_PRO_PRICE_ID (monthly). Optionally STRIPE_PRO_PRICE_ID_YEARLY for yearly.',
      },
      { status: 500 }
    );
  }

  let body: { email?: string; user_id?: string; interval?: 'month' | 'year' };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const interval = body.interval === 'year' ? 'year' : 'month';
  const priceId = interval === 'year' && PRO_PRICE_ID_YEARLY ? PRO_PRICE_ID_YEARLY : PRO_PRICE_ID_MONTHLY;

  const stripe = new Stripe(STRIPE_SECRET);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${BASE_URL}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/upgrade?email=${encodeURIComponent(email)}${body.user_id ? `&user_id=${encodeURIComponent(body.user_id)}` : ''}`,
      metadata: body.user_id ? { user_id: body.user_id } : undefined,
      subscription_data: {
        metadata: body.user_id ? { user_id: body.user_id } : undefined,
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Stripe error: ${message}` }, { status: 500 });
  }
}
