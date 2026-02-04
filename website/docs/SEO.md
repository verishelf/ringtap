# RingTap.me — SEO & Performance

## Implemented

### 1. Meta tags (root + per-page)
- **Root layout:** Default title, description, keywords, `metadataBase`, canonical.
- **Home:** Title, description, keywords, Open Graph, canonical.
- **Store:** Title, description, OG, Twitter, canonical (via `store/layout.tsx`).
- **Privacy:** Title, description, OG, Twitter, canonical.
- **Activate:** Title, description, `robots: { index: false }` (redirect-only).
- **Profile [uid]:** Dynamic `generateMetadata` from API (name, bio, canonical).

### 2. Open Graph & Twitter
- Default OG/Twitter in root layout (`siteName`, `url`, `images`).
- Per-page overrides where needed.
- **Add an image:** Place a 1200×630 image at `public/og.png` for social cards.

### 3. JSON-LD
- **WebSite** (root): name, url, description, SearchAction.
- **Organization** (root): name, url, logo, description.
- **SoftwareApplication** (root): app name, category, offers (Free/Pro).
- **Store:** CollectionPage + ItemList of Products with offers.

### 4. Technical
- **robots.txt:** `src/app/robots.ts` — allow `/`, disallow `/api/`, sitemap URL.
- **Sitemap:** `src/app/sitemap.ts` — `/`, `/store`, `/privacy` (static). Add profile URLs later if needed.
- **Activate:** noindex via metadata so redirect-only pages aren’t indexed.
- **Security headers:** `next.config.ts` — X-Frame-Options, X-Content-Type-Options, Referrer-Policy, DNS prefetch.
- **`poweredByHeader: false`** in Next config.

### 5. On-page (home)
- Single clear **H1**: “Your digital business card. One tap.”
- **H2** sections: How it works, Features, Pricing, FAQ, Get RingTap.
- **Keywords** in copy: digital business card, NFC, QR, ringtap.me, profile, links.
- Footer **nav** with `aria-label` for accessibility.
- **Canonical** and **alternates** set on all main pages.

---

## Recommended next steps

### OG image
- Add **`public/og.png`** (1200×630) with logo + tagline so social shares look correct.
- Optionally use `opengraph-image.png` / `twitter-image.png` per route (Next.js convention).

### Google / Bing
- In **Google Search Console** and **Bing Webmaster Tools**, add property for `https://www.ringtap.me` and verify (e.g. meta tag or DNS).
- Add the verification codes to `layout.tsx` under `metadata.verification.google` and `metadata.verification.yandex` (Bing uses same as Yandex sometimes; check their UI).

### Core Web Vitals & performance
- **LCP:** Use `next/image` for any large images; preload critical assets if needed.
- **CLS:** Give images/embeds explicit width/height or use `aspect-ratio` in CSS.
- **INP/FID:** Keep main thread light; the site is mostly static so should be fine.
- **Fonts:** Already using `next/font` (Geist) with `display: swap` by default.
- **Caching:** Vercel sets cache headers; for profile API consider `revalidate` (already 60s in profile layout).
- **Lazy load:** Below-the-fold content can be lazy-loaded if you add heavy components later.

### Sitemap index (optional)
- If you have many profile URLs, add a sitemap index that links to:
  - Static sitemap (current)
  - Dynamic sitemap of profile URLs (e.g. from Supabase or an API).

### Profile URLs
- To index many `ringtap.me/username` pages, either:
  - Keep `generateMetadata` and allow crawling of `/profile/[uid]`, and/or
  - Add profile URLs to the sitemap (e.g. fetch usernames from DB and output URLs in `sitemap.ts` or a separate sitemap route).

---

## Checklist

- [x] Meta title/description/keywords on all main pages
- [x] Open Graph and Twitter Card tags
- [x] JSON-LD (WebSite, Organization, SoftwareApplication, Store)
- [x] robots.txt and sitemap.xml
- [x] Canonical URLs
- [x] noindex on activate (redirect-only)
- [x] Security and cache-friendly headers
- [ ] Add `public/og.png` (1200×630)
- [ ] Verify domain in Google Search Console / Bing
- [ ] Optional: verification meta tags in layout
