import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ringId = searchParams.get("r");

  if (!ringId?.trim()) {
    return NextResponse.json({ error: "Missing ring id" }, { status: 400 });
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

  const id = ringId.trim();

  let { data: ring } = await supabase
    .from("rings")
    .select("chip_uid, status")
    .eq("chip_uid", id)
    .single();

  if (!ring) {
    const { error: insertError } = await supabase.from("rings").insert({
      chip_uid: id,
      status: "unclaimed",
    });

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }
  }

  const deepLink = `ringtap://activate?r=${encodeURIComponent(id)}`;

  return NextResponse.json({ deepLink });
}
