import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(request: NextRequest) {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "")
    .replace(/^["'\s]+|["'\s]+$/g, "")
    .trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "")
    .replace(/^["']|["']$/g, "")
    .trim();

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: "Server not configured for affiliates" },
      { status: 500 }
    );
  }

  let body: { name?: string; email?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!name || !email) {
    return NextResponse.json(
      { error: "Name and email are required" },
      { status: 400 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // Check if email already has an affiliate code
  const { data: existing } = await supabase
    .from("affiliates")
    .select("code")
    .ilike("email", email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ code: existing.code });
  }

  // Create new affiliate with unique code
  let code: string;
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    code = generateCode();
    const { error: insertError } = await supabase.from("affiliates").insert({
      code,
      name,
      email,
      status: "active",
    });
    if (!insertError) {
      return NextResponse.json({ code });
    }
    if ((insertError as { code?: string }).code === "23505") {
      // Unique violation - code collision, try again
      attempts++;
      continue;
    }
    const errMsg = (insertError as { message?: string }).message ?? String(insertError);
    console.error("[affiliates/register]", insertError);
    const userMsg = errMsg.includes("relation") || errMsg.includes("does not exist")
      ? "Affiliates table not found. Run Supabase migrations 007_affiliates and 008_affiliate_payouts."
      : "Could not create affiliate. Try again.";
    return NextResponse.json(
      { error: userMsg },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { error: "Could not generate unique code" },
    { status: 500 }
  );
}
