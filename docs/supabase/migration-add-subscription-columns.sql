-- ============================================
-- Breath of Now - Migration Script
-- ============================================
-- Este script adiciona as colunas de subscription
-- à tabela profiles existente
-- ============================================

-- ============================================
-- 1. ADICIONAR COLUNAS EM FALTA À TABELA PROFILES
-- ============================================

-- Renomear coluna 'name' para 'full_name' se existir
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'name'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE public.profiles RENAME COLUMN name TO full_name;
  END IF;
END $$;

-- Adicionar colunas de subscription
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'free';

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_founding_member BOOLEAN DEFAULT FALSE;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS founding_member_number INTEGER;

-- Adicionar colunas de app selection
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS selected_apps TEXT[] DEFAULT '{}';

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS apps_selected_at TIMESTAMPTZ;

-- Adicionar colunas Stripe
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Adicionar colunas de metadata
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'PT';

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR';

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'en';

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_sign_in_at TIMESTAMPTZ;

-- ============================================
-- 2. ADICIONAR CONSTRAINTS
-- ============================================

-- Adicionar CHECK constraint para subscription_tier (se ainda nao existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'profiles_subscription_tier_check'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_subscription_tier_check
    CHECK (subscription_tier IN ('free', 'starter', 'plus', 'pro', 'founding'));
  END IF;
END $$;

-- Adicionar CHECK constraint para subscription_status (se ainda nao existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'profiles_subscription_status_check'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_subscription_status_check
    CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing'));
  END IF;
END $$;

-- Adicionar UNIQUE constraint para stripe_customer_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_stripe_customer_id_key' AND table_name = 'profiles'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_stripe_customer_id_key UNIQUE (stripe_customer_id);
  END IF;
END $$;

-- ============================================
-- 3. CRIAR INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON public.profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_founding_member ON public.profiles(is_founding_member) WHERE is_founding_member = TRUE;

-- ============================================
-- 4. CRIAR TABELAS ADICIONAIS
-- ============================================

-- Habilitar extensao para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- SUBSCRIPTION HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.subscription_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  previous_tier TEXT,
  new_tier TEXT NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('upgrade', 'downgrade', 'cancel', 'reactivate', 'founding')),

  amount_paid DECIMAL(10, 2),
  currency TEXT DEFAULT 'EUR',
  stripe_payment_id TEXT,

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_history_user_id ON public.subscription_history(user_id);

-- FOUNDING MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.founding_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  member_number INTEGER NOT NULL UNIQUE CHECK (member_number >= 1 AND member_number <= 100),

  display_name TEXT,
  show_in_hall_of_fame BOOLEAN DEFAULT TRUE,

  invites_given INTEGER DEFAULT 0,
  invites_used INTEGER DEFAULT 0,

  stripe_payment_id TEXT,
  amount_paid DECIMAL(10, 2) DEFAULT 599.00,

  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- USER INVITES TABLE
CREATE TABLE IF NOT EXISTS public.user_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,

  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  invite_type TEXT NOT NULL CHECK (invite_type IN ('founding_gift', 'trial_extension', 'discount')),
  benefit_value TEXT,

  max_uses INTEGER DEFAULT 1,
  times_used INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,

  used_by UUID[] DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_invites_code ON public.user_invites(code);
CREATE INDEX IF NOT EXISTS idx_user_invites_created_by ON public.user_invites(created_by);

-- ============================================
-- 5. CRIAR VIEW
-- ============================================

CREATE OR REPLACE VIEW public.user_app_access AS
SELECT
  p.id as user_id,
  p.subscription_tier as tier,
  p.selected_apps,
  p.is_founding_member,
  CASE
    WHEN p.subscription_tier IN ('free', 'pro', 'founding') THEN TRUE
    ELSE FALSE
  END as has_full_access,
  CASE
    WHEN p.subscription_tier = 'starter' THEN 1
    WHEN p.subscription_tier = 'plus' THEN 3
    ELSE NULL
  END as max_apps_selectable
FROM public.profiles p;

-- ============================================
-- 6. CRIAR FUNCTIONS
-- ============================================

-- Funcao para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at em profiles
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Funcao para verificar se user tem acesso a uma app especifica
CREATE OR REPLACE FUNCTION public.user_has_app_access(user_id UUID, app_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_tier TEXT;
  user_apps TEXT[];
BEGIN
  SELECT subscription_tier, selected_apps
  INTO user_tier, user_apps
  FROM public.profiles
  WHERE id = user_id;

  IF user_tier IN ('free', 'pro', 'founding') THEN
    RETURN TRUE;
  END IF;

  IF user_tier IN ('starter', 'plus') THEN
    RETURN app_id = ANY(user_apps);
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funcao para obter proximo numero de founding member
CREATE OR REPLACE FUNCTION public.get_next_founding_member_number()
RETURNS INTEGER AS $$
DECLARE
  next_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(member_number), 0) + 1 INTO next_number
  FROM public.founding_members;

  IF next_number > 100 THEN
    RAISE EXCEPTION 'All founding member spots are taken';
  END IF;

  RETURN next_number;
END;
$$ LANGUAGE plpgsql;

-- Funcao para contar founding members disponiveis
CREATE OR REPLACE FUNCTION public.get_founding_spots_remaining()
RETURNS INTEGER AS $$
DECLARE
  used_spots INTEGER;
BEGIN
  SELECT COUNT(*) INTO used_spots FROM public.founding_members;
  RETURN 100 - used_spots;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.founding_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_invites ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Subscription History policies
DROP POLICY IF EXISTS "Users can view own subscription history" ON public.subscription_history;
CREATE POLICY "Users can view own subscription history"
  ON public.subscription_history FOR SELECT
  USING (auth.uid() = user_id);

-- Founding Members policies
DROP POLICY IF EXISTS "Anyone can view founding members" ON public.founding_members;
CREATE POLICY "Anyone can view founding members"
  ON public.founding_members FOR SELECT
  USING (show_in_hall_of_fame = TRUE OR auth.uid() = user_id);

-- User Invites policies
DROP POLICY IF EXISTS "Users can manage own invites" ON public.user_invites;
CREATE POLICY "Users can manage own invites"
  ON public.user_invites FOR ALL
  USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Anyone can view active invites by code" ON public.user_invites;
CREATE POLICY "Anyone can view active invites by code"
  ON public.user_invites FOR SELECT
  USING (is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW()));

-- ============================================
-- 8. VERIFICACAO FINAL
-- ============================================

-- Mostra as colunas da tabela profiles apos migracao
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;
