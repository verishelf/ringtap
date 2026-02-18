# App Store Review – NFC Demo Video (Guideline 2.1)

Apple requires a demo video showing NFC functionality on a **physical device** when your app uses NFC hardware (e.g. NFC rings).

## Requirements

1. **Physical device** – Film on a real iPhone, not a simulator
2. **Visible hardware** – Show both the app screen and the NFC ring (or tag) in frame
3. **Full workflow** – Demonstrate the entire NFC flow from start to finish

## What to Film

### 1. Initial pairing / setup

- Open the app on a physical iPhone
- Go to **Settings** (or **Activate**) → **Manage ring**
- Show the "Link your ring" flow: hold the NFC ring to the back of the phone
- Demonstrate writing the profile URL to the ring (hold until complete)

### 2. Reading / tapping

- With another device (or after reset), tap the ring to an iPhone
- Show the ringtap.me profile opening (via Universal Links / App Links)
- Or show the in-app flow when a ring is tapped (claim / view profile)

### 3. End-to-end workflow

- **Write**: Profile URL → ring (from the app)
- **Read**: Ring tap → profile opens in browser or app
- **Claim** (if applicable): Unclaimed ring → claim flow → linked to account

## Technical Notes

- Use **screen recording** plus **camera** so both the screen and the ring are visible
- Or use a setup where the phone screen is visible (e.g. mirror/reflection) while you hold the ring
- Keep the video under 2–3 minutes; focus on clear, deliberate actions
- Add captions or on-screen text if helpful (e.g. "Writing profile to ring", "Tap to open profile")

## Where to Add the Video

### Option A: Host on ringtap.me

1. Add your video as `demo.mp4` to `website/public/`
2. Deploy the website — the demo will be at **https://www.ringtap.me/demo**
3. In **App Store Connect** → App Review Information → **Notes**, add: `Demo video: https://www.ringtap.me/demo`
4. In your reply to the rejection, mention: "Demo video showing NFC functionality is available at https://www.ringtap.me/demo"

### Option B: YouTube or other host

1. Upload to YouTube (unlisted) or another hosting service
2. In **App Store Connect** → Your App → **App Review Information**
3. Paste the video URL in the **Notes** field
4. In your reply to the rejection, mention: "Demo video showing NFC functionality has been added to App Review Information."

## If the App Has No NFC

If you've removed NFC or it's not implemented, add this to the **Notes** field in App Review Information:

> This app does not include NFC functionality.
