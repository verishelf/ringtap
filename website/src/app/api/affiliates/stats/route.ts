import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const MIN_PAYOUT_CENTS = 2500; // $25 minimum
const COMMISSION_PER_PRO_CENTS = 500; // $5 per Pro conversion

export async function GET(request: NextRequest) {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "")
    .replace(/^["'\s]+|["'\s]+$/g, "")
    .trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "")
    .replace(/^["']|["']$/g, "")
    .trim();

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const code = request.nextUrl.searchParams.get("code")?.trim();
  const email = request.nextUrl.searchParams.get("email")?.trim().toLowerCase();
  if (!code || !email) {
    return NextResponse.json({ error: "code and email required" }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: affiliate, error: affError } = await supabase
    .from("affiliates")
    .select("code, email, name")
    .eq("code", code.toUpperCase())
    .ilike("email", email)
    .maybeSingle();

  if (affError || !affiliate) {
    return NextResponse.json({ error: "Invalid code or email" }, { status: 404 });
  }

  const { data: referrals } = await supabase
    .from("affiliate_referrals")
    .select("id, type, amount_cents, payout_id, created_at")
    .eq("affiliate_code", affiliate.code)
    .order("created_at", { ascending: false });

  const proReferrals = referrals?.filter((r) => r.type === "pro") ?? [];
  const totalEarningsCents = referrals?.reduce((sum, r) => sum + (r.amount_cents ?? 0), 0) ?? 0;
  const paidCents =
    referrals?.filter((r) => r.payout_id).reduce((sum, r) => sum + (r.amount_cents ?? 0), 0) ?? 0;
  const pendingCents = totalEarningsCents - paidCents;
  const canRequestPayout = pendingCents >= MIN_PAYOUT_CENTS;

  const { data: payouts } = await supabase
    .from("affiliate_payouts")
    .select("id, amount_cents, status, payout_method, requested_at, paid_at")
    .eq("affiliate_code", affiliate.code)
    .order("requested_at", { ascending: false });

  return NextResponse.json({
    code: affiliate.code,
    name: affiliate.name,
    totalReferrals: referrals?.length ?? 0,
    proConversions: proReferrals.length,
    totalEarningsCents,
    pendingCents,
    paidCents,
    canRequestPayout,
    minPayoutCents: MIN_PAYOUT_CENTS,
    commissionPerProCents: COMMISSION_PER_PRO_CENTS,
    payouts: payouts ?? [],
    recentReferrals: (referrals ?? []).slice(0, 20),
  });
}
