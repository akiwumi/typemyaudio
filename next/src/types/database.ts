export type Tier = "free" | "starter" | "annual" | "enterprise";
export type TranscriptionStatus = "pending" | "processing" | "completed" | "failed";
export type SubscriptionStatus = "inactive" | "active" | "cancelling" | "expired";

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  tier: Tier;
  stripe_customer_id: string | null;
  paypal_subscription_id: string | null;
  subscription_status: SubscriptionStatus;
  subscription_start: string | null;
  subscription_end: string | null;
  cancel_at_period_end: boolean;
  total_free_used: number;
  purchased_tokens: number;
  created_at: string;
  updated_at: string;
}

export interface Transcription {
  id: string;
  user_id: string;
  title: string;
  original_filename: string | null;
  file_url: string | null;
  file_size: number | null;
  duration_seconds: number | null;
  detected_language: string | null;
  detected_language_name: string | null;
  target_language: string | null;
  status: TranscriptionStatus;
  raw_text: string | null;
  formatted_text: string | null;
  translated_text: string | null;
  translation_language: string | null;
  summary: string | null;
  key_points: unknown[] | null;
  segments: TranscriptionSegment[] | null;
  sentence_timecodes: SentenceTimecode[] | null;
  word_count: number | null;
  confidence_score: number | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

export interface SentenceTimecode {
  sentence: string;
  start: number;
  end: number;
  start_fmt: string;
  end_fmt: string;
}

export interface UsageRecord {
  id: string;
  user_id: string;
  transcription_id: string;
  period_start: string;
  created_at: string;
}

export interface TokenPurchase {
  id: string;
  user_id: string;
  quantity: number;
  amount_paid: number;
  currency: string;
  payment_provider: "stripe" | "paypal";
  payment_id: string;
  tokens_remaining: number;
  created_at: string;
}

export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      transcriptions: { Row: Transcription; Insert: Partial<Transcription>; Update: Partial<Transcription> };
      usage_records: { Row: UsageRecord; Insert: Partial<UsageRecord>; Update: Partial<UsageRecord> };
      token_purchases: { Row: TokenPurchase; Insert: Partial<TokenPurchase>; Update: Partial<TokenPurchase> };
    };
  };
};
