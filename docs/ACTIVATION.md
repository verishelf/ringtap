# RingTap activation system

## NFC payload format

**Recommended (no ring ID needed):** Program all NFC rings with this URL:

```
https://www.ringtap.me/activate
```

- User taps ring → browser opens that URL → redirects to app (`ringtap://activate`).  
- In the app, user taps **Create & link ring** → a ring ID is created and assigned to their profile. No manual ID in the link.

**Optional (with ring ID):** If you want to pre-associate a ring with an ID (e.g. chip UID):

```
https://www.ringtap.me/activate?r=<RING_ID>
```

- `<RING_ID>` = unique identifier (e.g. chip UID).  
- Flow: web creates/ensures ring in DB, redirects to `ringtap://activate?r=<RING_ID>`, app shows claim UI.

## Flow

### First-tap (no ring ID in URL)

1. **Web** — `GET /activate` (no `r`) → page redirects to `ringtap://activate`.
2. **Expo app** — Opens activate screen with no ring ID. User sees **Link your ring** and **Create & link ring**.  
   - If signed in: tap creates a new ring (server-generated ID) and assigns it to their profile. One ring per user; if they already have one, shows "Already linked".
   - If not signed in: prompt to sign in first.

### With ring ID in URL

1. **Web** — `GET /activate?r=<RING_ID>` → page calls `GET /api/activate?r=<RING_ID>`.  
   API ensures ring exists (creates with `status: unclaimed` if missing), returns `{ deepLink: "ringtap://activate?r=<RING_ID>" }`. Page redirects to deep link.
2. **Expo app** — Opens via `ringtap://activate?r=<RING_ID>`. Activate screen loads ring status, shows claim UI if unclaimed.

## Supabase: `rings` table

Current schema (see `supabase/migrations/004_rings.sql`):

| Column         | Type   | Notes                          |
|----------------|--------|---------------------------------|
| `chip_uid`     | text   | Primary key; NFC ring ID       |
| `status`       | text   | `unclaimed` or `claimed`       |
| `owner_user_id`| uuid   | Nullable; set when claimed     |
| `ring_model`   | text   | Optional; references ring_models |
| ...            |        | created_at, updated_at, etc.    |

For the simple activation API, `r` in the URL is stored/queried as `chip_uid`.

## Environment (website / Vercel)

For activation and “could not load ring” to work, set in Vercel:

- `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (required for `/api/activate` and `/api/ring/status`; do not expose to client)

The app loads ring info via `GET /api/ring/status?uid=<RING_ID>`. That route uses the service role when available so it can always read (and if needed create) the ring. If you see “Could not load ring” in the app, confirm these env vars are set in Vercel and redeploy.
