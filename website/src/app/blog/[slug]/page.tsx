import { getPostBySlug, getAllSlugs } from "@/lib/blog";
import { MarkdownContent } from "@/components/MarkdownContent";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

const SITE_URL = "https://www.ringtap.me";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Post not found" };

  return {
    title: post.title,
    description: post.excerpt || post.title,
    keywords: post.tags,
    openGraph: {
      title: post.title,
      description: post.excerpt || post.title,
      url: `${SITE_URL}/blog/${post.slug}`,
      type: "article",
      publishedTime: post.date,
      authors: post.author ? [post.author] : undefined,
      images: post.image ? [{ url: post.image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt || post.title,
    },
    alternates: { canonical: `${SITE_URL}/blog/${post.slug}` },
    robots: { index: true, follow: true },
  };
}

export async function generateStaticParams() {
  const slugs = getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt || post.title,
    datePublished: post.date,
    dateModified: post.date,
    author: post.author
      ? { "@type": "Organization", name: post.author }
      : { "@type": "Organization", name: "RingTap" },
    publisher: {
      "@type": "Organization",
      name: "RingTap",
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/og.png` },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${post.slug}`,
    },
    url: `${SITE_URL}/blog/${post.slug}`,
  };

  return (
    <main className="pt-24 pb-20 px-6">
      <article className="mx-auto max-w-3xl">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-muted-light hover:text-foreground transition-colors mb-8"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to blog
        </Link>

        <header>
          <h1 className="text-3xl font-bold text-foreground md:text-4xl">
            {post.title}
          </h1>
          <div className="mt-2 flex items-center gap-3 text-sm text-muted">
            <time dateTime={post.date}>
              {new Date(post.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            {post.author && (
              <>
                <span aria-hidden>·</span>
                <span>{post.author}</span>
              </>
            )}
          </div>
          {post.tags?.length ? (
            <ul className="mt-2 flex flex-wrap gap-2" role="list">
              {post.tags.map((tag) => (
                <li key={tag}>
                  <span className="rounded bg-surface-elevated px-2 py-0.5 text-xs text-muted-light">
                    {tag}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </header>

        <div className="mt-10">
          <MarkdownContent content={post.content} />
        </div>
      </article>
    </main>
  );
}
