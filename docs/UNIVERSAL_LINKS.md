# Universal Links (iOS) and App Links (Android)

When a user opens **https://ringtap.me/activate?r=&lt;RING_ID&gt;** (or **https://www.ringtap.me/activate?r=&lt;RING_ID&gt;**), the device can open the RingTap app directly instead of the browser—no need to tap "Open in App." The ring ID is passed in the URL, so the user never types anything.

## What’s in place

### Website (Next.js on Vercel)

- **Apple:** `/.well-known/apple-app-site-association` is served via rewrite to `/api/well-known/aasa`. It lists your app’s bundle ID and paths: `/activate`, `/activate?*`, `/profile`, `/profile/*`.
- **Android:** `/.well-known/assetlinks.json` is served via rewrite to `/api/well-known/assetlinks`. It must include your app’s package name and **SHA-256 certificate fingerprint(s)**.

### Expo app (app.json)

- **iOS:** `associatedDomains`: `applinks:ringtap.me`, `applinks:www.ringtap.me`.
- **Android:** `intentFilters` with `autoVerify: true` for `https://ringtap.me/activate`, `https://www.ringtap.me/activate`, and the same for `/profile`.

### Linking (Expo)

- `utils/deeplinking.ts` includes prefixes: `ringtap://`, `https://ringtap.me`, `https://www.ringtap.me`. So when the OS opens the app with an HTTPS URL, Expo Router can parse it and navigate to the activate (or profile) screen with the query params.

## What you need to do

### 1. Apple (iOS)

- **Team ID:** The AASA is built with `APPLE_TEAM_ID` (default from EAS: `Q834NS68MG`). If your Apple Developer Team ID is different, set **Vercel env**: `APPLE_TEAM_ID=YOUR_TEAM_ID` and redeploy.
- **Build:** Create a new **native build** (e.g. `eas build --platform ios --profile production`) so the app is built with the `associatedDomains` entitlement. Development builds may not have it.
- **Test:** On a real device, install the app, then open Safari and go to `https://ringtap.me/activate?r=test123`. The app should open (or a banner “Open in RingTap” may appear). If the browser stays on the web page, check that the domain is exactly `ringtap.me` or `www.ringtap.me` and that the AASA is reachable: open `https://ringtap.me/.well-known/apple-app-site-association` in a browser and confirm you see JSON.

### 2. Android (App Links)

- **SHA-256 fingerprint:** Android verifies the app via Digital Asset Links. You must serve your app’s **release** signing certificate SHA-256 in `assetlinks.json`.
  - **Play App Signing:** In [Play Console](https://play.google.com/console) → Your app → **Setup** → **App signing** → **App signing key certificate** → copy **SHA-256 certificate fingerprint** (format like `AB:CD:EF:...`).
  - Or with a local keystore:  
    `keytool -list -v -keystore your-release-key.keystore -alias your-alias`
- **Vercel env:** Set **ANDROID_SHA256_FINGERPRINTS** to that fingerprint. If you have multiple (e.g. debug + release), use a comma-separated list:  
  `ANDROID_SHA256_FINGERPRINTS=AA:BB:CC:...,DD:EE:FF:...`
- **Redeploy** the website so `/.well-known/assetlinks.json` returns that fingerprint.
- **Build:** Create a new Android build so the app includes the `intentFilters` with `autoVerify: true`.
- **Test:** Install the app, then open `https://ringtap.me/activate?r=test123` in Chrome or a link. The app should open. If not, use [Statement List Tester](https://developers.google.com/digital-asset-links/tools/generator) or Play Console’s **App Links** section to debug.

### 3. NFC link to write on the ring

Use either (both work; use the one that matches your primary domain):

- **https://ringtap.me/activate?r=&lt;RING_ID&gt;**
- **https://www.ringtap.me/activate?r=&lt;RING_ID&gt;**

Replace `<RING_ID>` with the ring’s unique ID (e.g. chip UID). The user never has to type anything: tap ring → link opens → if the app is installed, the app opens with that `r` and can show the activate/claim screen.

## Summary

| Item | Status |
|------|--------|
| AASA route + rewrite | Done |
| assetlinks route + rewrite | Done (needs ANDROID_SHA256_FINGERPRINTS on Vercel) |
| app.json associatedDomains (iOS) | Done |
| app.json intentFilters (Android) | Done |
| Expo linking prefixes (https) | Done |
| Set APPLE_TEAM_ID (if different) | Optional, in Vercel |
| Set ANDROID_SHA256_FINGERPRINTS | Required for Android App Links |
| New native build after config change | Required |
