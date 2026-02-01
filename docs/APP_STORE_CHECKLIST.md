# RingTap — App Store & Google Play Checklist

Use this checklist to submit RingTap to the App Store and Google Play.

---

## 1. Prerequisites

- [ ] **Apple Developer account** ($99/year) — [developer.apple.com](https://developer.apple.com)
- [ ] **Google Play Developer account** ($25 one-time) — [play.google.com/console](https://play.google.com/console)
- [ ] **Expo EAS** — `npm install -g eas-cli` then `eas login`
- [ ] **Supabase** — Production project with env vars set (no dev keys in production builds)

---

## 2. App configuration (done)

- **Display name:** RingTap  
- **iOS bundle ID:** `me.ringtap.app`  
- **Android package:** `me.ringtap.app`  
- **Version:** 1.0.0 (iOS buildNumber: 1, Android versionCode: 1)  
- **Permissions:** Photo library, camera, microphone (for profile photo & video intro)  
- **Scheme:** `ringtap` (for deep links)

---

## 3. EAS Build setup

```bash
# Link or create EAS project (first time)
eas init

# Build for App Store (iOS)
eas build --platform ios --profile production

# Build for Google Play (Android)
eas build --platform android --profile production

# Or both
eas build --platform all --profile production
```

Before building, set env vars in EAS:

- **EAS Dashboard → Project → Environment variables**  
  Add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` for the **production** profile.

Or use a local `.env` and run:

```bash
eas build --platform all --profile production --local
```

(With `--local`, EAS uses your machine’s env; ensure `.env` is not committed.)

---

## 4. iOS App Store

### 4.1 App Store Connect

- [ ] Create app in [App Store Connect](https://appstoreconnect.apple.com) (Bundle ID: `me.ringtap.app`)
- [ ] Fill in **App Information**: name, subtitle, category (e.g. Business or Productivity), age rating
- [ ] **Privacy Policy URL** (required) — e.g. `https://ringtap.me/privacy`
- [ ] **Support URL** — e.g. `https://ringtap.me` or your support page
- [ ] **Screenshots** — 6.7", 6.5", 5.5" (iPhone); optional iPad
- [ ] **App Preview** (optional) — short video
- [ ] **Description**, **Keywords**, **Promotional Text**
- [ ] **Copyright** and **Contact** (email, phone)

### 4.2 Certificates & provisioning

- First production build: EAS will prompt for Apple ID and can create/distribute certificates and provisioning profiles.
- Or use **EAS Submit** after a successful build:

```bash
eas submit --platform ios --profile production
```

(Configure `eas.json` → `submit.production.ios` with `appleId`, `ascAppId`, `appleTeamId` for non-interactive submit.)

### 4.3 Export compliance

- `usesNonExemptEncryption: false` is set in `app.json` (no custom crypto). If you add encryption later, update and answer the export form in App Store Connect.

---

## 5. Google Play

### 5.1 Play Console

- [ ] Create app in [Google Play Console](https://play.google.com/console)
- [ ] **Store listing**: title (RingTap), short description, full description, screenshots (phone 16:9 or 9:16), feature graphic (1024×500)
- [ ] **Privacy Policy URL** (required)
- [ ] **Content rating** — complete the questionnaire
- [ ] **Target audience** — age groups
- [ ] **Data safety** — declare what data you collect (e.g. email, account info via Supabase)

### 5.2 Build

- Use **Android App Bundle** (`.aab`) from EAS production build; do not submit APK for new apps.
- Upload the `.aab` in Play Console → Release → Production (or Internal testing first).

### 5.3 EAS Submit (optional)

```bash
eas submit --platform android --profile production
```

For automated submit, add a **Google Play service account** and set `submit.production.android.serviceAccountKeyPath` in `eas.json`.

---

## 6. Before you submit

- [ ] **Supabase**: Production URL and anon key in EAS env (or secure backend)
- [ ] **Stripe**: If using payments, use live keys only in production; keep secret keys on backend
- [ ] **Deep link**: Test `ringtap://` and `https://ringtap.me` (if you set up associated domains / App Links)
- [ ] **Sign out / sign in**: Test auth flow on a fresh install
- [ ] **Permissions**: Test “Don’t allow” for photos; app should show your alert and degrade gracefully
- [ ] Remove or guard any **debug logs**, **test accounts**, and **dev-only features**

---

## 7. Version updates

- **iOS:** Bump `version` in `app.json` for user-facing version; bump `ios.buildNumber` for each build you submit.
- **Android:** Bump `version` and `android.versionCode` in `app.json`.
- With `autoIncrement: true` in `eas.json` (production), EAS can auto-increment build numbers.

---

## 8. Useful commands

| Task              | Command                                      |
|-------------------|----------------------------------------------|
| Build iOS         | `eas build --platform ios --profile production`   |
| Build Android     | `eas build --platform android --profile production` |
| Submit iOS        | `eas submit --platform ios --profile production`   |
| Submit Android    | `eas submit --platform android --profile production` |
| View builds       | `eas build:list`                             |
| EAS project info  | `eas project:info`                           |

---

## 9. Links

- [EAS Build](https://docs.expo.dev/build/introduction/)
- [EAS Submit](https://docs.expo.dev/submit/introduction/)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Google Play Console](https://play.google.com/console)
- [Expo app config](https://docs.expo.dev/versions/latest/config/app/)
