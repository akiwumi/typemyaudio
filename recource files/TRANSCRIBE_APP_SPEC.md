# Transcription Web App — Build Plan + Tech Stack (React + Node/Express + Supabase + Vercel)

## 1) What you’re building (at a glance)
A web app where users:
- Create an account (email/password + Google OAuth)
- Upload an **audio or video** file
- Get:
  - **Speaker-labelled transcription** (where possible)
  - Optional **summary / action items / chapters / keywords**
- Export results to **PDF**, **TXT**, or **DOCX**
- Store transcriptions in their account:
  - **Free users:** 3 total transcriptions
  - **Paid users:** can store transcriptions while subscription is active

Monetization:
- **Free:** 3 transcriptions
- **Monthly:** €15/month, limit **15 transcriptions/month**
- **Yearly:** €100/year, limit **15 transcriptions/month**
- **Enterprise:** contact sales
- Optional **extra credits/tokens** add-on purchases

Payments:
- **Stripe** (recommended as primary)
- **PayPal** (additional option)

Deployment:
- Frontend on **Vercel**
- Backend API on **Vercel** (serverless functions) *or* a separate Node runtime
- Storage and DB with **Supabase**

---

## 2) Recommended tech stack

### Frontend (React)
- **React + TypeScript**
- **Vite** or Next.js (either works)
- UI: Tailwind CSS + component library (shadcn/ui or similar)
- Upload: chunked upload UI, progress indicator
- State: Zustand / React Query

### Backend (Node.js + Express)
- **Node.js + Express** API
- Job orchestration: 
  - **Option A (simple):** request → upload → create “job” row → background processing via Supabase Edge Function/Queue pattern
  - **Option B (robust):** a dedicated worker (Render/Fly.io) that polls jobs and processes transcriptions

### Supabase
- **Auth**: Email/password + Google OAuth, password reset
- **Database**: Postgres
- **Storage**: store uploaded media and generated exports
- **Row Level Security (RLS)**: strict per-user access

### AI / Transcription
Pick one:
- **OpenAI** (speech-to-text + optional diarization-like assistance)
- **Deepgram** / **AssemblyAI** / **Whisper** (hosted) for stronger diarization features

**Reality check:** Perfect “speaker separation” (diarization) depends on provider. Whisper-style transcription often does **not** guarantee diarization. If diarization is a hard requirement, pick a vendor that explicitly supports it (e.g., Deepgram / AssemblyAI).

### Document generation
- PDF: `pdf-lib` or `puppeteer` (HTML → PDF)
- DOCX: `docx` (npm) or `mammoth` (for conversions)
- TXT: native string output

### Payments
- Stripe Subscriptions (monthly + yearly)
- Stripe one-time purchases for extra credits
- PayPal subscriptions or one-time (depending on your model)
- Webhooks to sync payment state into Supabase

---

## 3) Step-by-step build plan

### Step 1 — Define product rules + limits
1. Free user: **3 total transcriptions** ever (or per month if you prefer; you specified total).
2. Monthly: **15 transcriptions/month**
3. Yearly: **15 transcriptions/month**
4. Add-on credits: user can buy extra transcription credits (define price per pack)
5. Storage policy:
   - Free: store transcriptions (you decide: forever or limited; you stated paid users store for period of subscription)
   - Paid: store while subscription active; when it ends, either:
     - lock access, or
     - allow read-only for a grace period, then delete

**Tip:** Avoid “tokens” language in UI; users understand **credits/transcriptions**.

### Step 2 — Set up Supabase Auth
Implement:
- Email/password signup + email confirmation
- Password reset flow (“forgot password”)
- Google OAuth signup/login

Store:
- `profiles` table keyed by `auth.users.id`
- plan status, limits, and usage counters

### Step 3 — Create your DB schema (minimum viable)
Tables (suggested):

- `profiles`
  - `id` (uuid, pk, = auth user id)
  - `email`
  - `full_name`
  - `plan` (enum: free, monthly, yearly, enterprise)
  - `plan_status` (active, past_due, canceled)
  - `current_period_start` (timestamp)
  - `current_period_end` (timestamp)
  - `monthly_limit` (int default 15 for paid)
  - `free_limit_total` (int default 3)
  - `created_at`

- `subscriptions`
  - `id` (uuid)
  - `user_id` (uuid)
  - `provider` (stripe, paypal)
  - `provider_customer_id`
  - `provider_subscription_id`
  - `status` (active, trialing, past_due, canceled)
  - `price_id` (stripe price id / paypal plan id)
  - `current_period_start`
  - `current_period_end`
  - `cancel_at_period_end` (bool)

- `transcription_jobs`
  - `id` (uuid)
  - `user_id`
  - `status` (queued, processing, completed, failed)
  - `source_type` (audio, video)
  - `original_filename`
  - `storage_path` (Supabase storage path)
  - `language` (optional)
  - `provider` (openai, deepgram, assemblyai)
  - `provider_job_id` (optional)
  - `duration_seconds` (optional)
  - `error_message` (optional)
  - `created_at`, `updated_at`

- `transcriptions`
  - `id` (uuid)
  - `job_id` (uuid)
  - `user_id`
  - `title`
  - `text` (full transcript)
  - `segments` (jsonb: timestamps, speaker labels if available)
  - `summary` (text)
  - `action_items` (jsonb)
  - `keywords` (jsonb)
  - `created_at`

- `usage_ledger`
  - `id` (uuid)
  - `user_id`
  - `type` (transcription, add_on_credit)
  - `amount` (+1 transcription used, or +credits purchased)
  - `job_id` (nullable)
  - `created_at`

**RLS:**
- Users can only read/write their own rows.
- Service role (server) can write to any.

### Step 4 — Storage buckets
Create Supabase Storage buckets:
- `uploads` (private)
- `exports` (private)

Store path pattern:
- `uploads/{userId}/{jobId}/{filename}`
- `exports/{userId}/{jobId}/transcript.pdf|docx|txt`

### Step 5 — Build the core upload + job flow
**Frontend flow**:
1. User chooses file (audio/video)
2. App calls your API: `POST /jobs` (creates job and returns signed upload URL)
3. App uploads file directly to Supabase Storage using signed URL
4. App calls: `POST /jobs/:id/submit` (marks job queued)
5. UI shows job status updates via polling or realtime subscriptions

**Backend flow**:
1. Validate user session
2. Enforce limits (free 3 total OR paid 15/month)
3. Create job row + generate signed upload URL
4. On submit → enqueue processing

### Step 6 — Implement transcription processing (worker)
You need a “worker” process to:
- Download media (or stream)
- Send to transcription provider
- Save transcript + segments
- Generate exports

**Option A: Worker on Vercel (simpler but limited)**
- Use Vercel Serverless Functions to kick off work.
- Works for small files, but long processing can hit timeouts.

**Option B: Dedicated worker (recommended for reliability)**
- Deploy a Node worker on Render/Fly.io.
- Worker polls `transcription_jobs` where `status='queued'`.
- Processes jobs, updates status.

**Why a worker helps:** Transcription can take longer than serverless time limits.

### Step 7 — Generate PDF / DOCX / TXT
When transcription completes:
- Generate documents server-side and upload to `exports` bucket.
- Save export links/paths in `transcriptions` row.

Formats:
- **TXT:** just the transcript
- **DOCX:** title, metadata, transcript, optional summary/action items
- **PDF:** clean typographic layout (title, date, sections)

### Step 8 — Build the dashboard UX
Pages:
- Landing + pricing
- Signup/login
- Dashboard:
  - Upload new
  - List transcriptions
  - View transcription details
  - Export buttons (PDF/DOCX/TXT)
  - Usage meter (e.g., “5/15 this month”)
- Billing page:
  - Manage subscription (Stripe Customer Portal)
  - Buy add-on credits

### Step 9 — Integrate payments (Stripe + PayPal)

#### Stripe (recommended flow)
1. Create Stripe products/prices:
   - Monthly €15
   - Yearly €100
   - Add-on credits (one-time)
2. Checkout session from your backend: `POST /billing/stripe/checkout`
3. Handle webhook events:
   - `checkout.session.completed`
   - `invoice.paid`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Webhook updates `subscriptions` + `profiles.plan_status` + period dates.

**Stripe Customer Portal:** let users manage cancel/payment method updates.

#### PayPal
- Use PayPal Subscriptions for monthly/yearly OR use PayPal for one-time top-ups.
- Also needs webhooks to sync status into Supabase.

**Important:** Never trust the frontend for payment status; always confirm via webhook + your DB.

### Step 10 — Enforce quota and retention
Quota enforcement should happen server-side in `POST /jobs`:
- Compute “used this month” from `usage_ledger` entries within current period.
- For free plan: count total used.
- For add-ons: allow user to exceed the monthly cap by consuming purchased credits.

Retention policy job:
- Daily cron (Vercel Cron or external) checks:
  - If subscription ended and grace period passed → delete exports/uploads/transcriptions
  - Or lock them and prompt user to resubscribe

---

## 4) API endpoints (Express)
Suggested minimal routes:

### Auth
- Auth is primarily handled by Supabase Auth; backend just verifies JWT.

### Jobs
- `POST /jobs`
  - validates quota
  - creates `transcription_jobs`
  - returns signed upload URL + job id

- `POST /jobs/:id/submit`
  - marks job as `queued`

- `GET /jobs`
  - list user jobs

- `GET /jobs/:id`
  - job details + status

### Transcriptions
- `GET /transcriptions`
- `GET /transcriptions/:id`

### Exports
- `POST /transcriptions/:id/export?type=pdf|docx|txt`
  - (optional) regenerate export
  - returns signed download URL

### Billing
- `POST /billing/stripe/checkout`
- `POST /billing/stripe/portal`
- `POST /billing/paypal/create-subscription` (if using)

### Webhooks
- `POST /webhooks/stripe`
- `POST /webhooks/paypal`

---

## 5) AI integration: what “AI assistant” should do
Beyond transcription, AI can improve the experience:

### A) Transcript enhancement
- Clean up filler words (optional toggle)
- Add punctuation/casing
- Detect sections / chapters with timestamps
- Create:
  - summary (short + detailed)
  - action items (with owners if possible)
  - decisions
  - key topics and keywords

### B) Ask-your-transcript chat
Let users ask:
- “What were the key decisions?”
- “List action items and deadlines.”
- “Draft an email summary to my team.”
- “Create meeting minutes.”

Implementation:
- Store transcript text + segments in DB.
- Use RAG-lite: send relevant chunks or the whole transcript if short.

### C) Smart export templates
- “Meeting Minutes” template
- “Interview Transcript” template
- “Podcast Show Notes” template

### D) Language + translation
- Auto-detect language
- Translate transcript to another language

---

## 6) Security and compliance essentials
- Private storage buckets + signed URLs only
- Virus scanning (optional but recommended): scan uploads before processing
- File size limits (front + back)
- Rate limiting + abuse prevention (especially for free tier)
- Logging + audit for billing changes
- GDPR-minded controls (export/delete user data)

---

## 7) Vercel deployment approach

### Option 1: Frontend on Vercel + Backend on Vercel
- Express API as Vercel Serverless Functions (may require adaptation)
- Good for small/medium workloads
- Watch out for timeouts on long transcriptions

### Option 2: Frontend on Vercel + Dedicated backend/worker
- Frontend (Vercel)
- API (Vercel or Render)
- Worker (Render/Fly)
- Best reliability for processing jobs

---

## 8) Suggested implementation order (practical)
1. Supabase project + Auth (email + Google) + RLS
2. Storage buckets + signed upload flow
3. Jobs table + basic dashboard
4. Transcription provider integration (one provider first)
5. Export generation (TXT → DOCX → PDF)
6. Quotas (free 3 + paid limits)
7. Stripe subscriptions + webhook syncing
8. PayPal integration (optional second)
9. AI assistant features (summaries, chat)
10. Retention/cleanup cron + admin tools

---

## 9) Pricing logic (how to model it cleanly)
- Treat each transcription as **1 credit**.
- Monthly/yearly plans grant **15 credits per month**.
- Add-on purchases add extra credits to `usage_ledger`.

When user starts a job:
1. If plan is free: check lifetime used < 3.
2. If paid: check used in current month < 15 OR available add-on credits.
3. On job completion: write `usage_ledger` entry `type='transcription', amount=-1`.

(Alternatively, store `credits_balance` on profile and decrement—ledger is more auditable.)

---

## 10) What you’ll need (checklist)

### Accounts / services
- Supabase project
- Vercel project
- Stripe account + products/prices
- PayPal developer account (subscriptions or checkout)
- Transcription provider key (OpenAI/Deepgram/AssemblyAI)

### Libraries (suggested)
- Upload: `@supabase/supabase-js`
- Auth UI: Supabase Auth helpers
- Backend: `express`, `zod` (validation), `jsonwebtoken` (if needed), `multer` (if proxying uploads)
- PDF: `pdf-lib` or `puppeteer`
- DOCX: `docx`
- Background jobs: a simple polling worker + retry logic

---

## 11) UX notes that users love
- Show upload progress + estimated time
- Allow choosing:
  - language
  - “clean transcript” vs “verbatim”
  - output template (minutes/interview/podcast)
- After completion: one-click exports + share link (time-limited signed URL)
- Usage meter + “buy more credits” call-to-action

---

## 12) Next steps you can implement immediately
1. Create the Supabase schema + RLS
2. Build auth screens (email + Google + forgot password)
3. Build upload → create job → signed URL upload
4. Build worker that processes queued jobs
5. Store transcript + generate TXT export
6. Add Stripe subscriptions + webhook sync

