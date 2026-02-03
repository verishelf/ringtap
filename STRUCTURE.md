# Repo structure

```
/ringtap
  /app          → Expo Router app (mobile)
  /website      → Next.js marketing site (Vercel: set Root Directory to "website")
  package.json  → Expo app
  .gitignore
  README.md
```

- **Expo app**: run from repo root (`npm start`, `eas build`, etc.).
- **Website**: run from `website/` (`cd website && npm run dev`). Deploy with Vercel and set **Root Directory** to `website`.
