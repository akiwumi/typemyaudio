-- TypeMyAudio Database Schema
-- Run this in Supabase SQL Editor or via psql

-- ============================================
-- TABLES
-- ============================================

-- Users profile (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
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
CREATE TABLE IF NOT EXISTS transcriptions (
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
CREATE TABLE IF NOT EXISTS usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  transcription_id UUID REFERENCES transcriptions(id),
  period_start DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Token purchases
CREATE TABLE IF NOT EXISTS token_purchases (
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
CREATE TABLE IF NOT EXISTS subscription_events (
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
CREATE TABLE IF NOT EXISTS enterprise_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  message TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_transcriptions_user ON transcriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_status ON transcriptions(status);
CREATE INDEX IF NOT EXISTS idx_transcriptions_language ON transcriptions(detected_language);
CREATE INDEX IF NOT EXISTS idx_usage_user_period ON usage_records(user_id, period_start);
CREATE INDEX IF NOT EXISTS idx_tokens_user ON token_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_user ON subscription_events(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe ON profiles(stripe_customer_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_enquiries ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Allow service role to insert profiles (trigger runs as SECURITY DEFINER)
CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT WITH CHECK (true);

-- Transcriptions policies
CREATE POLICY "Users can view own transcriptions"
  ON transcriptions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transcriptions"
  ON transcriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transcriptions"
  ON transcriptions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transcriptions"
  ON transcriptions FOR DELETE USING (auth.uid() = user_id);

-- Usage records policies
CREATE POLICY "Users can view own usage"
  ON usage_records FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage"
  ON usage_records FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Token purchases policies
CREATE POLICY "Users can view own token purchases"
  ON token_purchases FOR SELECT USING (auth.uid() = user_id);

-- Subscription events policies
CREATE POLICY "Users can view own subscription events"
  ON subscription_events FOR SELECT USING (auth.uid() = user_id);

-- Enterprise enquiries: anyone authenticated can insert
CREATE POLICY "Authenticated users can submit enquiries"
  ON enterprise_enquiries FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists, then recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Increment purchased tokens
CREATE OR REPLACE FUNCTION public.increment_tokens(p_user_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET purchased_tokens = purchased_tokens + amount,
      updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment free tier usage counter
CREATE OR REPLACE FUNCTION public.increment_free_used(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET total_free_used = total_free_used + 1,
      updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS transcriptions_updated_at ON transcriptions;
CREATE TRIGGER transcriptions_updated_at
  BEFORE UPDATE ON transcriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- STORAGE BUCKETS
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-uploads',
  'audio-uploads',
  false,
  524288000,  -- 500MB
  ARRAY['audio/mpeg', 'video/mp4']
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES (
  'transcription-exports',
  'transcription-exports',
  false
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- audio-uploads: users can upload to their own folder
CREATE POLICY "Users can upload audio files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'audio-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- audio-uploads: users can read their own files
CREATE POLICY "Users can read own audio files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'audio-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- audio-uploads: users can delete their own files
CREATE POLICY "Users can delete own audio files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'audio-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- transcription-exports: users can read their own exports
CREATE POLICY "Users can read own exports"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'transcription-exports'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
