-- ============================================================
-- FIX: Approve Transaction 400 Bad Request
-- Issue: PATCH /transactions returns 400 when approving
-- Causes:
--   1. Missing columns (is_approved, approved_by, approved_at,
--      visible_to_client, transaction_date) — added by migration_v6
--      but may not have been applied
--   2. Missing UPDATE RLS policy for admin on transactions table
-- ============================================================

-- ============================================================
-- PART 1: Add missing columns to transactions table
-- (safe — checks existence before adding)
-- ============================================================

DO $$
BEGIN
    -- is_approved
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'transactions'
          AND column_name  = 'is_approved'
    ) THEN
        ALTER TABLE public.transactions
            ADD COLUMN is_approved BOOLEAN DEFAULT false;
    END IF;

    -- approved_by
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'transactions'
          AND column_name  = 'approved_by'
    ) THEN
        ALTER TABLE public.transactions
            ADD COLUMN approved_by UUID REFERENCES public.users(id);
    END IF;

    -- approved_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'transactions'
          AND column_name  = 'approved_at'
    ) THEN
        ALTER TABLE public.transactions
            ADD COLUMN approved_at TIMESTAMPTZ;
    END IF;

    -- visible_to_client
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'transactions'
          AND column_name  = 'visible_to_client'
    ) THEN
        ALTER TABLE public.transactions
            ADD COLUMN visible_to_client BOOLEAN DEFAULT false;
    END IF;

    -- transaction_date
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'transactions'
          AND column_name  = 'transaction_date'
    ) THEN
        ALTER TABLE public.transactions
            ADD COLUMN transaction_date DATE;
    END IF;

    -- sub_category
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'transactions'
          AND column_name  = 'sub_category'
    ) THEN
        ALTER TABLE public.transactions
            ADD COLUMN sub_category TEXT;
    END IF;

    -- notes
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'transactions'
          AND column_name  = 'notes'
    ) THEN
        ALTER TABLE public.transactions
            ADD COLUMN notes TEXT;
    END IF;
END $$;

-- ============================================================
-- PART 2: Ensure RLS is enabled
-- ============================================================

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PART 3: UPDATE policy for admin
-- (drop first to avoid conflicts, then recreate)
-- ============================================================

DROP POLICY IF EXISTS "Only admin can update transactions" ON public.transactions;

CREATE POLICY "Only admin can update transactions"
    ON public.transactions
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================
-- PART 4: DELETE policy for admin (ensure it exists too)
-- ============================================================

DROP POLICY IF EXISTS "Only admin can delete transactions" ON public.transactions;

CREATE POLICY "Only admin can delete transactions"
    ON public.transactions
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================
-- PART 5: Indexes for new columns (fast lookups)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_transactions_is_approved
    ON public.transactions(is_approved);

CREATE INDEX IF NOT EXISTS idx_transactions_visible_to_client
    ON public.transactions(visible_to_client);

CREATE INDEX IF NOT EXISTS idx_transactions_transaction_date
    ON public.transactions(transaction_date);

-- ============================================================
-- Verification query — run this after applying to confirm
-- ============================================================
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name   = 'transactions'
-- ORDER BY ordinal_position;
