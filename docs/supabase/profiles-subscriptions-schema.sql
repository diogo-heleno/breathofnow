-- ============================================
-- Breath of Now - Profiles & Subscriptions Schema
-- ============================================
-- Este schema cria as tabelas necessárias para:
-- 1. Perfis de utilizador
-- 2. Gestão de subscriptions/tiers
-- 3. Acesso a apps por tier
-- ============================================

-- Habilitar extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
-- Estende a tabela auth.users com informação adicional

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  
  -- Subscription info
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'plus', 'pro', 'founding')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing')),
  subscription_expires_at TIMESTAMPTZ,
  is_founding_member BOOLEAN DEFAULT FALSE,
  founding_member_number INTEGER,
  
  -- App selection (para starter e plus tiers)
  selected_apps TEXT[] DEFAULT '{}',
  apps_selected_at TIMESTAMPTZ,
  
  -- Stripe info
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  
  -- Metadata
  country TEXT DEFAULT 'PT',
  currency TEXT DEFAULT 'EUR',
  locale TEXT DEFAULT 'en',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_sign_in_at TIMESTAMPTZ
);

-- Index para pesquisa rápida
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON public.profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_founding_member ON public.profiles(is_founding_member) WHERE is_founding_member = TRUE;

-- ============================================
-- SUBSCRIPTION HISTORY TABLE
-- ============================================
-- Mantém histórico de alterações de subscription

CREATE TABLE IF NOT EXISTS public.subscription_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  previous_tier TEXT,
  new_tier TEXT NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('upgrade', 'downgrade', 'cancel', 'reactivate', 'founding')),
  
  -- Payment info
  amount_paid DECIMAL(10, 2),
  currency TEXT DEFAULT 'EUR',
  stripe_payment_id TEXT,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_history_user_id ON public.subscription_history(user_id);

-- ============================================
-- FOUNDING MEMBERS TABLE
-- ============================================
-- Lista especial de membros fundadores (máx 100)

CREATE TABLE IF NOT EXISTS public.founding_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  member_number INTEGER NOT NULL UNIQUE CHECK (member_number >= 1 AND member_number <= 100),
  
  -- Info
  display_name TEXT,
  show_in_hall_of_fame BOOLEAN DEFAULT TRUE,
  
  -- Invites (founding members podem convidar outros)
  invites_given INTEGER DEFAULT 0,
  invites_used INTEGER DEFAULT 0,
  
  -- Stripe
  stripe_payment_id TEXT,
  amount_paid DECIMAL(10, 2) DEFAULT 599.00,
  
  -- Timestamps
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER INVITES TABLE
-- ============================================
-- Sistema de convites

CREATE TABLE IF NOT EXISTS public.user_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  
  -- Quem criou o convite
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Benefício do convite
  invite_type TEXT NOT NULL CHECK (invite_type IN ('founding_gift', 'trial_extension', 'discount')),
  benefit_value TEXT, -- JSON com detalhes do benefício
  
  -- Status
  max_uses INTEGER DEFAULT 1,
  times_used INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Quem usou
  used_by UUID[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_invites_code ON public.user_invites(code);
CREATE INDEX IF NOT EXISTS idx_user_invites_created_by ON public.user_invites(created_by);

-- ============================================
-- APP ACCESS VIEW
-- ============================================
-- View para verificar acesso a apps

CREATE OR REPLACE VIEW public.user_app_access AS
SELECT 
  p.id as user_id,
  p.subscription_tier as tier,
  p.selected_apps,
  p.is_founding_member,
  CASE 
    -- Free, Pro, Founding têm acesso a tudo
    WHEN p.subscription_tier IN ('free', 'pro', 'founding') THEN TRUE
    -- Starter/Plus verificam selected_apps
    ELSE FALSE
  END as has_full_access,
  CASE 
    WHEN p.subscription_tier = 'starter' THEN 1
    WHEN p.subscription_tier = 'plus' THEN 3
    ELSE NULL
  END as max_apps_selectable
FROM public.profiles p;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Função para criar perfil automaticamente quando user se regista
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil em novo registo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função para atualizar updated_at automaticamente
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

-- Função para verificar se user tem acesso a uma app específica
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
  
  -- Free, Pro, Founding têm acesso a tudo
  IF user_tier IN ('free', 'pro', 'founding') THEN
    RETURN TRUE;
  END IF;
  
  -- Starter e Plus verificam selected_apps
  IF user_tier IN ('starter', 'plus') THEN
    RETURN app_id = ANY(user_apps);
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter próximo número de founding member
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

-- Função para contar founding members disponíveis
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
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.founding_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_invites ENABLE ROW LEVEL SECURITY;

-- Profiles: users podem ver e editar o próprio perfil
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Subscription History: users podem ver o próprio histórico
CREATE POLICY "Users can view own subscription history"
  ON public.subscription_history FOR SELECT
  USING (auth.uid() = user_id);

-- Founding Members: visível para todos (Hall of Fame)
CREATE POLICY "Anyone can view founding members"
  ON public.founding_members FOR SELECT
  USING (show_in_hall_of_fame = TRUE OR auth.uid() = user_id);

-- User Invites: criador pode gerir, qualquer um pode usar código válido
CREATE POLICY "Users can manage own invites"
  ON public.user_invites FOR ALL
  USING (auth.uid() = created_by);

CREATE POLICY "Anyone can view active invites by code"
  ON public.user_invites FOR SELECT
  USING (is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW()));

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Descomentar para adicionar dados de teste:
/*
-- Inserir founding member de teste
INSERT INTO public.founding_members (user_id, member_number, display_name)
SELECT id, 1, 'Founding Test User'
FROM public.profiles
WHERE email = 'test@example.com'
ON CONFLICT DO NOTHING;
*/

-- ============================================
-- NOTAS DE IMPLEMENTAÇÃO
-- ============================================
-- 
-- 1. STRIPE WEBHOOKS:
--    Configurar webhooks no Stripe para atualizar subscription_tier
--    quando pagamentos são processados.
--
-- 2. APP SELECTION:
--    Users com tier 'starter' ou 'plus' devem selecionar apps
--    através da UI. A mudança só pode ocorrer no início do
--    próximo período de faturação.
--
-- 3. FOUNDING MEMBERS:
--    Limitado a 100 lugares. Quando cheio, esconder opção na UI.
--
-- 4. INVITES:
--    Founding members podem criar convites especiais.
--    Implementar lógica de validação na aplicação.
--
-- ============================================
