# Calendly Integration Setup

## 1. Calendly Developer App

1. Go to [Calendly Developer](https://developer.calendly.com/)
2. Create an application
3. Add redirect URI: `https://wdffdlznfthxwjhumacs.supabase.co/functions/v1/calendly-oauth`
4. Copy Client ID and Client Secret

## 2. Supabase Environment Variables

Add to Supabase Edge Functions secrets (Dashboard → Project Settings → Edge Functions → Secrets):

```
CALENDLY_CLIENT_ID=k1fwPv2YvWrClxKXM07FOGQ77IJkcMhy7lGO6JHztEI
CALENDLY_CLIENT_SECRET=<your_client_secret>
CALENDLY_REDIRECT_URI=https://wdffdlznfthxwjhumacs.supabase.co/functions/v1/calendly-oauth
CALENDLY_WEBHOOK_SIGNING_KEY=<your_webhook_signing_key>
```

**Important:** Never commit the client secret or webhook signing key. Store them only in Supabase secrets.

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

## 6. Deploy Edge Functions

OAuth and webhook functions receive external callbacks (no auth header), so deploy with `--no-verify-jwt`:

```bash
npx supabase functions deploy calendly-oauth --project-ref wdffdlznfthxwjhumacs --no-verify-jwt
npx supabase functions deploy calendly-webhook --project-ref wdffdlznfthxwjhumacs --no-verify-jwt
npx supabase functions deploy calendly-register-webhook --project-ref wdffdlznfthxwjhumacs
npx supabase functions deploy calendly-links --project-ref wdffdlznfthxwjhumacs
```

## Token Refresh

Access tokens expire (typically 24h). If API calls fail with 401, the user can disconnect and re-connect Calendly. For automatic refresh, add logic in Edge Functions to call `https://auth.calendly.com/oauth/token` with `grant_type=refresh_token` when `expires_at` is near.

## Flow

1. User taps "Connect Calendly" in Settings
2. App opens Calendly OAuth in browser
3. User authorizes → Calendly redirects to `calendly-oauth` with `?code=...&state=user_id`
4. Edge Function exchanges code for tokens, stores in `calendly_users`, redirects to `ringtap://oauth/success`
5. App receives deep link, navigates to Connect screen (shows connected)
6. App calls `calendly-register-webhook` to subscribe to invitee.created / invitee.canceled
7. When someone books or cancels, Calendly POSTs to `calendly-webhook?user_id=xxx`
8. Webhook inserts/updates `appointments` table
9. App fetches appointments via Supabase and subscribes to realtime
