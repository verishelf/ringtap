import type { MetadataRoute } from "next";

const BASE = "https://www.ringtap.me";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/"],
      },
      // Allow AI crawlers for LLM indexing (blog, content)
      { userAgent: "GPTBot", allow: "/", disallow: ["/api/"] },
      { userAgent: "Claude-Web", allow: "/", disallow: ["/api/"] },
      { userAgent: "anthropic-ai", allow: "/", disallow: ["/api/"] },
      { userAgent: "PerplexityBot", allow: "/", disallow: ["/api/"] },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
