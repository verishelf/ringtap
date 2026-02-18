# Calendly Integration Setup

## 1. Calendly Developer App

1. Go to [Calendly Developer](https://developer.calendly.com/)
2. Create an application (or open your existing one)
3. **Redirect URIs** — Click "Add" and add this **exact** URL (copy-paste, no trailing slash):
   ```
   https://www.ringtap.me/api/oauth/calendly
   ```
   The URL must match character-for-character. Common mistakes: trailing slash, `http` instead of `https`, `ringtap.me` instead of `www.ringtap.me`.
4. Copy Client ID and Client Secret

## 2. Vercel (Website) Environment Variables

Add to **Vercel** → your project → **Settings** → **Environment Variables**:

| Variable | Value | Notes |
|----------|-------|-------|
| `CALENDLY_CLIENT_ID` | Your Calendly client ID | From Calendly Developer dashboard |
| `CALENDLY_CLIENT_SECRET` | Your Calendly client secret | From Calendly Developer dashboard |

Also ensure `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set (for storing tokens).

**Redeploy** after adding variables — Vercel only picks up env changes on the next deploy.

## 3. Expo / App Config

Add to your app's environment (e.g. `.env` or `app.json` extra):

```
EXPO_PUBLIC_CALENDLY_CLIENT_ID=your_client_id
```

The client ID is public (OAuth standard). Never put the client secret in the app.

## 4. Database Migrations

Run the migrations:

```bash
supabase db push
# or apply manually: 012_calendly_users.sql, 013_appointments.sql, 015_calendly_scheduling_url.sql
```

## 5. Realtime (Optional)

For live appointment updates, add `appointments` to the Realtime publication:

- Supabase Dashboard → Database → Replication
- Add `appointments` table to `supabase_realtime`

## 6. Deploy Edge Functions

OAuth callback is on Vercel. Deploy webhook, sync, and other functions:

```bash
npx supabase functions deploy calendly-webhook --project-ref wdffdlznfthxwjhumacs --no-verify-jwt
npx supabase functions deploy calendly-register-webhook --project-ref wdffdlznfthxwjhumacs
npx supabase functions deploy calendly-links --project-ref wdffdlznfthxwjhumacs
npx supabase functions deploy calendly-sync --project-ref wdffdlznfthxwjhumacs
```

`calendly-sync` fetches scheduled events from the Calendly API and upserts into `appointments` — catches events missed by the webhook (e.g. if webhook wasn't registered yet). Also populates `scheduling_url` in `calendly_users` when missing (used for the Schedule button on profiles).

## Token Refresh (Supabase Edge Functions)

Calendly access tokens expire (typically 24h). The webhook uses `calendlyRefresh` to refresh tokens automatically. Add these secrets to Supabase so the webhook can refresh:

```bash
npx supabase secrets set CALENDLY_CLIENT_ID=your_client_id --project-ref wdffdlznfthxwjhumacs
npx supabase secrets set CALENDLY_CLIENT_SECRET=your_client_secret --project-ref wdffdlznfthxwjhumacs
```

Without these, the webhook may fail when the token expires. Users can disconnect and re-connect Calendly as a workaround.

## Schedule Button on Profile

The Schedule button on your profile (website and app preview) uses your **connected** Calendly scheduling URL. There is no manual Calendly link field in Edit Profile — connect via Settings or Contacts → Calendly to enable it.

## Flow

1. User taps "Connect Calendly" in Settings
2. App opens Calendly OAuth in browser
3. User authorizes → Calendly redirects to `https://www.ringtap.me/api/oauth/calendly?code=...&state=user_id`
4. Vercel API route exchanges code for tokens, stores in `calendly_users`, returns "Closing…"
5. Auth session matches and closes; app parses code/state from URL and shows connected
6. App calls `calendly-register-webhook` to subscribe to invitee.created / invitee.canceled
7. When someone books or cancels, Calendly POSTs to `calendly-webhook?user_id=xxx`
8. Webhook inserts/updates `appointments` table
9. App fetches appointments via Supabase and subscribes to realtime
