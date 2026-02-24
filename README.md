# TypeMyAudio

AI-powered transcription web app for MP3 and MP4 files. Auto-detects language, translates, and exports to PDF, DOCX, TXT, and SRT.

## Tech Stack

**Frontend:** React 18, Vite, TypeScript, TailwindCSS, React Router, TanStack Query, Zustand

**Backend:** Node.js, Express, BullMQ, Redis, Multer

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
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/     # UI, auth, layout, dashboard components
│   │   ├── hooks/          # useAuth hook
│   │   ├── lib/            # Supabase client, API helper, utilities
│   │   ├── pages/          # All page components (auth, dashboard, landing, pricing)
│   │   ├── store/          # Zustand state management
│   │   └── types/          # TypeScript type definitions
│   └── vite.config.ts
├── server/                 # Node.js + Express backend
│   ├── src/
│   │   ├── config/         # Environment variables, Supabase admin client
│   │   ├── db/             # SQL schema with RLS policies
│   │   ├── middleware/     # Auth, quota enforcement, file upload validation
│   │   ├── routes/         # Transcriptions, exports, payments, webhooks, users
│   │   ├── services/       # Whisper API, GPT-4o, language validation, file export
│   │   └── worker.ts       # BullMQ transcription processing worker
│   └── railway.toml
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

### 1. Clone and install

```bash
# Frontend
cd client
npm install

# Backend
cd ../server
npm install
```

### 2. Configure environment variables

Copy the example files and fill in your keys:

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

### 3. Set up the database

Run `server/src/db/schema.sql` in the Supabase SQL Editor. This creates all tables, indexes, RLS policies, and the auto-profile trigger.

Create two storage buckets in Supabase: `audio-uploads` and `transcription-exports`.

### 4. Run locally

```bash
# Terminal 1 — Frontend
cd client
npm run dev

# Terminal 2 — Backend API
cd server
npm run dev

# Terminal 3 — Transcription worker
cd server
npm run worker
```

The frontend runs at `http://localhost:5173` and proxies API requests to the backend on port 3001.

## Deployment

| Service | Platform |
|---------|----------|
| Frontend | Vercel |
| Backend + Worker | Railway / Render |
| Database + Auth + Storage | Supabase |
| Redis | Upstash |

## License

Private — all rights reserved.
