# TypeMyAudio — Next.js

Next.js version of TypeMyAudio, combining the former Vite + React frontend and Express backend into a single application.

## Structure

- **`src/app/`** — App Router pages and API routes
- **`src/components/`** — React components
- **`src/lib/`** — Utilities, Supabase clients, services
- **`worker/`** — BullMQ transcription worker (runs as separate process)

## Getting Started

### 1. Set up the database

Run `../server/src/db/schema.sql` in the Supabase SQL Editor. This creates tables, RLS policies, and storage buckets (`audio-uploads`, `transcription-exports`).

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Copy `.env.example` to `.env.local` and fill in:

- Supabase URL and keys (anon + service role)
- Stripe keys and webhook secret
- OpenAI API key
- Redis URL (e.g. `redis://localhost:6379`)

For local dev, set `NEXT_PUBLIC_APP_URL=http://localhost:3000` or leave empty to use relative URLs.

### 4. Run development

```bash
npm run dev
```

App runs at [http://localhost:3000](http://localhost:3000).

### 5. Run the transcription worker

In a separate terminal:

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
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role JWT (not Postgres URL) |
| `NEXT_PUBLIC_APP_URL` | App URL (e.g. `https://yourapp.vercel.app` or `http://localhost:3000`) |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `OPENAI_API_KEY` | OpenAI API key |
| `REDIS_URL` | Redis URL for BullMQ (e.g. `redis://localhost:6379`) |

## Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for a complete step-by-step guide, including:

- Vercel configuration (including `REDIS_URL`)
- Supabase Auth redirect URLs
- Redis setup (Upstash)
- Worker deployment (Railway, Render, or VPS)

### Quick summary

1. Deploy Next.js to Vercel and add all env vars (including `REDIS_URL`)
2. Configure Stripe webhook URL: `https://yourapp.vercel.app/api/webhooks/stripe`
3. Update Supabase Auth redirect URLs to include your Vercel domain
4. Deploy the worker separately with `npm run worker:prod` (Railway, Render, or VPS)

## Troubleshooting

**Upload failed** — Ensure the `audio-uploads` bucket exists (created by schema.sql). Check Supabase Storage in the dashboard. Verify `SUPABASE_SERVICE_ROLE_KEY` is the service role JWT, not the Postgres connection string.
