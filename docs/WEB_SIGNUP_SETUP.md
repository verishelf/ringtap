# Web Signup & Pro Checkout

Users can create accounts on the web (free or Pro) and then sign in to the RingTap app with the same credentials. After account creation, they're redirected to open the app.

## Flow

### Free
1. User goes to **ringtap.me** → Pricing → "Start free — create account on web"
2. Signs up with email + password at `/signup?plan=free`
3. Confirms email (if required) or gets session immediately
4. Profile is created with a default username (user_xxx)
5. Redirects to `ringtap://` to open the app

### Pro
1. User goes to **ringtap.me** → Pricing → "Create account & pay with Stripe"
2. Signs up at `/signup?plan=pro`
3. Confirms email → lands on `/auth/callback?plan=pro`
4. Profile is created, then redirects to Stripe checkout
5. Pays → success page → "Open RingTap app" → `ringtap://`

## Supabase Setup

1. **Redirect URLs**: In Supabase Dashboard → Authentication → URL Configuration, add:
   - `https://www.ringtap.me/auth/callback`
   - `https://www.ringtap.me/auth/callback?plan=pro`
   - (and `http://localhost:3000/auth/callback` for local dev)

2. **Site URL**: Set to `https://www.ringtap.me` (or your production URL).

3. **Email confirmation**: If enabled, users must click the confirmation link before the app redirect. If disabled, they're signed in immediately after signup.

## Stripe Setup

1. **Webhook**: Stripe Dashboard → Developers → Webhooks → Add endpoint
   - URL: `https://www.ringtap.me/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

2. **Environment**: Add `STRIPE_WEBHOOK_SECRET` (starts with `whsec_`) to your env.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # Required for web auth
SUPABASE_SERVICE_ROLE_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_PRO_PRICE_ID=...
STRIPE_PRO_PRICE_ID_YEARLY=...
STRIPE_WEBHOOK_SECRET=...
```
