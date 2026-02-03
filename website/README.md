# RingTap — Marketing Website

Next.js marketing site for [RingTap](https://ringtap.me): your digital business card. Lives in the **`website/`** folder in the repo. Theme matches the mobile app (futuristic monochrome).

## Stack

- **Next.js** (App Router)
- **Tailwind CSS v4**
- **TypeScript**

## Environment variables

Required for `/api/activate`, `/api/ring/*`, and profile APIs:

| Variable | Required | Where to get it |
|----------|----------|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase → **Project Settings** → **API** → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (for activate/claim) | Same page → **service_role** (secret; server-only) |

Copy `.env.example` to `.env.local` and fill in the values. Never commit `.env.local` or the service role key.

## Run locally

```bash
cp .env.example .env.local
# Edit .env.local with your Supabase URL and service_role key

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Theme

Colors align with the RingTap app:

- **Background:** `#0A0A0B`
- **Foreground:** `#FAFAFA`
- **Surface:** `#141416` / `#1A1A1D`
- **Accent:** `#E4E4E7`
- **Borders / muted:** zinc/silver grays

## Build

```bash
npm run build
npm start
```

## Links

- **App Store:** Replace `#download` / `https://apps.apple.com/app/ringtap` with your real App Store URL when published.
- **Google Play:** Replace `https://play.google.com/store/apps/details?id=me.ringtap.app` with your real Play Store URL when published.
