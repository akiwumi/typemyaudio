# 🎙️ Transcription Web App — Full Project Plan

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Architecture Overview](#3-architecture-overview)
4. [Step-by-Step Build Plan](#4-step-by-step-build-plan)
5. [Authentication & User Management](#5-authentication--user-management)
6. [Transcription Engine & AI Integration](#6-transcription-engine--ai-integration)
7. [File Export (PDF, DOCX, TXT, SRT)](#7-file-export-pdf-docx-txt-srt)
8. [Payment & Subscription System](#8-payment--subscription-system)
9. [Database Schema](#9-database-schema)
10. [Deployment](#10-deployment)
11. [Estimated Costs](#11-estimated-costs)

---

## 1. Project Overview

A web application that allows users to upload audio or video files, receive AI-powered transcriptions, and export results as PDF, DOCX, or TXT files. The app follows a freemium model with tiered subscriptions.

### Core User Flow

```
Register/Login → Upload MP3/MP4 → Auto-Detect Language → AI Transcribes → Review/Edit → Translate (optional) → Export File → Store in Account
```

### Supported File Formats

| Format | Type | Description |
|--------|------|-------------|
| `.mp3` | Audio | MPEG Audio Layer 3 |
| `.mp4` | Video | MPEG-4 video container |

> **Only MP3 and MP4 files are accepted.** All other formats will be rejected with a clear error message.

### Business Model

| Tier | Price | Transcriptions | Storage | SRT Subtitles | Sentence Timecodes |
|------|-------|---------------|---------|---------------|-------------------|
| Free | €0 | 3 total (lifetime) | No storage | ❌ | ❌ |
| Starter | €15/month | 15/month + buy more tokens | Duration of subscription | ❌ | ❌ |
| Annual | €100/year | 15/month + buy more tokens | Duration of subscription | ✅ | ❌ |
| Enterprise | Custom pricing | Custom | Custom — contact sales | ✅ | ✅ |

### Subscription Policy

- All subscriptions **auto-renew** at the end of each billing period (monthly or annually) unless cancelled.
- Users can **cancel at any time** from their account settings or via the Stripe/PayPal billing portal.
- Upon cancellation, the subscription remains active until the end of the current paid period. No prorated refunds.
- After the subscription expires, the user's tier reverts to **Free** and stored transcriptions become **inaccessible** (not deleted) until they resubscribe.
- Users receive an email reminder **7 days before** auto-renewal.

---

## 2. Tech Stack

### Frontend

| Tool | Purpose |
|------|---------|
| **React 18+** | UI framework |
| **Vite** | Build tool and dev server |
| **React Router v6** | Client-side routing |
| **TailwindCSS** | Styling |
| **shadcn/ui** | Pre-built accessible UI components |
| **React Hook Form + Zod** | Form handling and validation |
| **TanStack Query (React Query)** | Server state management, caching |
| **Zustand** | Lightweight client state management |

### Backend

| Tool | Purpose |
|------|---------|
| **Node.js 20+** | Runtime |
| **Express.js** | API framework |
| **Multer** | File upload handling (MP3/MP4 only, multipart/form-data) |
| **Bull / BullMQ** | Job queue for long-running transcription tasks |
| **Redis** | Queue backend + rate limiting + caching |

### Database & Storage

| Tool | Purpose |
|------|---------|
| **Supabase (PostgreSQL)** | Primary database |
| **Supabase Auth** | Authentication (email, Google/Gmail OAuth) |
| **Supabase Storage** | Audio/video file storage + transcription file storage |
| **Supabase Realtime** | Live transcription status updates to the client |

### AI / Transcription

| Tool | Purpose |
|------|---------|
| **OpenAI Whisper API** | Primary speech-to-text — auto-detects language, transcribes in source language |
| **AssemblyAI** *(alternative/fallback)* | Speaker diarization, better punctuation |
| **OpenAI GPT-4o** | Post-processing: grammar cleanup, summarisation, **translation to 40+ languages** |
| **Deepgram** *(optional alternative)* | Real-time transcription, cheaper at scale |

### Payments

| Tool | Purpose |
|------|---------|
| **Stripe** | Primary payment processor (subscriptions + one-time token purchases) |
| **PayPal** | Alternative payment method |
| **Stripe Billing Portal** | Self-service subscription management |

### File Export

| Tool | Purpose |
|------|---------|
| **docx (npm)** | Generate .docx Word documents |
| **pdfkit** or **@react-pdf/renderer** | Generate PDF files |
| **Plain text** | Native Node.js `fs` / Buffer for .txt |
| **Custom SRT generator** | Generate .srt subtitle files (Annual & Enterprise) |

### Deployment & Infrastructure

| Tool | Purpose |
|------|---------|
| **Vercel** | Frontend deployment + serverless API routes |
| **Railway / Render / Fly.io** | Backend (Express + BullMQ workers) — Vercel serverless has a 60s timeout which is too short for transcription |
| **Upstash Redis** | Serverless Redis for queues and rate limiting |
| **Vercel Blob** *(optional)* | Alternative temporary file storage |

### DevOps & Monitoring

| Tool | Purpose |
|------|---------|
| **GitHub Actions** | CI/CD pipeline |
| **Sentry** | Error tracking |
| **Posthog / Mixpanel** | Product analytics |
| **Resend** or **Supabase Email** | Transactional emails (welcome, password reset, receipts) |

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND (Vercel)                 │
│                  React + TailwindCSS                 │
│                                                     │
│  ┌──────────┐ ┌───────────┐ ┌────────────────────┐  │
│  │  Auth UI │ │ Dashboard │ │  Transcription UI  │  │
│  └──────────┘ └───────────┘ └────────────────────┘  │
└───────────────────────┬─────────────────────────────┘
                        │ HTTPS / REST API
                        ▼
┌─────────────────────────────────────────────────────┐
│              BACKEND (Railway / Render)              │
│              Node.js + Express.js                    │
│                                                     │
│  ┌────────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │  Auth MW   │ │ API      │ │  Stripe/PayPal   │  │
│  │  (Supabase)│ │ Routes   │ │  Webhooks        │  │
│  └────────────┘ └──────────┘ └──────────────────┘  │
│                      │                              │
│              ┌───────▼────────┐                     │
│              │   BullMQ       │                     │
│              │   Job Queue    │◄──── Upstash Redis  │
│              └───────┬────────┘                     │
│                      │                              │
│              ┌───────▼────────┐                     │
│              │  Transcription │                     │
│              │  Worker        │                     │
│              │  (Whisper API) │                     │
│              └────────────────┘                     │
└───────────────────────┬─────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│                   SUPABASE                          │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │   Auth   │  │ Postgres │  │     Storage      │  │
│  │  (OAuth) │  │   (DB)   │  │ (files + exports)│  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## 4. Step-by-Step Build Plan

### Phase 1: Project Setup & Authentication (Week 1–2)

**Step 1 — Initialize the project**

```bash
# Frontend
npm create vite@latest client -- --template react-ts
cd client && npm install tailwindcss @supabase/supabase-js react-router-dom

# Backend
mkdir server && cd server
npm init -y
npm install express cors dotenv multer @supabase/supabase-js stripe
```

**Step 2 — Set up Supabase**

- Create a Supabase project at [supabase.com](https://supabase.com)
- Enable the following Auth providers:
  - **Email/Password** (with email confirmation)
  - **Google OAuth** (for Gmail sign-in)
- Configure password recovery (built into Supabase Auth)
- Set up Storage buckets: `audio-uploads`, `transcription-exports`
- Set up Row Level Security (RLS) policies on all tables

**Step 3 — Build authentication flows**

- Registration page (email/password + Google OAuth)
- Login page
- Forgot password / password reset flow (Supabase handles the magic link)
- Email verification flow
- Protected route wrapper component
- Auth context provider with session management

**Step 4 — Build the user dashboard shell**

- Sidebar navigation
- Transcription history list (with language flags/badges)
- Account settings page
- Subscription status display

---

### Phase 2: File Upload & Transcription (Week 3–4)

**Step 5 — Build the upload system**

- Drag-and-drop file upload component (react-dropzone)
- **Accepted formats: `.mp3` and `.mp4` only** — all other formats are rejected
- Client-side validation: file type, file size limits (e.g., 500MB max)
- Server-side validation: verify MIME type (`audio/mpeg`, `video/mp4`) — do not trust file extension alone
- Upload progress bar
- Upload file to Supabase Storage via a signed upload URL

```javascript
// Client-side: accepted file types
const ACCEPTED_FORMATS = {
  "audio/mpeg": [".mp3"],
  "video/mp4": [".mp4"]
};

// react-dropzone config
<Dropzone
  accept={ACCEPTED_FORMATS}
  maxSize={500 * 1024 * 1024}  // 500MB
  onDropRejected={(rejections) => {
    toast.error("Only MP3 and MP4 files are supported.");
  }}
/>
```

```javascript
// Server-side: Multer file filter
const fileFilter = (req, file, cb) => {
  const allowedMimes = ["audio/mpeg", "video/mp4"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file format. Please upload an MP3 or MP4 file."), false);
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 500 * 1024 * 1024 }
});
```

**Step 6 — Build the transcription pipeline**

```
Upload (MP3/MP4) → Validate Format → Check quota → Queue job → Detect Language → Transcribe in Source Language → Post-process → Translate (optional) → Timecodes (Enterprise) → Store → Notify
```

- API endpoint: `POST /api/transcriptions`
- Middleware: verify auth token, check transcription quota
- Add job to BullMQ queue
- Worker picks up the job:
  1. Downloads the file from Supabase Storage
  2. **Auto-detects the spoken language** using Whisper (no language parameter = auto-detect)
  3. **Validates the detected language** is in the supported list — if not, fails with a user-friendly message
  4. Transcribes in the **original detected language** (not forced to English)
  5. (Optional) Sends to GPT-4o for cleanup / formatting
  6. (Optional) **Translates** the transcription to a user-selected target language via GPT-4o
  7. (Enterprise) Generates sentence-level timecodes from word timestamps
  8. Stores the transcription (original + translation if requested) in the database
  9. Updates job status
- Real-time status updates via Supabase Realtime or polling

**Step 7 — Build the transcription viewer/editor**

- Display detected language badge (e.g., "🇫🇷 French detected")
- Display transcription in the original language with timestamps
- Toggle between original and translated text (if translation was requested)
- Inline editing capability
- Speaker labels (if using AssemblyAI diarization)
- Audio/video playback synced with transcript
- Option to request translation to a different language after transcription

---

### Phase 3: AI Features (Week 5)

**Step 8 — Integrate AI-powered features**

| Feature | API | Description |
|---------|-----|-------------|
| **Smart Transcription** | Whisper API | Core speech-to-text with punctuation |
| **Auto Language Detection** | Whisper API | Automatically detects the spoken language — no user input needed |
| **Multi-Language Transcription** | Whisper API | Transcribes in the original language (98+ languages supported) |
| **Language Translation** | GPT-4o | Translates the transcription to any of 50+ target languages |
| **Unsupported Language Handling** | Custom | Notifies the user if the detected language cannot be transcribed |
| **Speaker Diarization** | AssemblyAI | Identify and label different speakers |
| **Auto-Summary** | GPT-4o | Generate a concise summary of the transcription |
| **Grammar & Punctuation Cleanup** | GPT-4o | Polish the raw transcription output |
| **Key Points Extraction** | GPT-4o | Pull out action items, decisions, key topics |
| **Sentiment Analysis** | GPT-4o | Analyse the tone/sentiment of the conversation |
| **Sentence-Level Timecodes** | Whisper + GPT-4o | Precise start/end timestamps for every sentence *(Enterprise only)* |
| **SRT Subtitle Export** | Whisper timestamps | Generate standard .srt subtitle files *(Annual & Enterprise only)* |
| **Custom Vocabulary** | Whisper prompt param | Improve accuracy for domain-specific terminology |
| **Search Within Transcriptions** | Supabase full-text search | Search across all stored transcriptions (any language) |
| **AI Chat with Transcript** | GPT-4o | Ask questions about a specific transcription |

**Implementation pattern for AI features (language-aware):**

```javascript
// Post-processing with GPT-4o — works in any detected language
const postProcess = async (rawTranscript, detectedLang, features) => {
  const langName = LANGUAGE_NAMES[detectedLang] || detectedLang;

  const messages = [
    {
      role: "system",
      content: `You are a transcription assistant. The following transcript is in ${langName}. 
Clean up and format it IN THE SAME LANGUAGE (${langName}). 
Do NOT translate to English unless explicitly asked.`
    },
    {
      role: "user",
      content: `Transcript:\n${rawTranscript}\n\nRequested: ${features.join(", ")}`
    }
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    temperature: 0.3
  });

  return response.choices[0].message.content;
};
```

---

### Phase 4: File Export (Week 5–6)

**Step 9 — Build export functionality (PDF, DOCX, TXT, SRT)**

**TXT Export:**
```javascript
const exportTxt = (transcription) => {
  return Buffer.from(transcription.text, "utf-8");
};
```

**DOCX Export (using `docx` npm package):**
```javascript
import { Document, Paragraph, TextRun, HeadingLevel } from "docx";

const exportDocx = (transcription) => {
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          text: transcription.title,
          heading: HeadingLevel.HEADING_1
        }),
        ...transcription.segments.map(seg =>
          new Paragraph({
            children: [
              new TextRun({ text: `[${seg.timestamp}] `, bold: true }),
              new TextRun(seg.text)
            ]
          })
        )
      ]
    }]
  });
  return Packer.toBuffer(doc);
};
```

**PDF Export (using `pdfkit`):**
```javascript
import PDFDocument from "pdfkit";

const exportPdf = (transcription) => {
  const doc = new PDFDocument();
  doc.fontSize(20).text(transcription.title, { align: "center" });
  doc.moveDown();
  transcription.segments.forEach(seg => {
    doc.fontSize(10).fillColor("gray").text(`[${seg.timestamp}]`, { continued: true });
    doc.fontSize(12).fillColor("black").text(` ${seg.text}`);
  });
  return doc;
};
```

---

### Phase 5: Payments & Subscriptions (Week 6–7)

**Step 10 — Set up Stripe**

- Create Stripe account and configure products:
  - **Starter Monthly**: €15/month, auto-renewing (price ID: `price_starter_monthly`)
  - **Annual**: €100/year, auto-renewing (price ID: `price_annual`)
  - **Token Top-up**: one-time purchase product for extra transcriptions
- Enable **Stripe Customer Portal** for self-service:
  - Subscription cancellation (takes effect at period end)
  - Payment method updates
  - Invoice history
- All subscriptions use `cancel_at_period_end` — users keep access until the billing period ends
- Configure webhooks:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated` (handles cancel_at_period_end changes)
  - `customer.subscription.deleted` (subscription actually expired)
  - `invoice.payment_succeeded` (handles auto-renewals)
  - `invoice.payment_failed`

**Step 11 — Set up PayPal**

- Create PayPal Developer account
- Set up subscription plans mirroring Stripe tiers
- Configure PayPal webhooks:
  - `BILLING.SUBSCRIPTION.CREATED`
  - `BILLING.SUBSCRIPTION.ACTIVATED`
  - `BILLING.SUBSCRIPTION.CANCELLED`
  - `BILLING.SUBSCRIPTION.SUSPENDED`
  - `BILLING.SUBSCRIPTION.RE-ACTIVATED`
  - `PAYMENT.SALE.COMPLETED`

**Step 12 — Build payment UI**

- Pricing page with tier comparison (highlighting SRT for Annual+, Timecodes for Enterprise)
- Checkout flow (Stripe Checkout / PayPal Buttons)
- Subscription management page:
  - Current plan and renewal date
  - Cancel subscription button (with confirmation: "You'll keep access until [date]")
  - Reactivate button (if cancellation is pending)
  - Auto-renewal status indicator
- Token purchase modal
- Invoice/receipt history
- Enterprise contact form

**Step 13 — Implement quota enforcement**

```javascript
// Middleware: check transcription quota
const checkQuota = async (req, res, next) => {
  const { userId } = req.auth;
  const user = await getUser(userId);
  const usedThisMonth = await getMonthlyUsage(userId);
  const purchased = await getPurchasedTokens(userId);

  const limits = {
    free: { total: 3 },
    starter: { monthly: 15 },
    annual: { monthly: 15 },
    enterprise: { monthly: Infinity }
  };

  const limit = limits[user.tier];

  if (user.tier === "free") {
    const totalUsed = await getTotalUsage(userId);
    if (totalUsed >= limit.total) {
      return res.status(403).json({ error: "Free tier limit reached. Please upgrade." });
    }
  } else {
    const availableTokens = limit.monthly - usedThisMonth + purchased;
    if (availableTokens <= 0) {
      return res.status(403).json({ error: "Monthly limit reached. Purchase more tokens or wait for reset." });
    }
  }

  next();
};
```

---

### Phase 6: Polish, Testing & Deployment (Week 8)

**Step 14 — Frontend polish**

- Responsive design (mobile, tablet, desktop)
- Loading skeletons and optimistic UI
- Toast notifications
- Error boundary components
- Dark mode (optional)
- Landing page with feature showcase
- SEO meta tags

**Step 15 — Testing**

- Unit tests: Vitest (frontend), Jest (backend)
- Integration tests: Supertest (API routes)
- E2E tests: Playwright
- Stripe test mode with test card numbers
- PayPal sandbox testing

**Step 16 — Deployment**

- Frontend → Vercel
- Backend → Railway or Render (for long-running processes)
- Redis → Upstash
- Database + Auth + Storage → Supabase (hosted)
- Set up environment variables on all platforms
- Configure custom domain and SSL
- Set up monitoring (Sentry, Vercel Analytics)

---

## 5. Authentication & User Management

### Supabase Auth Configuration

```javascript
// supabaseClient.js
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
```

### Auth Flows

**Email/Password Registration:**
```javascript
const { data, error } = await supabase.auth.signUp({
  email: "user@example.com",
  password: "securepassword",
  options: {
    data: { full_name: "John Doe" }
  }
});
```

**Google (Gmail) OAuth:**
```javascript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: `${window.location.origin}/auth/callback`
  }
});
```

**Password Reset / Recovery:**
```javascript
// Step 1: User requests reset
const { error } = await supabase.auth.resetPasswordForEmail(
  "user@example.com",
  { redirectTo: `${window.location.origin}/reset-password` }
);

// Step 2: User sets new password (on the reset page)
const { error } = await supabase.auth.updateUser({
  password: "newSecurePassword"
});
```

---

## 6. Transcription Engine & AI Integration

### Whisper API Integration

```javascript
import OpenAI from "openai";
import fs from "fs";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Transcribe audio/video with automatic language detection.
 * Does NOT force language — Whisper auto-detects and transcribes
 * in the original spoken language.
 */
const transcribe = async (filePath, options = {}) => {
  const response = await openai.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: "whisper-1",
    response_format: "verbose_json",  // includes timestamps + detected language
    timestamp_granularities: ["segment", "word"],  // word-level needed for Enterprise timecodes
    // NOTE: Do NOT pass `language` param — let Whisper auto-detect
    prompt: options.vocabulary || undefined  // custom vocabulary hint
  });

  // response.language → ISO 639-1 code of detected language (e.g., "fr", "ja", "de")
  // response.words → [{word, start, end}, ...] used for sentence timecodes
  return response;
};
```

### Language Detection & Validation

Whisper supports 98+ languages but quality varies. The app maintains a list of **reliably supported languages** and notifies users when a detected language is unsupported or low-confidence.

```javascript
/**
 * Whisper supported languages — grouped by transcription quality.
 * Source: OpenAI Whisper documentation
 */
const SUPPORTED_LANGUAGES = {
  // Tier 1: Excellent quality (Word Error Rate < 10%)
  tier1: [
    "en", "zh", "de", "es", "ru", "ko", "fr", "ja", "pt", "tr",
    "pl", "ca", "nl", "ar", "sv", "it", "id", "hi", "fi", "vi",
    "he", "uk", "el", "ms", "cs", "ro", "da", "hu", "ta", "no",
    "th", "ur", "hr", "bg", "lt", "la", "mi", "ml", "cy", "sk",
    "te", "fa", "lv", "bn", "sr", "az", "sl", "kn", "et", "mk",
    "br", "eu", "is", "hy", "ne", "mn", "bs", "kk", "sq", "sw",
    "gl", "mr", "pa", "si", "km", "sn", "yo", "so", "af", "oc",
    "ka", "be", "tg", "sd", "gu", "am", "yi", "lo", "uz", "fo",
    "ht", "ps", "tk", "nn", "mt", "sa", "lb", "my", "bo", "tl",
    "mg", "as", "tt", "haw", "ln", "ha", "ba", "jw", "su", "yue"
  ],

  // Tier 2: Lower quality — warn the user
  tier2: []
};

const LANGUAGE_NAMES = {
  en: "English", zh: "Chinese", de: "German", es: "Spanish",
  ru: "Russian", ko: "Korean", fr: "French", ja: "Japanese",
  pt: "Portuguese", tr: "Turkish", pl: "Polish", nl: "Dutch",
  ar: "Arabic", sv: "Swedish", it: "Italian", id: "Indonesian",
  hi: "Hindi", fi: "Finnish", vi: "Vietnamese", he: "Hebrew",
  uk: "Ukrainian", el: "Greek", ms: "Malay", cs: "Czech",
  ro: "Romanian", da: "Danish", hu: "Hungarian", ta: "Tamil",
  no: "Norwegian", th: "Thai", ur: "Urdu", hr: "Croatian",
  bg: "Bulgarian", lt: "Lithuanian", la: "Latin", cy: "Welsh",
  sk: "Slovak", te: "Telugu", fa: "Persian", bn: "Bengali",
  sr: "Serbian", sl: "Slovenian", sw: "Swahili", ka: "Georgian",
  be: "Belarusian", gu: "Gujarati", am: "Amharic", yi: "Yiddish",
  // ... (full list in production)
};

/**
 * Validate detected language. Returns error message if unsupported.
 */
const validateLanguage = (detectedLang) => {
  const allSupported = [...SUPPORTED_LANGUAGES.tier1, ...SUPPORTED_LANGUAGES.tier2];

  if (!detectedLang) {
    return {
      supported: false,
      message: "We couldn't detect the language in your audio. Please ensure the file contains clear speech and try again."
    };
  }

  if (!allSupported.includes(detectedLang)) {
    return {
      supported: false,
      message: `Sorry, we're unable to transcribe audio in "${detectedLang}". This language is not currently supported by our transcription engine. Supported languages include: English, Spanish, French, German, Chinese, Japanese, and 90+ others.`
    };
  }

  return {
    supported: true,
    language: detectedLang,
    languageName: LANGUAGE_NAMES[detectedLang] || detectedLang
  };
};
```

### Full Transcription Worker with Language Handling

```javascript
const processTranscription = async (job) => {
  const { transcriptionId, userId, filePath, targetLanguage } = job.data;

  try {
    // Step 1: Update status
    await updateTranscriptionStatus(transcriptionId, "processing");

    // Step 2: Transcribe with auto-detection
    const whisperResult = await transcribe(filePath);
    const detectedLang = whisperResult.language;

    // Step 3: Validate the detected language
    const validation = validateLanguage(detectedLang);

    if (!validation.supported) {
      await updateTranscription(transcriptionId, {
        status: "failed",
        error_message: validation.message,
        detected_language: detectedLang || "unknown"
      });
      // Notify user via Supabase Realtime
      await notifyUser(userId, {
        type: "transcription_failed",
        transcriptionId,
        message: validation.message
      });
      return;
    }

    // Step 4: Store raw transcription in the detected language
    await updateTranscription(transcriptionId, {
      raw_text: whisperResult.text,
      detected_language: detectedLang,
      detected_language_name: validation.languageName,
      segments: whisperResult.segments,
      status: "processing"
    });

    // Step 5: AI post-processing (cleanup in the source language)
    const cleanedText = await postProcess(whisperResult.text, detectedLang);

    // Step 6: Translation (if user requested a different target language)
    let translatedText = null;
    let translationLanguage = null;

    if (targetLanguage && targetLanguage !== detectedLang) {
      const translationResult = await translateTranscription(
        cleanedText, detectedLang, targetLanguage
      );
      translatedText = translationResult.text;
      translationLanguage = targetLanguage;
    }

    // Step 7: Enterprise timecodes (if applicable)
    const user = await getUser(userId);
    let sentenceTimecodes = null;
    if (user.tier === "enterprise" && whisperResult.words) {
      sentenceTimecodes = await generateSentenceTimecodes(whisperResult);
    }

    // Step 8: Finalize
    await updateTranscription(transcriptionId, {
      formatted_text: cleanedText,
      translated_text: translatedText,
      translation_language: translationLanguage,
      sentence_timecodes: sentenceTimecodes,
      status: "completed"
    });

    await notifyUser(userId, {
      type: "transcription_completed",
      transcriptionId,
      detectedLanguage: validation.languageName,
      translated: !!translatedText
    });

  } catch (error) {
    await updateTranscription(transcriptionId, {
      status: "failed",
      error_message: "An unexpected error occurred during transcription. Please try again."
    });
  }
};
```

### Translation System

```javascript
/**
 * Supported translation target languages.
 * GPT-4o supports high-quality translation for these languages.
 */
const TRANSLATION_TARGETS = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "nl", name: "Dutch" },
  { code: "ru", name: "Russian" },
  { code: "zh", name: "Chinese (Simplified)" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "tr", name: "Turkish" },
  { code: "pl", name: "Polish" },
  { code: "sv", name: "Swedish" },
  { code: "da", name: "Danish" },
  { code: "fi", name: "Finnish" },
  { code: "no", name: "Norwegian" },
  { code: "cs", name: "Czech" },
  { code: "ro", name: "Romanian" },
  { code: "hu", name: "Hungarian" },
  { code: "el", name: "Greek" },
  { code: "he", name: "Hebrew" },
  { code: "th", name: "Thai" },
  { code: "vi", name: "Vietnamese" },
  { code: "id", name: "Indonesian" },
  { code: "ms", name: "Malay" },
  { code: "uk", name: "Ukrainian" },
  { code: "bg", name: "Bulgarian" },
  { code: "hr", name: "Croatian" },
  { code: "sk", name: "Slovak" },
  { code: "sl", name: "Slovenian" },
  { code: "sr", name: "Serbian" },
  { code: "bn", name: "Bengali" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "ur", name: "Urdu" },
  { code: "fa", name: "Persian" },
  { code: "sw", name: "Swahili" },
  { code: "tl", name: "Filipino" },
  // Add more as needed
];

/**
 * Translate transcription text from source to target language using GPT-4o.
 */
const translateTranscription = async (text, sourceLang, targetLang) => {
  const sourceName = LANGUAGE_NAMES[sourceLang] || sourceLang;
  const targetName = TRANSLATION_TARGETS.find(t => t.code === targetLang)?.name || targetLang;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content: `You are a professional translator. Translate the following ${sourceName} text 
to ${targetName}. Maintain the original meaning, tone, and formatting. 
Preserve paragraph breaks and any speaker labels. 
Do NOT add explanations — return ONLY the translated text.`
      },
      {
        role: "user",
        content: text
      }
    ]
  });

  return {
    text: response.choices[0].message.content,
    sourceLang,
    targetLang,
    sourceName,
    targetName
  };
};

/**
 * Validate if translation is available for the requested target language.
 */
const validateTranslationTarget = (targetLang) => {
  const target = TRANSLATION_TARGETS.find(t => t.code === targetLang);
  if (!target) {
    return {
      valid: false,
      message: `Translation to "${targetLang}" is not currently supported. See available languages in your dashboard.`
    };
  }
  return { valid: true, language: target };
};
```

### Frontend: Upload with Language & Translation Options

```jsx
const UploadForm = () => {
  const [targetLanguage, setTargetLanguage] = useState(null);
  const [file, setFile] = useState(null);

  return (
    <div className="space-y-6">
      {/* File Upload — MP3 and MP4 only */}
      <Dropzone
        accept={{ "audio/mpeg": [".mp3"], "video/mp4": [".mp4"] }}
        maxSize={500 * 1024 * 1024}
        onDrop={(files) => setFile(files[0])}
        onDropRejected={() => toast.error("Only MP3 and MP4 files are supported.")}
      >
        {({ getRootProps, getInputProps }) => (
          <div {...getRootProps()} className="border-2 border-dashed rounded-xl p-12 text-center">
            <input {...getInputProps()} />
            <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-lg font-medium">Drop your MP3 or MP4 file here</p>
            <p className="text-sm text-gray-500">or click to browse (max 500MB)</p>
          </div>
        )}
      </Dropzone>

      {/* Language Detection Info */}
      <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
        <GlobeIcon className="inline h-4 w-4 mr-1" />
        Language is detected automatically — your file will be transcribed in its original language.
      </div>

      {/* Optional: Translation Target */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Translate transcription to another language? (optional)
        </label>
        <select
          value={targetLanguage || ""}
          onChange={(e) => setTargetLanguage(e.target.value || null)}
          className="w-full border rounded-lg p-3"
        >
          <option value="">No translation — keep original language</option>
          {TRANSLATION_TARGETS.map(lang => (
            <option key={lang.code} value={lang.code}>{lang.name}</option>
          ))}
        </select>
      </div>

      <button onClick={() => handleUpload(file, { targetLanguage })}>
        Start Transcription
      </button>
    </div>
  );
};
```

### User Notifications for Language Issues

```javascript
// Error messages shown to the user

const LANGUAGE_ERROR_MESSAGES = {
  unsupported: (lang) =>
    `We detected "${lang}" in your audio, but this language is not currently ` +
    `supported for transcription. We support 98+ languages including English, ` +
    `Spanish, French, German, Chinese, Japanese, Arabic, Hindi, and many more. ` +
    `Please try a different file.`,

  undetected:
    `We couldn't detect a spoken language in your file. This can happen if: ` +
    `the audio is too short, mostly silence, contains only music, or the ` +
    `recording quality is very low. Please check your file and try again.`,

  translation_unavailable: (targetLang) =>
    `Translation to "${targetLang}" is not currently available. ` +
    `Please choose from the available target languages in the dropdown.`,

  low_confidence: (lang, confidence) =>
    `We detected "${lang}" with ${Math.round(confidence * 100)}% confidence. ` +
    `The transcription quality may be lower than usual. Would you like to proceed?`
};
```

### AI Post-Processing Pipeline

```
                    Upload (MP3/MP4 only)
                          │
                          ▼
                 ┌─────────────────┐
                 │  Whisper API    │
                 │  Auto-Detect    │──── Language not supported?
                 │  Language       │     → Notify user & stop
                 └────────┬────────┘
                          │
                          ▼
              Transcribe in ORIGINAL language
                          │
                          ▼
               ┌─────────────────┐
               │  Grammar Cleanup │
               │  (source lang)   │
               └────────┬────────┘
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
       ┌──────────┐ ┌──────────┐ ┌──────────┐
       │ Summary  │ │Key Points│ │Sentiment │
       │(src lang)│ │(src lang)│ │ Analysis │
       └──────────┘ └──────────┘ └──────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │  Translation (opt.)   │
              │  Source → Target lang  │
              │  via GPT-4o           │
              └───────────────────────┘
```

### Sentence-Level Timecodes (Enterprise Only)

Enterprise users get precise start and end timestamps for every sentence in the transcription. This is powered by combining Whisper's word-level timestamps with GPT-4o sentence boundary detection.

**How it works:**

```
Whisper (word-level timestamps)
      │
      ▼
GPT-4o (sentence boundary detection)
      │
      ▼
Merge: map sentence boundaries back to word timestamps
      │
      ▼
Output: [{sentence, start, end, speaker?}, ...]
```

**Feature gate middleware:**

```javascript
// Middleware: check enterprise feature access
const requireEnterprise = async (req, res, next) => {
  const { userId } = req.auth;
  const user = await getUser(userId);

  if (user.tier !== "enterprise") {
    return res.status(403).json({
      error: "Sentence-level timecodes are available on the Enterprise plan.",
      upgrade_url: "/pricing#enterprise"
    });
  }

  next();
};
```

**Implementation:**

```javascript
const generateSentenceTimecodes = async (whisperResponse) => {
  // Step 1: Get word-level timestamps from Whisper
  const words = whisperResponse.words; // [{word, start, end}, ...]

  // Step 2: Use GPT-4o to detect sentence boundaries
  const fullText = words.map(w => w.word).join(" ");

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0,
    messages: [
      {
        role: "system",
        content: `You are a sentence boundary detector. Given a transcript, split it 
into individual sentences. Return a JSON array of sentences exactly as they 
appear in the input, preserving every word. Output ONLY valid JSON.`
      },
      {
        role: "user",
        content: fullText
      }
    ],
    response_format: { type: "json_object" }
  });

  const sentences = JSON.parse(response.choices[0].message.content).sentences;

  // Step 3: Map each sentence back to word-level timestamps
  let wordIndex = 0;
  const timedSentences = sentences.map((sentence) => {
    const sentenceWords = sentence.split(/\s+/);
    const startWord = words[wordIndex];
    wordIndex += sentenceWords.length;
    const endWord = words[Math.min(wordIndex - 1, words.length - 1)];

    return {
      sentence: sentence,
      start: startWord.start,     // e.g. 0.0
      end: endWord.end,           // e.g. 3.44
      start_fmt: formatTime(startWord.start),  // "00:00:00.000"
      end_fmt: formatTime(endWord.end)          // "00:00:03.440"
    };
  });

  return timedSentences;
};

// Helper: seconds → HH:MM:SS.mmm
const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  const ms = Math.round((seconds % 1) * 1000).toString().padStart(3, "0");
  return `${h}:${m}:${s}.${ms}`;
};
```

**Example output:**

```json
[
  {
    "sentence": "Welcome to today's quarterly earnings call.",
    "start": 0.0,
    "end": 2.88,
    "start_fmt": "00:00:00.000",
    "end_fmt": "00:00:02.880"
  },
  {
    "sentence": "I'd like to begin by reviewing our performance in Q3.",
    "start": 3.12,
    "end": 6.44,
    "start_fmt": "00:00:03.120",
    "end_fmt": "00:00:06.440"
  }
]
```

**Frontend display (Enterprise users):**

The transcription viewer shows clickable timecodes next to each sentence. Clicking a timecode jumps the audio/video player to that position.

```jsx
const TimedTranscript = ({ sentences, playerRef, isEnterprise }) => (
  <div className="space-y-2">
    {sentences.map((s, i) => (
      <div key={i} className="flex gap-3 group hover:bg-gray-50 p-2 rounded">
        {isEnterprise && (
          <button
            onClick={() => playerRef.current.seekTo(s.start)}
            className="text-xs font-mono text-blue-500 hover:underline whitespace-nowrap"
          >
            {s.start_fmt}
          </button>
        )}
        <p className="text-gray-800">{s.sentence}</p>
      </div>
    ))}
  </div>
);
```

**Export with timecodes (Enterprise only):**

When enterprise users export to PDF, DOCX, or TXT, each sentence is prefixed with its timecode:

```
[00:00:00.000 → 00:00:02.880]  Welcome to today's quarterly earnings call.
[00:00:03.120 → 00:00:06.440]  I'd like to begin by reviewing our performance in Q3.
[00:00:06.920 → 00:00:11.200]  Revenue grew 23% year over year, exceeding our guidance.
```

---

### SRT Subtitle Export (Annual & Enterprise Only)

Annual and Enterprise users can export transcriptions as `.srt` subtitle files — the industry-standard format for video subtitles compatible with YouTube, Vimeo, VLC, Premiere Pro, DaVinci Resolve, and more.

**Feature gate middleware:**

```javascript
const requireAnnualOrEnterprise = async (req, res, next) => {
  const { userId } = req.auth;
  const user = await getUser(userId);

  if (!["annual", "enterprise"].includes(user.tier)) {
    return res.status(403).json({
      error: "SRT subtitle export is available on Annual and Enterprise plans.",
      upgrade_url: "/pricing"
    });
  }

  next();
};
```

**SRT Generation:**

```javascript
/**
 * Generate SRT subtitle content from Whisper segments.
 * SRT format:
 *   1
 *   00:00:00,000 --> 00:00:02,880
 *   Welcome to today's quarterly earnings call.
 *
 *   2
 *   00:00:03,120 --> 00:00:06,440
 *   I'd like to begin by reviewing our performance in Q3.
 */
const generateSrt = (segments) => {
  return segments.map((seg, index) => {
    const startTime = formatSrtTime(seg.start);
    const endTime = formatSrtTime(seg.end);
    return `${index + 1}\n${startTime} --> ${endTime}\n${seg.text.trim()}\n`;
  }).join("\n");
};

// Helper: seconds → SRT timecode format (HH:MM:SS,mmm)
const formatSrtTime = (seconds) => {
  const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  const ms = Math.round((seconds % 1) * 1000).toString().padStart(3, "0");
  return `${h}:${m}:${s},${ms}`;  // SRT uses comma, not period
};
```

**Example .srt output:**

```
1
00:00:00,000 --> 00:00:02,880
Welcome to today's quarterly earnings call.

2
00:00:03,120 --> 00:00:06,440
I'd like to begin by reviewing our performance in Q3.

3
00:00:06,920 --> 00:00:11,200
Revenue grew 23% year over year, exceeding our guidance.
```

---

## 7. File Export (PDF, DOCX, TXT, SRT)

### NPM Packages

```json
{
  "dependencies": {
    "docx": "^8.5.0",
    "pdfkit": "^0.14.0"
  }
}
```

### API Endpoint

```javascript
// POST /api/transcriptions/:id/export
router.post("/transcriptions/:id/export", auth, async (req, res) => {
  const { format } = req.body; // "pdf" | "docx" | "txt" | "srt"
  const user = await getUser(req.auth.userId);
  const transcription = await getTranscription(req.params.id, req.auth.userId);
  const includeTimecodes = user.tier === "enterprise" && transcription.sentence_timecodes;

  // SRT is restricted to Annual and Enterprise tiers
  if (format === "srt" && !["annual", "enterprise"].includes(user.tier)) {
    return res.status(403).json({
      error: "SRT export is available on Annual and Enterprise plans.",
      upgrade_url: "/pricing"
    });
  }

  let buffer, contentType, extension;

  switch (format) {
    case "pdf":
      buffer = await generatePdf(transcription, { includeTimecodes });
      contentType = "application/pdf";
      extension = "pdf";
      break;
    case "docx":
      buffer = await generateDocx(transcription, { includeTimecodes });
      contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      extension = "docx";
      break;
    case "txt":
      buffer = generateTxt(transcription, { includeTimecodes });
      contentType = "text/plain";
      extension = "txt";
      break;
    case "srt":
      buffer = Buffer.from(generateSrt(transcription.segments), "utf-8");
      contentType = "application/x-subrip";
      extension = "srt";
      break;
  }

  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${transcription.title}.${extension}"`);
  res.send(buffer);
});

// TXT with optional enterprise timecodes
const generateTxt = (transcription, { includeTimecodes }) => {
  if (includeTimecodes && transcription.sentence_timecodes) {
    const lines = transcription.sentence_timecodes.map(s =>
      `[${s.start_fmt} → ${s.end_fmt}]  ${s.sentence}`
    );
    return Buffer.from(lines.join("\n"), "utf-8");
  }
  return Buffer.from(transcription.formatted_text || transcription.raw_text, "utf-8");
};
```

---

## 8. Payment & Subscription System

### Stripe Checkout Session

```javascript
const createCheckoutSession = async (userId, priceId, paymentMethod) => {
  if (paymentMethod === "stripe") {
    const session = await stripe.checkout.sessions.create({
      customer: user.stripe_customer_id,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/pricing`,
      metadata: { userId }
    });
    return session.url;
  }
};
```

### Token Purchase (One-Time)

```javascript
const purchaseTokens = async (userId, quantity) => {
  const session = await stripe.checkout.sessions.create({
    customer: user.stripe_customer_id,
    mode: "payment",
    line_items: [{
      price_data: {
        currency: "eur",
        unit_amount: 100,  // €1 per token — adjust pricing
        product_data: { name: "Transcription Token" }
      },
      quantity
    }],
    success_url: `${FRONTEND_URL}/dashboard`,
    cancel_url: `${FRONTEND_URL}/pricing`,
    metadata: { userId, type: "token_purchase", quantity }
  });
  return session.url;
};
```

### Webhook Handler

```javascript
// POST /api/webhooks/stripe
router.post("/webhooks/stripe", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutComplete(event.data.object);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionCancelled(event.data.object);
      break;
    case "invoice.payment_failed":
      await handlePaymentFailed(event.data.object);
      break;
  }

  res.json({ received: true });
});
```

### Subscription Cancellation & Auto-Renewal

```javascript
// POST /api/subscriptions/cancel — User requests cancellation
router.post("/subscriptions/cancel", auth, async (req, res) => {
  const user = await getUser(req.auth.userId);

  if (user.stripe_customer_id) {
    // Cancel at end of current period (user keeps access until then)
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripe_customer_id,
      status: "active"
    });

    if (subscriptions.data.length > 0) {
      await stripe.subscriptions.update(subscriptions.data[0].id, {
        cancel_at_period_end: true  // Does NOT cancel immediately
      });
    }
  }

  // Update local record
  await supabase.from("profiles").update({
    subscription_status: "cancelling",  // Still active, but won't renew
    updated_at: new Date().toISOString()
  }).eq("id", req.auth.userId);

  res.json({
    message: "Subscription will cancel at the end of your current billing period.",
    active_until: user.subscription_end
  });
});

// POST /api/subscriptions/reactivate — User undoes cancellation before period ends
router.post("/subscriptions/reactivate", auth, async (req, res) => {
  const user = await getUser(req.auth.userId);

  if (user.stripe_customer_id) {
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripe_customer_id,
      status: "active"
    });

    if (subscriptions.data.length > 0) {
      await stripe.subscriptions.update(subscriptions.data[0].id, {
        cancel_at_period_end: false  // Re-enable auto-renewal
      });
    }
  }

  await supabase.from("profiles").update({
    subscription_status: "active",
    updated_at: new Date().toISOString()
  }).eq("id", req.auth.userId);

  res.json({ message: "Subscription reactivated. It will auto-renew as normal." });
});

// Webhook: handle auto-renewal success
// Triggered by: invoice.payment_succeeded (recurring)
const handleRenewal = async (invoice) => {
  const customerId = invoice.customer;
  const user = await getUserByStripeId(customerId);

  // Reset monthly usage counter
  await supabase.from("profiles").update({
    subscription_status: "active",
    subscription_end: new Date(invoice.lines.data[0].period.end * 1000).toISOString(),
    updated_at: new Date().toISOString()
  }).eq("id", user.id);

  // Log renewal event
  await supabase.from("subscription_events").insert({
    user_id: user.id,
    event_type: "renewed",
    provider: "stripe",
    provider_event_id: invoice.id,
    tier: user.tier
  });

  // Send renewal confirmation email
  await sendEmail(user.email, "subscription_renewed", {
    tier: user.tier,
    next_renewal: new Date(invoice.lines.data[0].period.end * 1000)
  });
};

// Webhook: handle expiration after cancellation
// Triggered by: customer.subscription.deleted
const handleSubscriptionExpired = async (subscription) => {
  const customerId = subscription.customer;
  const user = await getUserByStripeId(customerId);

  // Downgrade to free tier — transcriptions are kept but inaccessible
  await supabase.from("profiles").update({
    tier: "free",
    subscription_status: "expired",
    subscription_end: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }).eq("id", user.id);

  await supabase.from("subscription_events").insert({
    user_id: user.id,
    event_type: "expired",
    provider: "stripe",
    provider_event_id: subscription.id,
    tier: "free"
  });

  await sendEmail(user.email, "subscription_expired", {
    resubscribe_url: `${FRONTEND_URL}/pricing`
  });
};
```

### Renewal Reminder Email (7 days before)

```javascript
// Cron job: runs daily — checks for upcoming renewals
const sendRenewalReminders = async () => {
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const { data: users } = await supabase
    .from("profiles")
    .select("*")
    .eq("subscription_status", "active")
    .gte("subscription_end", sevenDaysFromNow.toISOString().split("T")[0])
    .lte("subscription_end", sevenDaysFromNow.toISOString().split("T")[0] + "T23:59:59");

  for (const user of users) {
    await sendEmail(user.email, "renewal_reminder", {
      tier: user.tier,
      renewal_date: user.subscription_end,
      cancel_url: `${FRONTEND_URL}/account/subscription`
    });
  }
};
```

---

## 9. Database Schema

### Supabase / PostgreSQL Tables

```sql
-- Users profile (extends Supabase Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'starter', 'annual', 'enterprise')),
  stripe_customer_id TEXT UNIQUE,
  paypal_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'inactive',
  subscription_start TIMESTAMPTZ,
  subscription_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,  -- True if user has cancelled but period hasn't ended
  total_free_used INTEGER DEFAULT 0,
  purchased_tokens INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transcriptions
CREATE TABLE transcriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  original_filename TEXT,
  file_url TEXT,               -- Supabase Storage path
  file_size BIGINT,
  duration_seconds INTEGER,
  detected_language TEXT,          -- ISO 639-1 code auto-detected by Whisper (e.g., "fr", "ja")
  detected_language_name TEXT,     -- Human-readable name (e.g., "French", "Japanese")
  target_language TEXT,            -- User-requested translation target (null if no translation)
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  raw_text TEXT,                   -- Raw transcript in the ORIGINAL detected language
  formatted_text TEXT,             -- AI-cleaned transcript in the original language
  translated_text TEXT,            -- Translated transcript (null if no translation requested)
  translation_language TEXT,       -- Language code of the translation
  summary TEXT,                    -- AI-generated summary
  key_points JSONB,            -- AI-extracted key points
  segments JSONB,              -- Timestamped segments [{start, end, text, speaker}]
  sentence_timecodes JSONB,    -- Enterprise only: [{sentence, start, end, start_fmt, end_fmt}]
  word_count INTEGER,
  confidence_score FLOAT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Monthly usage tracking
CREATE TABLE usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  transcription_id UUID REFERENCES transcriptions(id),
  period_start DATE NOT NULL,  -- First day of the month
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Token purchases
CREATE TABLE token_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  amount_paid INTEGER NOT NULL, -- in cents
  currency TEXT DEFAULT 'eur',
  payment_provider TEXT CHECK (payment_provider IN ('stripe', 'paypal')),
  payment_id TEXT,              -- Stripe/PayPal transaction ID
  tokens_remaining INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription history
CREATE TABLE subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,     -- 'created', 'renewed', 'cancelled', 'expired', 'reactivated', 'payment_failed'
  provider TEXT,                -- 'stripe' or 'paypal'
  provider_event_id TEXT,
  tier TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enterprise enquiries
CREATE TABLE enterprise_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  message TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_transcriptions_user ON transcriptions(user_id);
CREATE INDEX idx_transcriptions_status ON transcriptions(status);
CREATE INDEX idx_transcriptions_language ON transcriptions(detected_language);
CREATE INDEX idx_usage_user_period ON usage_records(user_id, period_start);
CREATE INDEX idx_tokens_user ON token_purchases(user_id);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own transcriptions"
  ON transcriptions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transcriptions"
  ON transcriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transcriptions"
  ON transcriptions FOR DELETE USING (auth.uid() = user_id);
```

---

## 10. Deployment

### Vercel (Frontend)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd client
vercel --prod
```

**Environment Variables (Vercel Dashboard):**
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_URL=https://api.yourdomain.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### Railway (Backend)

```bash
# railway.toml
[build]
  builder = "nixpacks"

[deploy]
  startCommand = "node src/index.js"
  restartPolicyType = "on_failure"
```

**Environment Variables (Railway Dashboard):**
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
REDIS_URL=redis://...
FRONTEND_URL=https://yourdomain.com
```

---

## 11. Estimated Costs

### Monthly Costs at Scale (Approximate)

| Service | Free Tier | ~1,000 Users | ~10,000 Users |
|---------|-----------|-------------|--------------|
| Supabase | Free (500MB) | ~$25/mo (Pro) | ~$75/mo |
| Vercel | Free (Hobby) | Free–$20/mo | $20/mo (Pro) |
| Railway | $5/mo | ~$10–20/mo | ~$50–100/mo |
| Upstash Redis | Free (10k/day) | ~$10/mo | ~$30/mo |
| OpenAI Whisper | Pay per use | ~$60/mo* | ~$600/mo* |
| OpenAI GPT-4o | Pay per use | ~$30/mo* | ~$300/mo* |
| Stripe | 1.4%–2.9% + €0.25 | Variable | Variable |
| **Total** | **~$5/mo** | **~$155–165/mo** | **~$1,075–1,125/mo** |

*\* Based on average 5-minute transcriptions. Whisper costs ~$0.006/min, GPT-4o varies by usage.*

---

## Quick Start Checklist

- [ ] Create GitHub repository with `client/` and `server/` directories
- [ ] Set up Supabase project (Auth, Database, Storage)
- [ ] Configure Google OAuth in Supabase Dashboard
- [ ] Create Stripe account and subscription products
- [ ] Create PayPal developer account and subscription plans
- [ ] Get OpenAI API key
- [ ] Set up Upstash Redis instance
- [ ] Build auth flows (register, login, OAuth, password reset)
- [ ] Build file upload with validation (MP3 and MP4 only — client + server)
- [ ] Build transcription pipeline with BullMQ
- [ ] Implement auto language detection via Whisper
- [ ] Build unsupported language error handling and user notifications
- [ ] Integrate Whisper API and GPT-4o post-processing (language-aware)
- [ ] Build translation system with GPT-4o (40+ target languages)
- [ ] Build export system (PDF, DOCX, TXT, SRT)
- [ ] Implement Stripe Checkout + webhooks
- [ ] Implement PayPal subscriptions + webhooks
- [ ] Build quota enforcement middleware
- [ ] Build sentence-level timecodes pipeline (Enterprise feature gate)
- [ ] Build SRT subtitle export (Annual & Enterprise feature gate)
- [ ] Implement subscription cancellation & reactivation endpoints
- [ ] Implement auto-renewal webhook handling
- [ ] Set up renewal reminder email cron job (7-day notice)
- [ ] Build dashboard UI (history, player, editor)
- [ ] Deploy frontend to Vercel
- [ ] Deploy backend to Railway
- [ ] Configure custom domain and DNS
- [ ] Set up monitoring (Sentry, analytics)
- [ ] Test full flow end-to-end in production
