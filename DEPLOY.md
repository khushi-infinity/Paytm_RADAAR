# Deploying RADAAR (merchant app)

The app is a standard Next.js 15 Node server. Any platform that runs Node can host it. Recommended: **Railway** (real server, persistent disk, no spin-down, best for live demos).

## What to know before you start

- The deployed app talks to the **same cloud side** you already use: your n8n cloud workflows and your Cognee tenant. No new infrastructure needed.
- `npm run pipeline` is a **local** orchestration script (deploys the 3 n8n workflows, resets + cognifies the Cognee dataset, verifies the loop). Run it from your laptop, not on the platform.
- Secrets live only in the platform's env settings. The repo has placeholders only (`.env.example`); the real `.env` is gitignored.

## Option A: Railway (recommended)

1. Go to [railway.app](https://railway.app) and sign in with GitHub.
2. **New Project → Deploy from GitHub repo** → pick `khushi-infinity/Paytm_RADAAR`.
3. Railway auto-detects Next.js (build `npm ci && npm run build`, start `npm start`). Let the first build run.
4. Open the service → **Variables** → add (copy values from your local `.env`):

```
COGNEE_API_KEY=...
COGNEE_BASE_URL=...
COGNEE_TENANT_ID=...
COGNEE_USER_ID=...
N8N_BASE_URL=https://khushisarawagi.app.n8n.cloud/
N8N_API_KEY=...
SARVAM_API_KEY=...
NEXT_PUBLIC_APP_URL=https://YOUR-RAILWAY-DOMAIN   ← set after step 5
```

5. **Settings → Networking → Generate Domain** → you get something like `https://paytm-radaar.up.railway.app`. Put that URL into `NEXT_PUBLIC_APP_URL` (step 4). Railway redeploys automatically on every variable change and every `git push`.
6. Verify: open the URL → radar renders → tap **यह करें** → nudge appears (proves the deployed app reaches n8n → Sarvam → Cognee).

Notes:
- Railway injects `PORT`; `npm start` already respects it (`next start -p ${PORT:-3001}`).
- Optional: add a **Volume** mounted at `/app/.data` if you want the local memory audit log to persist across deploys. Without it the memory panel still works from the Cognee graph; only the local audit file resets.

## Option B: Vercel

1. Go to [vercel.com](https://vercel.com) → sign in with GitHub → **Add New Project → Import** `khushi-infinity/Paytm_RADAAR`.
2. **Environment Variables** → paste the same values as above (skip `NEXT_PUBLIC_APP_URL` at first; set it to the final `vercel.app` URL afterwards if any absolute links misbehave).
3. **Deploy**. Every `git push` to `main` auto-deploys.
4. Caveat: serverless = ephemeral disk, so the local memory audit log does not persist between invocations. The "What RADAAR remembers" panel degrades gracefully to graph-sourced facts only. Chat, offers, voice all work.

## Avoid: free tiers that spin down

Render free (and similar) pause the server after idle and add 30s+ cold starts. Fatal for a live demo. Use them only with a paid plan or a keep-alive ping.

## Demo-day checklist (whichever platform)

- Run `npm run pipeline` locally 10 minutes before presenting so n8n executions and the Cognee graph are fresh with today's runs.
- Pre-grant mic permission to the deployed URL in the demo browser (HTTPS is required for the mic; both Railway and Vercel give you HTTPS).
- Set volume ~60% for the bulbul voice demo.
- Keep a local `npm run dev` running as backup on port 3001.

## Custom domain (optional)

Railway: Settings → Networking → Custom Domain → add `radaar.yourdomain.in` and point the CNAME at the provided target. Vercel: Project → Domains. Then update `NEXT_PUBLIC_APP_URL` to the final domain.
