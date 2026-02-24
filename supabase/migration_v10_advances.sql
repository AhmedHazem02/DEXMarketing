-- ============================================
-- Migration V10: Advances (السلف) System
-- ============================================
-- This migration creates the advances table for tracking employee/owner advances.
-- Advances are linked to the treasury via the transactions table.
-- When an advance is created, an expense transaction is auto-created, 
-- which triggers the existing update_treasury_balance() to deduct from treasury.

-- Create advance_recipient_type enum
DO $$ BEGIN
    CREATE TYPE advance_recipient_type AS ENUM ('employee', 'owner');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create advances table
CREATE TABLE IF NOT EXISTS public.advances (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    recipient_type advance_recipient_type NOT NULL DEFAULT 'employee',
    recipient_name TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    notes TEXT,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for date filtering
CREATE INDEX IF NOT EXISTS idx_advances_created_at ON public.advances(created_at DESC);

-- Create index for recipient type filtering
CREATE INDEX IF NOT EXISTS idx_advances_recipient_type ON public.advances(recipient_type);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE public.advances ENABLE ROW LEVEL SECURITY;

-- Admin can view all advances
CREATE POLICY "Admin can view all advances"
    ON public.advances FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Admin can insert advances
CREATE POLICY "Admin can insert advances"
    ON public.advances FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Admin can delete advances
CREATE POLICY "Admin can delete advances"
    ON public.advances FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Admin can update advances
CREATE POLICY "Admin can update advances"
    ON public.advances FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );
