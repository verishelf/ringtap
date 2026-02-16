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

## 2. Storefront Detection

The app uses **expo-localization** `regionCode` as a proxy for App Store storefront:

- **US** (`regionCode === 'US'`) → Shows BOTH IAP + external link ("Pay with external link (cheaper)")
- **Non-US** → IAP only; no external payment links

This is conservative: device locale can differ from App Store country. For more accurate detection, you can add a native module.

### Optional: Native Module for Exact Storefront

Apple's `SKPaymentQueue.default().storefront?.countryCode` returns the actual storefront (e.g. `"USA"`). To use it:

1. Create an Expo config plugin and native module
2. Or use a community package if available (e.g. `react-native-storefront-country`)
3. Update `useStorefrontCountry` to call the native module when available

**Swift snippet** (for reference, if building a custom module):

```swift
import StoreKit

@objc(StorefrontModule)
class StorefrontModule: NSObject {
  @objc func getCountryCode(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      if #available(iOS 13.0, *) {
        let code = SKPaymentQueue.default().storefront?.countryCode
        resolve(code ?? "")
      } else {
        resolve("")
      }
    }
  }
}
```

## 3. Testing

### Sandbox Accounts

1. App Store Connect → Users and Access → Sandbox → Testers
2. Create a sandbox Apple ID (use a real but unused email)
3. On device: Settings → App Store → Sandbox Account → sign in with sandbox ID

### Test Scenarios

- **US storefront**: Set device region to United States (Settings → General → Language & Region)
- **Non-US storefront**: Set region to e.g. United Kingdom → external link should be hidden
- **Restore**: Purchase Pro, delete app, reinstall, tap "Restore purchases"
- **Web + IAP**: Subscribe on web (US device) → app should show Pro; Manage opens Stripe portal

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

- IAP is implemented and functional for Pro subscription
- US users may optionally use web checkout (Guideline 3.1.1(a))
- Non-US users see only IAP
- Pro status syncs from backend for web-purchased subscriptions (Guideline 3.1.3(b))
