# RingTap activation system

## NFC payload format

Write all NFC tags with this URL so taps open the activation flow:

```
https://ringtap.me/activate?r=<RING_ID>
```

- `<RING_ID>` = unique identifier for the ring (e.g. chip UID or serial).
- User taps ring → browser opens that URL → Next.js redirects to app deep link → Expo opens activate screen.

## Flow

1. **Web (ringtap.me)**  
   - `GET /activate?r=<RING_ID>` → page calls `GET /api/activate?r=<RING_ID>`.  
   - API ensures ring exists in Supabase (creates with `status: unclaimed` if missing), returns `{ deepLink: "ringtap://activate?r=<RING_ID>" }`.  
   - Page redirects to `deepLink`.

2. **Expo app**  
   - Opens via `ringtap://activate?r=<RING_ID>`.  
   - `useActivation` hook handles URL and navigates to `/activate?r=<RING_ID>`.  
   - Activate screen loads ring status, shows claim UI if unclaimed.

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

For `/api/activate` to create rings when missing, set:

- `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (required for insert; do not expose to client)
