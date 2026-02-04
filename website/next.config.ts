import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Universal Links (iOS) and App Links (Android) — serve .well-known via rewrites
  async rewrites() {
    return [
      { source: "/.well-known/apple-app-site-association", destination: "/api/well-known/aasa" },
      { source: "/.well-known/assetlinks.json", destination: "/api/well-known/assetlinks" },
    ];
  },
  // SEO & performance: ensure HTML is compressed (Vercel does this by default)
  compress: true,
  // Prefer static output where possible for faster loads
  poweredByHeader: false,
  // Image optimization (if you add next/image)
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/**" },
      { protocol: "https", hostname: "www.ringtap.me", pathname: "/**" },
    ],
  },
  // Headers for security and caching
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
