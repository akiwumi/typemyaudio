-- TypeMyAudio Database Schema
-- Run this in Supabase SQL Editor

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
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
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
  file_url TEXT,
  file_size BIGINT,
  duration_seconds INTEGER,
  detected_language TEXT,
  detected_language_name TEXT,
  target_language TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  raw_text TEXT,
  formatted_text TEXT,
  translated_text TEXT,
  translation_language TEXT,
  summary TEXT,
  key_points JSONB,
  segments JSONB,
  sentence_timecodes JSONB,
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
  period_start DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Token purchases
CREATE TABLE token_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  amount_paid INTEGER NOT NULL,
  currency TEXT DEFAULT 'eur',
  payment_provider TEXT CHECK (payment_provider IN ('stripe', 'paypal')),
  payment_id TEXT,
  tokens_remaining INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription history
CREATE TABLE subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  provider TEXT,
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

CREATE POLICY "Users can update own transcriptions"
  ON transcriptions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transcriptions"
  ON transcriptions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own usage"
  ON usage_records FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own token purchases"
  ON token_purchases FOR SELECT USING (auth.uid() = user_id);

-- Function: Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function: Increment purchased tokens
CREATE OR REPLACE FUNCTION public.increment_tokens(user_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET purchased_tokens = purchased_tokens + amount,
      updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Storage buckets (run in Supabase Storage settings or SQL)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('audio-uploads', 'audio-uploads', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('transcription-exports', 'transcription-exports', false);
