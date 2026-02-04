import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

/**
 * First-tap flow: create a new ring with a server-generated ID and claim it for the user.
 * Use when NFC is programmed with just ringtap.me/activate (no ring ID in URL).
 */
export async function POST(request: NextRequest) {
  let body: { user_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const userId = body.user_id?.trim();
  if (!userId) {
    return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Server missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // One ring per user: if they already have a claimed ring, return it
  const { data: existingList } = await supabase
    .from("rings")
    .select("chip_uid, status")
    .eq("owner_user_id", userId)
    .eq("status", "claimed")
    .limit(1);

  const existing = existingList?.[0];
  if (existing?.chip_uid) {
    return NextResponse.json({
      success: true,
      chip_uid: existing.chip_uid,
      already_linked: true,
    });
  }

  const chipUid = randomUUID();

  const { error: insertError } = await supabase.from("rings").insert({
    chip_uid: chipUid,
    status: "claimed",
    owner_user_id: userId,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    chip_uid: chipUid,
    already_linked: false,
  });
}
