import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const MIN_PAYOUT_CENTS = 2500; // $25 minimum

export async function POST(request: NextRequest) {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "")
    .replace(/^["'\s]+|["'\s]+$/g, "")
    .trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "")
    .replace(/^["']|["']$/g, "")
    .trim();

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  let body: { code?: string; email?: string; payout_method?: string; payout_details?: Record<string, string> };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const payoutMethod = body.payout_method === "paypal" ? "paypal" : "paypal";
  const payoutDetails = body.payout_details && typeof body.payout_details === "object" ? body.payout_details : {};

  if (!code || !email) {
    return NextResponse.json({ error: "code and email required" }, { status: 400 });
  }

  const paypalEmail = payoutDetails.email ?? payoutDetails.paypal_email ?? "";
  if (payoutMethod === "paypal" && !paypalEmail) {
    return NextResponse.json({ error: "PayPal email required" }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: affiliate, error: affError } = await supabase
    .from("affiliates")
    .select("code, email")
    .eq("code", code)
    .ilike("email", email)
    .maybeSingle();

  if (affError || !affiliate) {
    return NextResponse.json({ error: "Invalid code or email" }, { status: 404 });
  }

  const { data: unpaidReferrals } = await supabase
    .from("affiliate_referrals")
    .select("id, amount_cents")
    .eq("affiliate_code", code)
    .is("payout_id", null);

  const pendingCents = unpaidReferrals?.reduce((sum, r) => sum + (r.amount_cents ?? 0), 0) ?? 0;
  if (pendingCents < MIN_PAYOUT_CENTS) {
    return NextResponse.json(
      { error: `Minimum payout is $${MIN_PAYOUT_CENTS / 100}. You have $${(pendingCents / 100).toFixed(2)} pending.` },
      { status: 400 }
    );
  }

  const { data: payout, error: payoutError } = await supabase
    .from("affiliate_payouts")
    .insert({
      affiliate_code: code,
      amount_cents: pendingCents,
      status: "pending",
      payout_method: payoutMethod,
      payout_details: payoutMethod === "paypal" ? { email: paypalEmail } : payoutDetails,
    })
    .select("id, amount_cents, status, requested_at")
    .single();

  if (payoutError || !payout) {
    console.error("[affiliates/request-payout]", payoutError);
    return NextResponse.json({ error: "Could not create payout request" }, { status: 500 });
  }

  await supabase
    .from("affiliate_referrals")
    .update({ payout_id: payout.id })
    .eq("affiliate_code", code)
    .is("payout_id", null);

  return NextResponse.json({
    ok: true,
    payout: {
      id: payout.id,
      amountCents: payout.amount_cents,
      status: payout.status,
      requestedAt: payout.requested_at,
    },
    message: `Payout of $${(payout.amount_cents / 100).toFixed(2)} requested. We'll process it within 5–7 business days.`,
  });
}
