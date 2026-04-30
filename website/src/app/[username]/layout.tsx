import type { Metadata } from "next";

const SITE_URL = "https://www.ringtap.me";

const RESERVED = new Set(["activate", "privacy", "store", "profile", "api", "pro"]);

type Props = { params: Promise<{ username: string }>; children: React.ReactNode };

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const slug = username?.toLowerCase();
  if (!slug || RESERVED.has(slug)) return { title: "Profile | RingTap" };

  try {
    const base = process.env.NEXT_PUBLIC_APP_URL || SITE_URL;
    const res = await fetch(`${base}/api/profile?username=${encodeURIComponent(slug)}`, { next: { revalidate: 60 } });
    if (!res.ok) return { title: "Profile | RingTap" };
    const profile = await res.json();
    const name = profile.name || profile.username || "Profile";
    const title = `${name} | RingTap`;
    const description = profile.bio?.slice(0, 160) || `View ${name}'s digital business card on RingTap.`;
    const profileUrl = `${SITE_URL}/${slug}`;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: profileUrl,
        type: "profile",
      },
      twitter: { card: "summary", title, description },
      alternates: { canonical: profileUrl },
      robots: { index: true, follow: true },
      other: {
        "apple-itunes-app": `app-id=6758565822, app-argument=${profileUrl}`,
      },
    };
  } catch {
    return { title: "Profile | RingTap" };
  }
}

export default function UsernameLayout({ children }: Props) {
  return children;
}
