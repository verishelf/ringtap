# Vercel deployment

## Environment variables (IAP)

For In-App Purchase receipt validation to work, set `APPLE_SHARED_SECRET` in Vercel:

1. Vercel Dashboard → **ringtap** project → **Settings** → **Environment Variables**
2. Add: `APPLE_SHARED_SECRET` = (your App-Specific Shared Secret from App Store Connect)
3. Apply to **Production** (and Preview if needed)
4. **Redeploy** so the new env is picked up

Get the secret: App Store Connect → Your App → App Information → App-Specific Shared Secret

---

## Root directory fix

If you see:

**"The specified Root Directory 'ringtap' does not exist. Please update your Project Settings."**

the project is pointing at the wrong folder. This repo has no `ringtap` subfolder; the Next.js app is in **`website/`**.

## Fix (do this in Vercel)

1. Open **[Vercel Dashboard](https://vercel.com/dashboard)** and select the **ringtap** project.
2. Go to **Settings** (top tab).
3. Under **General**, find **Root Directory**.
4. It will show **`ringtap`** — click **Edit**.
5. Change it to **`website`** (no leading slash, no trailing slash).
6. Click **Save**.
7. Go to **Deployments**, open the **⋯** menu on the latest deployment, and click **Redeploy**.

Builds will then run from the `website/` folder and should succeed.
