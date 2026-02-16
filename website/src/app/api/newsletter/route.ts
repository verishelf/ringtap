import { NextResponse } from "next/server";

/**
 * Newsletter signup. Stores email for marketing/updates.
 * Wire to Supabase, Resend, Mailchimp, etc. as needed.
 */
export async function POST(req: Request) {
  try {
    const { email } = (await req.json()) as { email?: string };
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // TODO: Store in Supabase, Resend, Mailchimp, etc.
    // For now, log and return success
    console.log("[Newsletter] Signup:", trimmed);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
