-- Breath of Now - Auth & Profiles Migration
-- This migration creates the core tables for authentication and subscription management

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
-- Stores user profile data and subscription information
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,

  -- Subscription fields
  subscription_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'starter', 'plus', 'pro', 'founding')),
  subscription_expires_at TIMESTAMPTZ,
  selected_apps TEXT[] DEFAULT '{}',
  is_founding_member BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies: Users can only access their own profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. PREMIUM_EMAILS TABLE
-- ============================================
-- Whitelist of emails that should automatically receive premium/founding access
-- This allows the owner to grant premium access before users sign up
CREATE TABLE IF NOT EXISTS public.premium_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  tier TEXT NOT NULL DEFAULT 'pro'
    CHECK (tier IN ('starter', 'plus', 'pro', 'founding')),
  notes TEXT,
  granted_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_premium_emails_email ON public.premium_emails(email);

-- Enable RLS - Only service role can access this table
ALTER TABLE public.premium_emails ENABLE ROW LEVEL SECURITY;

-- No policies for regular users - only service role/admin can manage this table
-- The callback route uses the service role through the anon key with RLS bypass for this specific table

-- ============================================
-- 3. SUBSCRIPTIONS TABLE (for future Stripe integration)
-- ============================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Stripe fields
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,

  -- Subscription details
  status TEXT NOT NULL DEFAULT 'inactive'
    CHECK (status IN ('active', 'inactive', 'cancelled', 'past_due', 'trialing')),
  tier TEXT NOT NULL DEFAULT 'free'
    CHECK (tier IN ('free', 'starter', 'plus', 'pro', 'founding')),

  -- Billing details
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Subscriptions policies: Users can only view their own subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- 4. FUNCTION: Update profile subscription from subscriptions table
-- ============================================
CREATE OR REPLACE FUNCTION public.sync_profile_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the profile's subscription tier when subscription changes
  UPDATE public.profiles
  SET
    subscription_tier = NEW.tier,
    subscription_expires_at = NEW.current_period_end,
    updated_at = NOW()
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync subscription changes to profile
DROP TRIGGER IF EXISTS on_subscription_change ON public.subscriptions;
CREATE TRIGGER on_subscription_change
  AFTER INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_subscription();

-- ============================================
-- 5. FUNCTION: Handle new user signup
-- ============================================
-- This function is called by Supabase Auth when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  premium_tier TEXT;
BEGIN
  -- Check if email is in premium_emails table
  SELECT tier INTO premium_tier
  FROM public.premium_emails
  WHERE email = NEW.email;

  -- Insert profile with appropriate tier
  INSERT INTO public.profiles (id, email, full_name, avatar_url, subscription_tier, is_founding_member)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(premium_tier, 'free'),
    COALESCE(premium_tier, '') = 'founding'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 6. GRANTS
-- ============================================
-- Grant access to authenticated users
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.subscriptions TO authenticated;

-- Allow anon to read premium_emails for signup flow
GRANT SELECT ON public.premium_emails TO anon;
GRANT SELECT ON public.premium_emails TO authenticated;

-- ============================================
-- 7. HELPER: Add premium email (run as admin)
-- ============================================
-- Example usage:
-- INSERT INTO public.premium_emails (email, tier, notes, granted_by)
-- VALUES ('friend@example.com', 'pro', 'Early supporter', 'admin');
--
-- For founding members:
-- INSERT INTO public.premium_emails (email, tier, notes, granted_by)
-- VALUES ('founder@example.com', 'founding', 'Founding member', 'admin');
