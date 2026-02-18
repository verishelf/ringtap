# In-App Purchase (IAP) Setup for App Store Compliance

This guide covers configuring IAP for RingTap Pro to comply with Apple Guideline 3.1.1.

## 1. App Store Connect Configuration

### Create Subscription Products

1. Go to [App Store Connect](https://appstoreconnect.apple.com) → Your App → Subscriptions
2. Use Subscription Group ID: **21929407** (RingTap Pro)
3. Add two auto-renewable subscriptions to this group:
   - **Product ID**: `006` — $14.99/month
   - **Product ID**: `007` — $119.99/year

4. Configure pricing and localization as needed.

### App-Specific Shared Secret

1. App Store Connect → Your App → App Information
2. Under **App-Specific Shared Secret**, generate or copy the secret
3. Add to your environment:
   ```
   APPLE_SHARED_SECRET=your_shared_secret_here
   ```
4. For the website (receipt validation API): add to `.env.local` or your hosting provider's env vars

## 2. Payment Options (App Store Compliance)

Per Apple Guideline 3.1.1, the **native app uses in-app purchase only**. No external payment links (Stripe) are shown in the app. Stripe remains available on the website for web users.

## 3. Testing

### Sandbox Accounts

1. App Store Connect → Users and Access → Sandbox → Testers
2. Create a sandbox Apple ID (use a real but unused email)
3. On device: Settings → App Store → Sandbox Account → sign in with sandbox ID

### Test Scenarios

- **Restore**: Purchase Pro, delete app, reinstall, tap "Restore purchases"
- **Web**: Subscribe on web → app should show Pro (if same account); Manage opens App Store subscriptions

## 4. Product IDs

Current IDs: `006` (monthly $14.99), `007` (yearly $119.99). To change, update:

- `lib/iap.ts` — `IAP_PRODUCT_IDS`
- `website/src/app/api/iap/validate-receipt/route.ts` — `proProductIds`
- `app/(tabs)/settings/upgrade.tsx` — `monthlyProduct` / `yearlyProduct` lookup

## 5. Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `APPLE_SHARED_SECRET` | Website (Vercel/etc) | Receipt validation with Apple |

## 6. App Store Review Notes

When submitting for review, you can note:

- IAP is implemented and functional for Pro subscription (Guideline 3.1.1)
- Pro subscriptions are purchased only via App Store in-app purchase
