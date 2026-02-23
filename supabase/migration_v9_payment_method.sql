-- ============================================
-- Migration V9: Add payment_method to transactions
-- طريقة الدفع: نقد / تحويل بنكي / شيك
-- ============================================

-- Add payment_method column to transactions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'transactions' 
          AND column_name = 'payment_method'
    ) THEN
        ALTER TABLE public.transactions 
        ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'cash'
        CHECK (payment_method IN ('cash', 'transfer', 'check'));
    END IF;
END $$;

-- Create index for filtering by payment method
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method ON public.transactions(payment_method);

-- Add comment
COMMENT ON COLUMN public.transactions.payment_method IS 'Payment method: cash (نقد), transfer (تحويل بنكي), check (شيك)';
