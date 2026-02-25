# TypeMyAudio

AI-powered transcription web app for MP3 and MP4 files. Auto-detects language, translates, and exports to PDF, DOCX, TXT, and SRT.

## Tech Stack

**App:** Next.js 15, React 18, TypeScript, TailwindCSS

**Queue:** BullMQ, Redis

**AI:** OpenAI Whisper (transcription + language detection), GPT-4o (cleanup, translation, summarisation)

**Database & Auth:** Supabase (PostgreSQL, Auth, Storage, Realtime)

**Payments:** Stripe (subscriptions + token purchases)

## Features

- Upload MP3/MP4 files (up to 500MB) with drag-and-drop
- Automatic language detection across 98+ languages
- AI-powered grammar cleanup and punctuation
- Translation to 40+ target languages via GPT-4o
- Auto-generated summaries and key point extraction
- Export to PDF, DOCX, TXT, and SRT subtitle files
- Sentence-level timecodes with clickable playback (Enterprise)
- Freemium subscription model with Stripe billing
- Google OAuth and email/password authentication

## Project Structure

```
typemyaudio/
├── next/                   # Next.js app (primary)
│   ├── src/
│   │   ├── app/            # App Router pages and API routes
│   │   ├── components/     # UI, auth, layout components
│   │   ├── lib/            # Supabase, API, services
│   │   └── types/          # TypeScript definitions
│   └── worker/             # BullMQ transcription worker
├── server/                 # Legacy Express backend (reference)
│   └── src/db/schema.sql  # Database schema — run in Supabase
└── transcription-app-plan.md
```

## Pricing Tiers

| Tier | Price | Transcriptions | SRT | Timecodes |
|------|-------|----------------|-----|-----------|
| Free | €0 | 3 lifetime | No | No |
| Starter | €15/month | 15/month + tokens | No | No |
| Annual | €100/year | 15/month + tokens | Yes | No |
| Enterprise | Custom | Custom | Yes | Yes |

## Getting Started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- An [OpenAI](https://platform.openai.com) API key
- A [Stripe](https://stripe.com) account
- Redis (local or [Upstash](https://upstash.com))

### 1. Set up the database

Run `server/src/db/schema.sql` in the Supabase SQL Editor. This creates:

- Tables (profiles, transcriptions, usage_records, etc.)
- Indexes and RLS policies
- Storage buckets: `audio-uploads`, `transcription-exports`
- Storage policies for user-scoped uploads and exports

### 2. Clone and install

```bash
cd next
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in Supabase, Stripe, OpenAI, and Redis credentials. For local dev, set `NEXT_PUBLIC_APP_URL=http://localhost:3000` or leave it empty.

### 4. Run locally

```bash
# Terminal 1 — Next.js app
cd next
npm run dev

# Terminal 2 — Transcription worker
cd next
npm run worker
```

App runs at [http://localhost:3000](http://localhost:3000).

## Deployment

| Service | Platform |
|---------|----------|
| Next.js app | Vercel |
| Transcription worker | Railway / Render / VPS |
| Database + Auth + Storage | Supabase |
| Redis | Upstash |

## License

Private — all rights reserved.
