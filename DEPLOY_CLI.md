# CLI Deployment Checklist

## Backend: Render

Render uses the root `render.yaml` blueprint for the Express API.

Required environment variables on Render:

- `MONGODB_URI`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `FRONTEND_URL` set to the final Vercel URL, for example `https://your-app.vercel.app`
- `GEMINI_API_KEY` or `OPENROUTER_API_KEY`

Commands:

```bash
npm install -g @render/cli
render login
render blueprint deploy
```

After deploy, copy the backend URL, for example:

```text
https://mclub-backend.onrender.com
```

## Frontend: Vercel

Run from the `client` folder.

Required Vercel environment variables:

- `VITE_API_URL=https://mclub-backend.onrender.com/api`
- `VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com`

Commands:

```bash
cd client
vercel login
vercel env add VITE_API_URL production
vercel env add VITE_GOOGLE_CLIENT_ID production
vercel --prod
```

## Google OAuth

Add these URLs in Google Cloud Console after deploy:

- Authorized JavaScript origins:
  - `https://your-app.vercel.app`
  - `https://mclub-backend.onrender.com`
- Authorized redirect origins are not needed for the current Google One Tap flow, but keep the same domains approved if Google asks.

## Final Sync

After Vercel gives the production URL:

1. Update Render `FRONTEND_URL` to the Vercel URL.
2. Redeploy Render.
3. Update Vercel `VITE_API_URL` if the Render backend URL changed.
4. Redeploy Vercel.
