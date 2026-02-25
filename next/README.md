# TypeMyAudio — Next.js

This is the migrated Next.js version of TypeMyAudio, combining the former Vite + React frontend and Express backend into a single Next.js application.

## Structure

- **`src/app/`** — App Router pages and API routes
- **`src/components/`** — React components
- **`src/lib/`** — Utilities, Supabase clients, services
- **`worker/`** — BullMQ transcription worker (runs as separate process)

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   - Copy `.env.example` to `.env.local`
   - Fill in your Supabase, Stripe, OpenAI, and Redis credentials

3. **Run development**
   ```bash
   npm run dev
   ```
   App runs at [http://localhost:3000](http://localhost:3000)

4. **Run the transcription worker** (separate terminal)
   ```bash
   npm run worker
   ```
   Requires Redis and the same env vars.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_URL` | Same as above (server-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `NEXT_PUBLIC_APP_URL` | App URL (e.g. `https://yourapp.vercel.app`) |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `OPENAI_API_KEY` | OpenAI API key |
| `REDIS_URL` | Redis URL for BullMQ |

## Deployment

### Vercel

1. Deploy the Next.js app to Vercel
2. Add all env vars in Vercel project settings
3. Configure Stripe webhook URL: `https://yourapp.vercel.app/api/webhooks/stripe`
4. Update Supabase Auth redirect URLs to include your Vercel domain

### Worker

The transcription worker must run separately (e.g. on Railway, Render, or a VPS) with:
- Redis
- Same env vars (Supabase, OpenAI, Redis)

## Migration from Vite + Express

- **Client**: `client/` → `src/app/` and `src/components/`
- **Server**: `server/src/routes/` → `src/app/api/`
- **Routing**: React Router → Next.js file-based routing
- **Env**: `import.meta.env.VITE_*` → `process.env.NEXT_PUBLIC_*`

## Legacy Folders

- `client/` and `server/` can be removed after the migration is verified.
- Keep `server/src/db/schema.sql` for reference.
