-- ============================================
-- ExpenseFlow Subscriptions Schema
-- Execute this in Supabase SQL Editor
-- ============================================

-- User Subscriptions Table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Subscription details
    tier VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'starter', 'plus', 'pro', 'founding')),
    is_active BOOLEAN DEFAULT true,
    
    -- Billing
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    
    -- Dates
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    
    -- Founding member special
    is_founding_member BOOLEAN DEFAULT false,
    founding_member_number INTEGER,
    
    -- PWYW pricing
    custom_monthly_price DECIMAL(10,2),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer ON public.user_subscriptions(stripe_customer_id);

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own subscription
CREATE POLICY "Users can view own subscription"
    ON public.user_subscriptions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can update their own subscription (for PWYW price)
CREATE POLICY "Users can update own subscription"
    ON public.user_subscriptions
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Only service role can insert/delete (handled by webhooks)
CREATE POLICY "Service role can manage subscriptions"
    ON public.user_subscriptions
    FOR ALL
    USING (auth.role() = 'service_role');

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_subscription_timestamp
    BEFORE UPDATE ON public.user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_subscription_updated_at();

-- Function to check if user is premium
CREATE OR REPLACE FUNCTION is_user_premium(check_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    sub_record RECORD;
BEGIN
    SELECT * INTO sub_record
    FROM public.user_subscriptions
    WHERE user_id = check_user_id
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
    AND tier != 'free';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user tier
CREATE OR REPLACE FUNCTION get_user_tier(check_user_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    user_tier VARCHAR;
BEGIN
    SELECT tier INTO user_tier
    FROM public.user_subscriptions
    WHERE user_id = check_user_id
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW());
    
    RETURN COALESCE(user_tier, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create subscription for new users automatically
CREATE OR REPLACE FUNCTION create_subscription_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_subscriptions (user_id, tier, is_active)
    VALUES (NEW.id, 'free', true)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create subscription on user signup
CREATE TRIGGER on_auth_user_created_subscription
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_subscription_for_new_user();

-- ============================================
-- Founding Members Counter
-- ============================================

CREATE TABLE IF NOT EXISTS public.founding_members_config (
    id INTEGER PRIMARY KEY DEFAULT 1,
    total_slots INTEGER DEFAULT 100,
    slots_taken INTEGER DEFAULT 0,
    price_eur DECIMAL(10,2) DEFAULT 599.00,
    is_available BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT single_row CHECK (id = 1)
);

-- Insert default config
INSERT INTO public.founding_members_config (id, total_slots, slots_taken, price_eur, is_available)
VALUES (1, 100, 0, 599.00, true)
ON CONFLICT (id) DO NOTHING;

-- Function to claim founding member slot
CREATE OR REPLACE FUNCTION claim_founding_member_slot(claim_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    current_slots INTEGER;
    total INTEGER;
    member_number INTEGER;
BEGIN
    -- Lock the config row
    SELECT slots_taken, total_slots INTO current_slots, total
    FROM public.founding_members_config
    WHERE id = 1
    FOR UPDATE;
    
    -- Check if slots available
    IF current_slots >= total THEN
        RAISE EXCEPTION 'No founding member slots available';
    END IF;
    
    -- Increment counter
    member_number := current_slots + 1;
    
    UPDATE public.founding_members_config
    SET slots_taken = member_number,
        updated_at = NOW(),
        is_available = (member_number < total)
    WHERE id = 1;
    
    -- Update user subscription
    UPDATE public.user_subscriptions
    SET tier = 'founding',
        is_founding_member = true,
        founding_member_number = member_number,
        expires_at = NULL, -- Lifetime
        updated_at = NOW()
    WHERE user_id = claim_user_id;
    
    RETURN member_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Views for easier querying
-- ============================================

CREATE OR REPLACE VIEW public.active_subscriptions AS
SELECT 
    s.*,
    u.email,
    u.raw_user_meta_data->>'full_name' as user_name
FROM public.user_subscriptions s
JOIN auth.users u ON s.user_id = u.id
WHERE s.is_active = true
AND (s.expires_at IS NULL OR s.expires_at > NOW());

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE public.user_subscriptions IS 'Stores user subscription information for Breath of Now apps';
COMMENT ON COLUMN public.user_subscriptions.tier IS 'Subscription tier: free, starter, plus, pro, or founding';
COMMENT ON COLUMN public.user_subscriptions.is_founding_member IS 'Whether user has lifetime founding member access';
COMMENT ON COLUMN public.user_subscriptions.founding_member_number IS 'Founding member number (1-100)';
