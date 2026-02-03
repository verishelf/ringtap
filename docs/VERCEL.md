# Vercel deployment fix

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
