# RevenueCat Setup for RingTap

This guide covers configuring RevenueCat for the RingTap app.

## 1. Dashboard Configuration

### Create Entitlement
1. Go to [RevenueCat Dashboard](https://app.revenuecat.com) → Project → Entitlements
2. Create entitlement: **RingTap Pro**

### Add Products
1. Go to Project → Products
2. For each store (Apple App Store, Google Play), add products:
   - **monthly** – monthly subscription (or use `006` if migrating from existing IAP)
   - **yearly** – yearly subscription (or use `007` if migrating)
   - **lifetime** – one-time purchase

Product IDs must match exactly what you configure in App Store Connect / Google Play Console.

### Attach Products to Entitlement
1. Go to Entitlements → RingTap Pro
2. Attach the monthly, yearly, and lifetime products

### Create Offering
1. Go to Offerings
2. Create an offering (e.g. "default")
3. Add packages: Monthly, Yearly, Lifetime
4. Mark as **Current** offering

### Configure Paywall
1. Go to Paywalls
2. Create a paywall for your offering
3. Add components: title, product list, purchase button, restore, legal links
4. Configure exit offers if desired

### Configure Customer Center
1. Go to Customer Center
2. Add management options: Manage subscription, Restore purchases, Contact support
3. Configure appearance to match your app

## 2. API Keys

### Development
- Add to `.env` for local builds, or use the built-in test key fallback
- Test key is used automatically when env vars are not set (dev only)

### Production (EAS Build)
Add your production API keys as EAS secrets so they are available during `eas build --profile production`:

```bash
# Get keys from RevenueCat Dashboard → Project → API Keys
eas secret:create --name EXPO_PUBLIC_REVENUECAT_IOS_KEY --value appl_YOUR_IOS_KEY --scope project
eas secret:create --name EXPO_PUBLIC_REVENUECAT_ANDROID_KEY --value goog_YOUR_ANDROID_KEY --scope project
```

EAS automatically injects these as environment variables during the build. No code changes needed.

## 3. Webhooks (Optional)

To sync RevenueCat purchases to your Supabase backend:

1. Go to Project → Integrations → Webhooks
2. Add webhook URL: `https://www.ringtap.me/api/revenuecat/webhook` (or your backend)
3. Subscribe to: `INITIAL_PURCHASE`, `RENEWAL`, `CANCELLATION`, `EXPIRATION`
4. Implement the webhook handler to update `subscriptions` table

## 4. Testing

- **Expo Go**: RevenueCat runs in Preview API mode (mock). Paywall and Customer Center will show preview UIs.
- **Development build**: Use `eas build --profile development` and run on device/simulator for real purchases.
- **Sandbox**: Use Apple Sandbox / Google test accounts for testing without real charges.

## 5. Files Reference

| File | Purpose |
|------|---------|
| `lib/revenuecat.ts` | API key, entitlement ID, product IDs |
| `contexts/RevenueCatContext.tsx` | SDK init, user identification, customer info |
| `hooks/useSubscription.ts` | Combined Pro status (RevenueCat + Supabase) |
| `app/(tabs)/settings/upgrade.tsx` | Presents RevenueCat Paywall |
| `app/(tabs)/settings/manage.tsx` | Presents Customer Center for IAP subscribers |
