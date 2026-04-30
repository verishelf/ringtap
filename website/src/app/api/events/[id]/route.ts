import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "Missing event id" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json(
      { error: "Server missing Supabase config" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, anonKey);

  const { data, error } = await supabase
    .from("map_events")
    .select("id, name, description, image_url, event_date, latitude, longitude")
    .eq("id", id.trim())
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: data.id,
    name: data.name,
    description: data.description,
    imageUrl: data.image_url,
    eventDate: data.event_date,
    latitude: data.latitude,
    longitude: data.longitude,
  });
}
