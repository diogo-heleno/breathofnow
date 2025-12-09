-- ============================================
-- EXPENSEFLOW SUPABASE SCHEMA
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- EXPENSE CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    name_key TEXT, -- i18n key for default categories
    icon TEXT NOT NULL DEFAULT 'circle',
    color TEXT NOT NULL DEFAULT '#6b7280',
    category_type TEXT NOT NULL CHECK (category_type IN ('income', 'expense', 'both')),
    is_default BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Index for faster queries
CREATE INDEX idx_expense_categories_user_id ON expense_categories(user_id);
CREATE INDEX idx_expense_categories_type ON expense_categories(category_type);

-- RLS Policies
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own categories"
    ON expense_categories FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories"
    ON expense_categories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
    ON expense_categories FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
    ON expense_categories FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- EXPENSE TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS expense_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'EUR',
    amount_in_base DECIMAL(15, 2),
    exchange_rate DECIMAL(15, 6),
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense')),
    description TEXT,
    notes TEXT,
    category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    sync_status TEXT NOT NULL DEFAULT 'synced' CHECK (sync_status IN ('pending', 'synced', 'conflict')),
    import_batch_id UUID,
    is_reviewed BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Indexes for faster queries
CREATE INDEX idx_expense_transactions_user_id ON expense_transactions(user_id);
CREATE INDEX idx_expense_transactions_date ON expense_transactions(date);
CREATE INDEX idx_expense_transactions_category_id ON expense_transactions(category_id);
CREATE INDEX idx_expense_transactions_type ON expense_transactions(transaction_type);
CREATE INDEX idx_expense_transactions_user_date ON expense_transactions(user_id, date);

-- RLS Policies
ALTER TABLE expense_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
    ON expense_transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
    ON expense_transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
    ON expense_transactions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
    ON expense_transactions FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- EXPENSE BUDGETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS expense_budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES expense_categories(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    period TEXT NOT NULL CHECK (period IN ('monthly', 'yearly')),
    start_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_expense_budgets_user_id ON expense_budgets(user_id);
CREATE INDEX idx_expense_budgets_category_id ON expense_budgets(category_id);

-- RLS Policies
ALTER TABLE expense_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own budgets"
    ON expense_budgets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budgets"
    ON expense_budgets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets"
    ON expense_budgets FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets"
    ON expense_budgets FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- EXCHANGE RATES CACHE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS exchange_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_currency TEXT NOT NULL,
    to_currency TEXT NOT NULL,
    rate DECIMAL(15, 6) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(from_currency, to_currency, date)
);

-- Index for faster lookups
CREATE INDEX idx_exchange_rates_currencies ON exchange_rates(from_currency, to_currency, date);

-- RLS - Exchange rates are public (read-only for all authenticated users)
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view exchange rates"
    ON exchange_rates FOR SELECT
    TO authenticated
    USING (true);

-- Only service role can insert/update exchange rates
CREATE POLICY "Service role can manage exchange rates"
    ON exchange_rates FOR ALL
    TO service_role
    USING (true);

-- ============================================
-- IMPORT MAPPINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS import_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    mapping_json JSONB NOT NULL,
    delimiter TEXT NOT NULL DEFAULT ',',
    date_format TEXT NOT NULL DEFAULT 'YYYY-MM-DD',
    decimal_separator TEXT NOT NULL DEFAULT '.' CHECK (decimal_separator IN (',', '.')),
    has_header BOOLEAN NOT NULL DEFAULT true,
    negative_is_expense BOOLEAN NOT NULL DEFAULT true,
    use_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_import_mappings_user_id ON import_mappings(user_id);

-- RLS Policies
ALTER TABLE import_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own import mappings"
    ON import_mappings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own import mappings"
    ON import_mappings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own import mappings"
    ON import_mappings FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own import mappings"
    ON import_mappings FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- EXPENSE SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS expense_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, key)
);

-- Index
CREATE INDEX idx_expense_settings_user_id ON expense_settings(user_id);

-- RLS Policies
ALTER TABLE expense_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings"
    ON expense_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
    ON expense_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
    ON expense_settings FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings"
    ON expense_settings FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
CREATE TRIGGER update_expense_categories_updated_at
    BEFORE UPDATE ON expense_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expense_transactions_updated_at
    BEFORE UPDATE ON expense_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expense_budgets_updated_at
    BEFORE UPDATE ON expense_budgets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_import_mappings_updated_at
    BEFORE UPDATE ON import_mappings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expense_settings_updated_at
    BEFORE UPDATE ON expense_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION: Get Monthly Summary
-- ============================================
CREATE OR REPLACE FUNCTION get_monthly_expense_summary(
    p_user_id UUID,
    p_year INTEGER,
    p_month INTEGER
)
RETURNS TABLE (
    total_expenses DECIMAL,
    total_income DECIMAL,
    balance DECIMAL,
    transaction_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(CASE WHEN et.transaction_type = 'expense' THEN et.amount ELSE 0 END), 0) as total_expenses,
        COALESCE(SUM(CASE WHEN et.transaction_type = 'income' THEN et.amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN et.transaction_type = 'income' THEN et.amount ELSE -et.amount END), 0) as balance,
        COUNT(*) as transaction_count
    FROM expense_transactions et
    WHERE et.user_id = p_user_id
      AND EXTRACT(YEAR FROM et.date) = p_year
      AND EXTRACT(MONTH FROM et.date) = p_month
      AND et.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Get Category Breakdown
-- ============================================
CREATE OR REPLACE FUNCTION get_category_breakdown(
    p_user_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_type TEXT DEFAULT 'expense'
)
RETURNS TABLE (
    category_id UUID,
    category_name TEXT,
    category_color TEXT,
    total_amount DECIMAL,
    transaction_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ec.id as category_id,
        ec.name as category_name,
        ec.color as category_color,
        COALESCE(SUM(et.amount), 0) as total_amount,
        COUNT(et.id) as transaction_count
    FROM expense_categories ec
    LEFT JOIN expense_transactions et ON et.category_id = ec.id
        AND et.date BETWEEN p_start_date AND p_end_date
        AND et.transaction_type = p_type
        AND et.deleted_at IS NULL
    WHERE ec.user_id = p_user_id
      AND ec.deleted_at IS NULL
      AND (ec.category_type = p_type OR ec.category_type = 'both')
    GROUP BY ec.id, ec.name, ec.color
    ORDER BY total_amount DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
