-- ============================================
-- EXPENSEFLOW MIGRATION SCRIPT
-- Run this if you have existing tables
-- ============================================

-- Rename columns in expense_categories if they exist with old names
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'expense_categories' AND column_name = 'type'
    ) THEN
        ALTER TABLE expense_categories RENAME COLUMN type TO category_type;
    END IF;
END $$;

-- Rename columns in expense_transactions if they exist with old names
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'expense_transactions' AND column_name = 'type'
    ) THEN
        ALTER TABLE expense_transactions RENAME COLUMN type TO transaction_type;
    END IF;
END $$;

-- Drop and recreate functions with correct column names
DROP FUNCTION IF EXISTS get_monthly_expense_summary(UUID, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS get_category_breakdown(UUID, DATE, DATE, TEXT);

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
