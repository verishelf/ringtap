import { createClient } from "@supabase/supabase-js";
import type { MetadataRoute } from "next";

const BASE = "https://www.ringtap.me";
const RESERVED = new Set(["activate", "privacy", "store", "profile", "api", "setup", "upgrade", "nfc", "qr", "signup", "demo", "terms", "auth"]);

async function getProfileUsernames(): Promise<string[]> {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "").replace(/^["'\s]+|["'\s]+$/g, "").trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").replace(/^["']|["']$/g, "").trim();
  if (!supabaseUrl || !serviceKey) return [];

  try {
    const supabase = createClient(supabaseUrl, serviceKey);
    const { data, error } = await supabase.from("profiles").select("username");
    if (error || !data?.length) return [];
    return data
      .map((r) => (r.username || "").toLowerCase().trim())
      .filter((u) => u && !RESERVED.has(u) && !u.startsWith("user_"));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const profileUsernames = await getProfileUsernames();
  const profileUrls: MetadataRoute.Sitemap = profileUsernames.map((username) => ({
    url: `${BASE}/${username}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [
    {
      url: BASE,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE}/signup`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.95,
    },
    {
      url: `${BASE}/signup?plan=free`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.95,
    },
    {
      url: `${BASE}/signup?plan=pro`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE}/store`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE}/upgrade`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/demo`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...profileUrls,
  ];
}
