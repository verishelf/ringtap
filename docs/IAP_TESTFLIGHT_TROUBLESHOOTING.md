# IAP TestFlight Troubleshooting

If in-app purchases don't work in your TestFlight build, work through this checklist.

## 1. Link Subscriptions to Your App Version (Most Common Fix)

**In-App Purchases must be explicitly added to each app version.**

1. Go to [App Store Connect](https://appstoreconnect.apple.com) → Your App
2. Select the version you're testing (e.g. the one in TestFlight)
3. Scroll to **In-App Purchases**
4. Click **+** and add products `006` and `007` to this version
5. Save and submit for review (or save if already in TestFlight)

Without this, `getProductsAsync` returns empty and purchases fail.

## 2. Sandbox Apple ID

TestFlight uses **sandbox** for IAP. You must sign in with a sandbox account:

1. **Settings → App Store** (or **Media & Purchases**)
2. Sign out of your production Apple ID
3. **Settings → App Store → Sandbox Account** — sign in with a sandbox tester
4. Create sandbox testers: App Store Connect → Users and Access → Sandbox → Testers

## 3. Paid Applications Agreement

1. App Store Connect → **Agreements, Tax, and Banking**
2. Ensure **Paid Applications** agreement is **Active**
3. Complete Banking and Tax if prompted

## 4. App-Specific Shared Secret (Receipt Validation)

Receipt validation happens on your backend. Ensure:

1. App Store Connect → Your App → **App Information** → **App-Specific Shared Secret**
2. Generate/copy the secret
3. Set `APPLE_SHARED_SECRET` in your website env (Vercel, etc.)

Without this, purchases complete in the app but Pro status won't sync.

## 5. Product IDs Match Exactly

Product IDs must match **exactly** (case-sensitive):

- App: `006`, `007` (in `lib/iap.ts`, `utils/fetchProducts.ts`)
- App Store Connect: Subscription products with IDs `006` and `007`

## 6. Subscription Group & Status

1. Subscriptions must be in a **Subscription Group** (e.g. RingTap Pro)
2. Each product must be **Ready to Submit**
3. Pricing must be configured

## 7. Store Build Detection

The app uses `isStoreBuild()` to enable IAP. It returns `true` when:

- Not in `__DEV__` (production build)
- `executionEnvironment` is `standalone` or `bare` (EAS Build)

If you see "IAP disabled in development mode" in TestFlight, the build may be misdetected. Check `Constants.executionEnvironment` in your build.

## 8. connectAsync Hanging

`expo-in-app-purchases` can sometimes hang on `connectAsync()` in certain environments. If the upgrade screen stays on "Loading subscription options…":

- Ensure you're on a **physical device** (not simulator)
- Ensure you're signed in with a **sandbox** Apple ID
- Try force-quitting the app and reopening
- Verify subscriptions are linked to the version (step 1)

## 9. Quick Verification

| Check | Where |
|-------|-------|
| Subscriptions linked to version | App Store Connect → App → Version → In-App Purchases |
| Sandbox account signed in | Settings → App Store → Sandbox Account |
| Paid agreement active | App Store Connect → Agreements |
| Shared secret set | Website env: `APPLE_SHARED_SECRET` |
| Product IDs match | `006`, `007` in code and App Store Connect |
