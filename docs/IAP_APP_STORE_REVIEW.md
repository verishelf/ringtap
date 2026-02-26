# IAP App Store Review – Guideline 2.1 Troubleshooting

If Apple rejects with **Guideline 2.1 - Performance - App Completeness** because "In-App Purchase products exhibited one or more bugs", work through this checklist.

## 1. Paid Apps Agreement (Required)

**The Account Holder must accept the Paid Apps Agreement.**

1. App Store Connect → **Agreements, Tax, and Banking**
2. Ensure **Paid Applications** agreement is **Active**
3. Complete Banking and Tax if prompted

Without this, IAP will not function in review.

## 2. Link Subscriptions to the App Version

**In-App Purchases must be explicitly added to each app version.**

1. App Store Connect → Your App → Select the version in review
2. Scroll to **In-App Purchases**
3. Click **+** and add products `006` and `007`
4. Save

Without this, `getProductsAsync` returns empty and the upgrade screen shows "Subscriptions not loaded."

## 3. App-Specific Shared Secret (Receipt Validation)

Receipt validation happens on your backend. If the secret is missing, purchases complete in the app but Pro status won't sync.

1. App Store Connect → Your App → **App Information** → **App-Specific Shared Secret**
2. Generate or copy the secret
3. Set `APPLE_SHARED_SECRET` in your website env (Vercel, etc.)
4. Redeploy so the API picks up the new env

## 4. Product IDs Match Exactly

Product IDs must match **exactly** (case-sensitive):

| Location | IDs |
|----------|-----|
| Code (`lib/iap.ts`, `utils/fetchProducts.ts`, `validate-receipt/route.ts`) | `006`, `007` |
| App Store Connect | Subscription products `006` (monthly), `007` (yearly) |

## 5. Sandbox Testing Before Resubmitting

Apple reviews IAP in **sandbox**. Test in sandbox before submitting:

1. **Settings → App Store** (or **Media & Purchases**)
2. Sign out of your production Apple ID
3. **Settings → App Store → Sandbox Account** — sign in with a sandbox tester
4. Create sandbox testers: App Store Connect → Users and Access → Sandbox → Testers

Test flow:

- Open app → Settings → Upgrade
- Tap "Subscribe via App Store"
- Complete purchase (sandbox is free)
- Confirm Pro badge appears
- Test "Restore purchases" after reinstalling

## 6. Subscription Status in App Store Connect

1. Subscriptions must be in a **Subscription Group** (e.g. RingTap Pro)
2. Each product must be **Ready to Submit**
3. Pricing must be configured

## 7. API Base URL

The app calls `https://www.ringtap.me/api/iap/validate-receipt`. Ensure:

- The website is deployed and reachable
- CORS and auth work (Bearer token from Supabase session)

## 8. Provide Sandbox Account for Review (Recommended)

Apple reviewers need a sandbox account to test IAP. If they don't have one or use the wrong one, purchases can fail.

1. App Store Connect → Your App → **App Information**
2. Scroll to **App Review Information**
3. Under **Sign-in required**, add a **Sandbox** account:
   - Create a sandbox tester: Users and Access → Sandbox → Testers → +
   - Use a real but unused email (e.g. `ringtap-review@yourdomain.com`)
   - Add that email + password to the App Review Information

This gives reviewers a known-good account to test IAP.

## 9. Review Notes (Optional)

When submitting for review, add a note in the **Notes for reviewer** field:

> In-App Purchase: Pro subscription (products 006, 007). Sandbox account provided in App Review Information. Please sign in with that account to test Subscribe and Restore purchases. IAP validated successfully in sandbox before submission.

## Quick Checklist

| Check | Where |
|-------|------|
| Paid agreement active | App Store Connect → Agreements |
| Subscriptions linked to version | App Store Connect → App → Version → In-App Purchases |
| Shared secret set | Website env: `APPLE_SHARED_SECRET` |
| Product IDs match | `006`, `007` in code and App Store Connect |
| Sandbox tested | Physical device, sandbox account signed in |
| Sandbox account for review | App Store Connect → App → App Review Information |
