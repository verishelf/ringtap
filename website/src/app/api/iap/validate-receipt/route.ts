/**
 * IAP Receipt Validation API
 *
 * Validates Apple/Google receipts and upserts the subscription in Supabase.
 * For Apple: uses the legacy verifyReceipt endpoint (still supported).
 * Requires APPLE_SHARED_SECRET env var from App Store Connect → App → App Information → App-Specific Shared Secret.
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const APPLE_SHARED_SECRET = (process.env.APPLE_SHARED_SECRET ?? '').replace(/^["'\s]+|["'\s]+$/g, '').trim();
const APPLE_VERIFY_URL = 'https://buy.itunes.apple.com/verifyReceipt';
const APPLE_SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt';

async function verifyAppleReceipt(receiptBase64: string): Promise<{ valid: boolean; expiresMs?: number }> {
  if (!APPLE_SHARED_SECRET) {
    console.error('[iap] APPLE_SHARED_SECRET not set');
    return { valid: false };
  }

  const body = {
    'receipt-data': receiptBase64,
    password: APPLE_SHARED_SECRET,
    'exclude-old-transactions': true,
  };

  // Try production first, then sandbox
  for (const url of [APPLE_VERIFY_URL, APPLE_SANDBOX_URL]) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as {
      status: number;
      latest_receipt_info?: Array<{ expires_date_ms?: string; product_id?: string }>;
      receipt?: { in_app?: Array<{ expires_date_ms?: string; product_id?: string }> };
    };

    // 21007 = receipt is sandbox, try sandbox URL (we already do in loop)
    if (data.status === 21007) continue;
    if (data.status !== 0) {
      return { valid: false };
    }

    const inApp = data.latest_receipt_info ?? data.receipt?.in_app ?? [];
    const proProductIds = ['006', '007'];
    const proItems = inApp.filter((i) => proProductIds.includes(i.product_id ?? ''));
    if (proItems.length === 0) return { valid: false };

    const sorted = proItems.sort((a, b) => {
      const aMs = parseInt(a.expires_date_ms ?? '0', 10);
      const bMs = parseInt(b.expires_date_ms ?? '0', 10);
      return bMs - aMs;
    });
    const latest = sorted[0];
    const expiresMs = latest?.expires_date_ms ? parseInt(latest.expires_date_ms, 10) : undefined;
    const now = Date.now();
    if (expiresMs && expiresMs < now) {
      // Subscription expired
      return { valid: false };
    }
    return { valid: true, expiresMs };
  }

  return { valid: false };
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '').replace(/^["'\s]+|["'\s]+$/g, '').trim();
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').replace(/^["']|["']$/g, '').trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').replace(/^["']|["']$/g, '').trim();
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Server config error' }, { status: 500 });
  }

  const supabaseAnon = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error: userError } = await supabaseAnon.auth.getUser(token);
  if (userError || !user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  let body: { userId?: string; receipt?: string };
  try {
    body = (await request.json()) as { userId?: string; receipt?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const receipt = (body.receipt ?? '').trim();
  const userId = body.userId ?? user.id;
  if (userId !== user.id) {
    return NextResponse.json({ error: 'User mismatch' }, { status: 403 });
  }
  if (!receipt) {
    return NextResponse.json({ error: 'Missing receipt' }, { status: 400 });
  }

  const result = await verifyAppleReceipt(receipt);
  if (!result.valid) {
    return NextResponse.json({ ok: false, error: 'Invalid or expired receipt' }, { status: 200 });
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('stripe_subscription_id')
    .eq('user_id', userId)
    .maybeSingle();

  // Don't overwrite Stripe subscription with IAP (Stripe is source of truth)
  if (existing?.stripe_subscription_id) {
    return NextResponse.json({ ok: true }); // Already Pro via Stripe
  }

  const periodEnd = result.expiresMs ? new Date(result.expiresMs).toISOString() : null;
  const { error: upsertError } = await supabase.from('subscriptions').upsert(
    {
      user_id: userId,
      plan: 'pro',
      status: 'active',
      stripe_customer_id: null,
      stripe_subscription_id: null,
      current_period_end: periodEnd,
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (upsertError) {
    console.error('[iap] Supabase upsert error:', upsertError);
    return NextResponse.json({ ok: false, error: 'Failed to update subscription' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
