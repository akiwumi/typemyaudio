# TypeMyAudio — Deployment Guide

This guide covers deploying the full stack: Next.js on Vercel, Supabase, and the transcription worker.

---

## What You've Already Done

- ✅ Next.js app deployed on Vercel
- ✅ Supabase project set up

---

## Part 1: Changes to Your Existing Vercel Deployment

### 1.1 Add Redis Environment Variable

Your Vercel app needs `REDIS_URL` to queue transcription jobs. Without it, uploads will succeed but transcriptions will never process.

1. Go to [Vercel Dashboard](https://vercel.com) → your project → **Settings** → **Environment Variables**
2. Add:
   - **Name:** `REDIS_URL`
   - **Value:** (you'll get this in Part 2 when you create Redis)
   - **Environments:** Production, Preview
3. Redeploy the app after adding the variable (or it will apply on the next deploy)

### 1.2 Verify Other Environment Variables

Ensure these are set in Vercel (you likely already have them):

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | From Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Anon/public key |
| `SUPABASE_URL` | Yes | Same as above |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | **Service role JWT** (starts with `eyJ...`), NOT the Postgres connection string |
| `NEXT_PUBLIC_APP_URL` | Yes | Your Vercel URL, e.g. `https://typemyaudio.vercel.app` |
| `OPENAI_API_KEY` | Yes | For transcription |
| `REDIS_URL` | Yes | From Upstash/Railway (see Part 2) |
| `STRIPE_SECRET_KEY` | If using Stripe | |
| `STRIPE_WEBHOOK_SECRET` | If using Stripe | |

---

## Part 2: Changes to Your Existing Supabase Project

### 2.1 Auth Redirect URLs

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Authentication** → **URL Configuration**
2. Under **Redirect URLs**, add:
   - `https://typemyaudio.vercel.app/**`
   - `https://typemyaudio.vercel.app/auth/callback`
3. For preview deployments, optionally add: `https://*.vercel.app/**`

### 2.2 Verify Database Schema

Ensure you've run `server/src/db/schema.sql` in the Supabase SQL Editor. This creates:

- Tables: `profiles`, `transcriptions`, `usage_records`, etc.
- RLS policies
- Storage buckets: `audio-uploads`, `transcription-exports`
- Functions like `increment_free_used`

If not done yet: Supabase Dashboard → **SQL Editor** → New query → paste schema → Run.

### 2.3 Storage Buckets

Confirm the `audio-uploads` bucket exists: **Storage** in the sidebar. The schema creates it; if missing, create it manually and set appropriate RLS.

---

## Part 3: Create Redis (Upstash — Recommended)

Both Vercel (API) and the worker use the same Redis instance for the job queue.

### 3.1 Create Upstash Redis

1. Go to [console.upstash.com](https://console.upstash.com) and sign in
2. **Create Database**
3. Choose a region close to your Vercel region
4. Create the database
5. On the database page, copy the **Redis URL** (format: `rediss://default:PASSWORD@ENDPOINT.upstash.io:6379`)

### 3.2 Add REDIS_URL to Vercel

1. Vercel → Project → Settings → Environment Variables
2. Add `REDIS_URL` with the Upstash URL
3. Redeploy

---

## Part 4: Deploy the Transcription Worker

The worker runs outside Vercel (Railway, Render, or a VPS). It consumes jobs from Redis and processes audio via OpenAI.

### 4.1 Option A: Railway

1. Go to [railway.app](https://railway.app) and sign in
2. **New Project** → **Deploy from GitHub repo**
3. Select your `typemyaudio` repository
4. After the project is created, click the service → **Settings**:
   - **Root Directory:** `next`
   - **Build Command:** `npm install` (or leave default)
   - **Start Command:** `npm run worker:prod`
5. **Variables** tab → Add:
   - `REDIS_URL` (same Upstash URL as Vercel)
   - `SUPABASE_URL` (your Supabase project URL)
   - `SUPABASE_SERVICE_ROLE_KEY` (service role JWT)
   - `OPENAI_API_KEY`
6. Deploy. The worker will run continuously.

### 4.2 Option B: Render

1. Go to [render.com](https://render.com) and sign in
2. **New** → **Background Worker**
3. Connect your GitHub repo
4. Configure:
   - **Root Directory:** `next`
   - **Build Command:** `npm install`
   - **Start Command:** `npm run worker:prod`
5. Add environment variables (same as Railway)
6. Create the worker

### 4.3 Option C: Fly.io or VPS

For Fly.io or a VPS (DigitalOcean, etc.):

1. Deploy the `next` folder
2. Run: `npm install && npm run worker:prod`
3. Use PM2 or systemd to keep it running:
   ```bash
   pm2 start "npm run worker:prod" --name typemyaudio-worker
   pm2 save && pm2 startup
   ```

---

## Part 5: Verify End-to-End

1. **Vercel:** Visit your app, sign in, upload an audio file
2. **Queue:** The API adds a job to Redis
3. **Worker:** Picks up the job, downloads from Supabase Storage, transcribes via OpenAI, writes back to Supabase
4. **UI:** Refresh the transcription page; status should move from "pending" → "processing" → "completed"

---

## Troubleshooting

| Issue | Check |
|-------|--------|
| Upload works but transcription stays "pending" | Worker not running, or `REDIS_URL` mismatch between Vercel and worker |
| "Transcription service is not configured" | Add `REDIS_URL` to Vercel and redeploy |
| Worker exits immediately | Missing env vars; check logs for "Missing required env vars" |
| Redis connection failed | Use `rediss://` for Upstash (TLS). Ensure same `REDIS_URL` in Vercel and worker |
| Upload failed / storage error | Verify `audio-uploads` bucket exists and RLS allows service role |

---

## Architecture Summary

```
User uploads file
       ↓
Next.js API (Vercel) → inserts DB row → adds job to Redis
       ↓
Worker (Railway/Render) ← consumes from Redis
       ↓
Downloads from Supabase Storage → OpenAI Whisper → writes to Supabase DB
```
