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
# or apply manually: 012_calendly_users.sql, 013_appointments.sql
```

## 5. Realtime (Optional)

For live appointment updates, add `appointments` to the Realtime publication:

- Supabase Dashboard → Database → Replication
- Add `appointments` table to `supabase_realtime`

## 6. Deploy Edge Functions (Webhook only)

OAuth callback is now on Vercel. Deploy only the webhook and other functions:

```bash
npx supabase functions deploy calendly-webhook --project-ref wdffdlznfthxwjhumacs --no-verify-jwt
npx supabase functions deploy calendly-register-webhook --project-ref wdffdlznfthxwjhumacs
npx supabase functions deploy calendly-links --project-ref wdffdlznfthxwjhumacs
```

## Token Refresh

Access tokens expire (typically 24h). If API calls fail with 401, the user can disconnect and re-connect Calendly. For automatic refresh, add logic in Edge Functions to call `https://auth.calendly.com/oauth/token` with `grant_type=refresh_token` when `expires_at` is near.

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
