import type { Metadata } from "next";

const SITE_URL = "https://www.ringtap.me";

type Props = { params: Promise<{ uid: string }>; children: React.ReactNode };

export async function generateMetadata({ params }: { params: Promise<{ uid: string }> }): Promise<Metadata> {
  const { uid } = await params;
  if (!uid) return { title: "Profile | RingTap" };

  try {
    const base = process.env.NEXT_PUBLIC_APP_URL || SITE_URL;
    const res = await fetch(`${base}/api/profile?uid=${encodeURIComponent(uid)}`, { next: { revalidate: 60 } });
    if (!res.ok) return { title: "Profile | RingTap" };
    const profile = await res.json();
    const name = profile.name || profile.username || "Profile";
    const title = `${name} | RingTap`;
    const description = profile.bio?.slice(0, 160) || `View ${name}'s digital business card on RingTap.`;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `${SITE_URL}/profile/${uid}`,
        type: "profile",
      },
      twitter: { card: "summary", title, description },
      alternates: { canonical: `${SITE_URL}/profile/${uid}` },
      robots: { index: true, follow: true },
    };
  } catch {
    return { title: "Profile | RingTap" };
  }
}

export default function ProfileUidLayout({ children }: Props) {
  return children;
}
