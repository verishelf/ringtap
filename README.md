# RingTap

NFC-powered digital business card platform — a modern competitor to Dot.cards. Built with **Expo**, **TypeScript**, **Expo Router**, **Supabase**, and **Stripe**.

## Features

- **Auth**: Email/password, magic links, persistent session (Expo Secure Store)
- **Profile**: Name, title, bio, avatar, video intro (Pro), contact & social links, custom buttons, theme (Pro), profile URL `https://ringtap.me/{username}`
- **Links**: Social, websites, custom buttons, payment links — Free: 2 links, Pro: unlimited
- **Share**: NFC instructions + test, QR code generation & share
- **Analytics**: Profile views, link clicks, NFC taps, QR scans, 7/30/90-day activity (Pro)
- **Subscriptions**: Free & Pro plans; Stripe checkout/portal (wire via your backend + Supabase webhooks)

## Get started

### 1. Install dependencies

```bash
npm install
```

### 2. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Run the migration: **SQL Editor** → paste and run `supabase/migrations/001_initial.sql`.
3. Copy **Project URL** and **anon public** key into `.env` (see below).

### 3. Environment

Copy `.env.example` to `.env` and set:

```bash
cp .env.example .env
```

- `EXPO_PUBLIC_SUPABASE_URL` — Supabase project URL  
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key  

### 4. Start the app

```bash
npx expo start
```

Then open in iOS Simulator, Android emulator, or Expo Go.

## Project structure

```
app/
  index.tsx           # Auth redirect
  (auth)/             # Login, signup
  (tabs)/             # Home, Profile, Links, Analytics, Settings
  share/              # NFC, QR
components/
contexts/             # AuthContext
hooks/                # useSession, useProfile, useSubscription
lib/
  api.ts              # Backend API (profiles, links, analytics, storage)
  supabase/           # supabaseClient, types, database.types
utils/
supabase/
  migrations/         # 001_initial.sql
```

## Calendly (Schedule button)

Add your Calendly link in **Profile → Edit**. The Schedule button on your public profile will open it. See `docs/CALENDLY_SETUP.md`.

## Stripe (subscriptions)

The app includes **Pricing**, **Upgrade**, and **Manage subscription** screens. To go live:

1. Create Stripe products/prices for Free and Pro.
2. Add a backend (e.g. Supabase Edge Functions) to:
   - Create Stripe Checkout sessions for upgrade.
   - Create Stripe Customer Portal sessions for manage.
   - Handle Stripe webhooks and write to `subscriptions` (and optionally `profiles`/plan flags).
3. Point the Upgrade and Manage screens to your API so they open the returned Stripe URLs (e.g. `Linking.openURL(url)`).

## Public profile URL & marketing site

Each user gets `https://ringtap.me/{username}`. The **Next.js marketing site** (landing, store, profile pages, activate flow) lives in the **`website/`** folder. Deploy it to Vercel or similar and point `ringtap.me` at it. This repo root is the **Expo app**; run the web app from `website/` (`cd website && npm run dev`).

## Tech stack

- **Expo** ~54, **Expo Router** (file-based), **TypeScript**
- **Supabase**: Auth, Postgres, Storage, RLS
- **expo-secure-store**: Session persistence
- **expo-image-picker**, **expo-file-system**, **expo-sharing**: Avatar/video upload, QR share
- **react-native-qrcode-svg**, **react-native-view-shot**: QR generation and image capture
- **@shopify/flash-list**: Link list
- **dayjs**: Dates
- **Stripe**: Billing (integrate via your backend + webhooks)

## Building for App Store & Google Play

The app is configured for store submission:

- **iOS:** `me.ringtap.app` (bundle ID), buildNumber in `app.json`
- **Android:** `me.ringtap.app` (package), versionCode in `app.json`
- **EAS Build:** `eas.json` includes `production` profile; set `EXPO_PUBLIC_SUPABASE_*` in EAS env or use `--local` with `.env`

```bash
npm install -g eas-cli
eas login
eas build --platform all --profile production
```

Full checklist (prerequisites, Store Connect / Play Console, screenshots, privacy policy): **[docs/APP_STORE_CHECKLIST.md](docs/APP_STORE_CHECKLIST.md)**.

## Learn more

- [Expo](https://expo.dev)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [Supabase](https://supabase.com/docs)
- [Stripe Billing](https://stripe.com/docs/billing)
