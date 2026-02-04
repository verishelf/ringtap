# Getting ringtap.me indexed in Google

Your site has the right technical setup (sitemap, robots.txt, meta tags). To get **ringtap.me** indexed, use Google Search Console and a few checks below.

## 1. Add your site in Google Search Console

1. Go to [Google Search Console](https://search.google.com/search-console).
2. Click **Add property**.
3. Choose **URL prefix** and enter:
   - `https://www.ringtap.me` (recommended — matches your canonical URL)
   - Also add `https://ringtap.me` if you use it (see step 4).
4. **Verify ownership** using one of these:

   **Option A — HTML tag (easiest with this repo)**  
   - GSC will show a meta tag like:  
     `<meta name="google-site-verification" content="ABC123..." />`  
   - Copy only the **content** value (e.g. `ABC123...`).
   - In **Vercel** → your project → **Settings** → **Environment Variables**, add:
     - Name: `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`
     - Value: `ABC123...` (the content value only)
   - Redeploy. The site already outputs this meta tag when the env var is set.

   **Option B — DNS**  
   - Add the TXT record Google gives you at your domain DNS (where ringtap.me is managed).

5. After verification, open **Sitemaps** in the left menu and submit:
   ```
   https://www.ringtap.me/sitemap.xml
   ```
6. Optionally use **URL Inspection** → enter `https://www.ringtap.me` → **Request indexing** to ask Google to crawl the homepage soon.

## 2. Prefer one domain (www vs non-www)

Your layout uses **www.ringtap.me** as the canonical URL. So:

- In **Vercel** → **Settings** → **Domains**, add both `ringtap.me` and `www.ringtap.me`.
- Set **one** as primary (e.g. redirect `ringtap.me` → `www.ringtap.me`), so Google sees a single canonical version. That avoids duplicate-content issues and helps indexing.

## 3. What’s already in place

- **robots.txt**: Allows crawling; disallows `/api/`; points to `https://www.ringtap.me/sitemap.xml`.
- **sitemap.xml**: Homepage, /store, /privacy (and any other static pages).
- **Meta**: Title, description, Open Graph, Twitter, `robots: index, follow`, canonical to `https://www.ringtap.me`.
- **Structured data**: WebSite, Organization, SoftwareApplication JSON-LD.

## 4. If it’s still not indexed

- **New sites**: Indexing can take a few days to a few weeks. Keep the sitemap submitted and use “Request indexing” for the main URL.
- **Check coverage**: In GSC, open **Pages** / **Indexing** to see if there are errors or “Discovered – currently not indexed” (often a queue/time issue).
- **Confirm live URL**: Open an incognito window and visit `https://www.ringtap.me` and `https://ringtap.me` — the one that loads and matches your canonical should be the one you submit and request indexing for.

Once verified and sitemap is submitted, indexing usually follows; use GSC to monitor and request indexing for important URLs as needed.
