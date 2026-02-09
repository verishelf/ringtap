import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const STRIPE_SECRET = (process.env.STRIPE_SECRET_KEY ?? '').replace(/^["'\s]+|["'\s]+$/g, '').trim();
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.ringtap.me';

/**
 * Creates a Stripe Billing Portal session so the user can cancel or update their subscription.
 * Requires Authorization: Bearer <supabase_jwt>.
 */
export async function POST(request: NextRequest) {
  if (!STRIPE_SECRET) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 });
  }

  const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '')
    .replace(/^["'\s]+|["'\s]+$/g, '')
    .trim();
  const supabaseUrl = rawUrl && !/^https?:\/\//i.test(rawUrl) ? 'https://' + rawUrl : rawUrl;
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').replace(/^["']|["']$/g, '').trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/^["']|["']$/g, '').trim();
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Server missing Supabase config' }, { status: 500 });
  }

  const supabaseAnon = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error: userError } = await supabaseAnon.auth.getUser(token);
  if (userError || !user) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const { data: sub, error: subError } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (subError || !sub?.stripe_customer_id) {
    return NextResponse.json(
      { error: 'No active subscription found. You can cancel from the Stripe portal if you have an existing subscription.' },
      { status: 400 }
    );
  }

  const stripe = new Stripe(STRIPE_SECRET);
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${BASE_URL}/upgrade`,
    });
    if (!session.url) {
      return NextResponse.json({ error: 'Could not create portal session' }, { status: 500 });
    }
    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Stripe error: ${message}` }, { status: 500 });
  }
}
