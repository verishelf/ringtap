import { getAllPosts } from "@/lib/blog";
import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = "https://www.ringtap.me";

export const metadata: Metadata = {
  title: "Blog — Digital Business Card Tips & Guides",
  description:
    "RingTap blog: guides on digital business cards, NFC rings, QR codes, contact sharing, and networking. Learn how to share your profile instantly.",
  keywords: [
    "digital business card blog",
    "NFC ring guide",
    "QR code business card",
    "contact sharing tips",
    "networking",
    "ringtap",
  ],
  openGraph: {
    title: "Blog — RingTap | Digital Business Card Tips & Guides",
    description: "Guides on digital business cards, NFC rings, QR codes, and contact sharing.",
    url: `${SITE_URL}/blog`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog — RingTap",
    description: "Guides on digital business cards, NFC rings, QR codes, and contact sharing.",
  },
  alternates: { canonical: `${SITE_URL}/blog` },
  robots: { index: true, follow: true },
};

const blogJsonLd = {
  "@context": "https://schema.org",
  "@type": "Blog",
  name: "RingTap Blog",
  description: "Guides on digital business cards, NFC rings, QR codes, and contact sharing.",
  url: `${SITE_URL}/blog`,
  publisher: {
    "@type": "Organization",
    name: "RingTap",
    url: SITE_URL,
  },
};

export default async function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      <main className="pt-24 pb-20 px-6">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold text-foreground md:text-4xl">
            Blog
          </h1>
          <p className="mt-2 text-muted-light">
            Tips and guides on digital business cards, NFC rings, QR codes, and
            contact sharing.
          </p>

          <ul className="mt-12 space-y-8" role="list">
            {posts.map((post) => (
              <li key={post.slug}>
                <article className="border-b border-border-light/50 pb-8 last:border-0">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group block"
                  >
                    <h2 className="text-xl font-semibold text-foreground group-hover:text-accent transition-colors">
                      {post.title}
                    </h2>
                    <time
                      dateTime={post.date}
                      className="mt-1 block text-sm text-muted"
                    >
                      {new Date(post.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>
                    {post.excerpt && (
                      <p className="mt-2 text-muted-light leading-relaxed line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}
                  </Link>
                </article>
              </li>
            ))}
          </ul>

          {posts.length === 0 && (
            <p className="mt-12 text-muted-light">No posts yet. Check back soon.</p>
          )}
        </div>
      </main>
    </div>
  );
}
