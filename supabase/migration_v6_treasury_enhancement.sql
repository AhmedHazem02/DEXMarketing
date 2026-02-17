-- ============================================
-- Migration v6: Treasury Enhancement System
-- Created: 2026-02-15
-- Description: Complete treasury system with logs, packages, client accounts, and approval workflow
-- ============================================

-- ============================================
-- PART 1: NEW TABLES
-- ============================================

-- 1.1 Treasury Logs (سجل العمليات المالية)
-- Tracks all financial operations for audit trail
CREATE TABLE IF NOT EXISTS public.treasury_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'approve', 'reject')),
    performed_by UUID REFERENCES public.users(id) NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    client_name TEXT,
    amount DECIMAL(12,2),
    transaction_type TEXT CHECK (transaction_type IN ('income', 'expense')),
    category TEXT,
    description TEXT,
    changes JSONB,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for treasury_logs
CREATE INDEX IF NOT EXISTS idx_treasury_logs_created_at ON public.treasury_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_treasury_logs_client_id ON public.treasury_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_treasury_logs_performed_by ON public.treasury_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_treasury_logs_action ON public.treasury_logs(action);

COMMENT ON TABLE public.treasury_logs IS 'Audit trail for all treasury operations';
COMMENT ON COLUMN public.treasury_logs.action IS 'Type of operation: create, update, delete, approve, reject';
COMMENT ON COLUMN public.treasury_logs.changes IS 'JSON object storing old and new values for updates';

-- 1.2 Packages (الباقات)
-- Stores package definitions for client subscriptions
CREATE TABLE IF NOT EXISTS public.packages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    name_ar TEXT,
    price DECIMAL(12,2) NOT NULL CHECK (price >= 0),
    duration_days INTEGER NOT NULL CHECK (duration_days > 0),
    description TEXT,
    description_ar TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_packages_is_active ON public.packages(is_active);

COMMENT ON TABLE public.packages IS 'Package definitions for client subscriptions';
COMMENT ON COLUMN public.packages.duration_days IS 'Package duration in days';

-- 1.3 Client Accounts (حسابات العملاء)
-- Stores client package subscriptions and balances
-- NOTE: No UNIQUE constraint on client_id - clients can have multiple packages
CREATE TABLE IF NOT EXISTS public.client_accounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    package_id UUID REFERENCES public.packages(id) ON DELETE SET NULL,
    package_name TEXT,
    package_name_ar TEXT,
    package_price DECIMAL(12,2),
    package_description TEXT,
    package_description_ar TEXT,
    package_duration_days INTEGER,
    remaining_balance DECIMAL(12,2) DEFAULT 0,
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for client_accounts
CREATE INDEX IF NOT EXISTS idx_client_accounts_client_id ON public.client_accounts(client_id);
CREATE INDEX IF NOT EXISTS idx_client_accounts_is_active ON public.client_accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_client_accounts_end_date ON public.client_accounts(end_date);

COMMENT ON TABLE public.client_accounts IS 'Client package subscriptions - clients can have multiple active packages';
COMMENT ON COLUMN public.client_accounts.package_name IS 'Copy of package name at time of creation (immutable)';
COMMENT ON COLUMN public.client_accounts.remaining_balance IS 'Remaining balance from package price';

-- ============================================
-- PART 2: ALTER EXISTING TABLES
-- ============================================

-- 2.1 Add new columns to transactions table
DO $$ 
BEGIN
    -- sub_category: التصنيف الفرعي (printing, company, social, etc.)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'transactions' 
                   AND column_name = 'sub_category') THEN
        ALTER TABLE public.transactions ADD COLUMN sub_category TEXT;
    END IF;

    -- is_approved: هل وافق الأدمن
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'transactions' 
                   AND column_name = 'is_approved') THEN
        ALTER TABLE public.transactions ADD COLUMN is_approved BOOLEAN DEFAULT false;
    END IF;

    -- approved_by: من وافق على المعاملة
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'transactions' 
                   AND column_name = 'approved_by') THEN
        ALTER TABLE public.transactions ADD COLUMN approved_by UUID REFERENCES public.users(id);
    END IF;

    -- approved_at: وقت الموافقة
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'transactions' 
                   AND column_name = 'approved_at') THEN
        ALTER TABLE public.transactions ADD COLUMN approved_at TIMESTAMPTZ;
    END IF;

    -- visible_to_client: هل يظهر للعميل
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'transactions' 
                   AND column_name = 'visible_to_client') THEN
        ALTER TABLE public.transactions ADD COLUMN visible_to_client BOOLEAN DEFAULT false;
    END IF;

    -- client_account_id: ربط بحساب العميل
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'transactions' 
                   AND column_name = 'client_account_id') THEN
        ALTER TABLE public.transactions ADD COLUMN client_account_id UUID REFERENCES public.client_accounts(id) ON DELETE SET NULL;
    END IF;

    -- notes: ملاحظات إضافية
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'transactions' 
                   AND column_name = 'notes') THEN
        ALTER TABLE public.transactions ADD COLUMN notes TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'transactions' 
                   AND column_name = 'transaction_date') THEN
        ALTER TABLE public.transactions ADD COLUMN transaction_date DATE;
    END IF;
END $$;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_transactions_client_id ON public.transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_transactions_is_approved ON public.transactions(is_approved);
CREATE INDEX IF NOT EXISTS idx_transactions_visible_to_client ON public.transactions(visible_to_client);
CREATE INDEX IF NOT EXISTS idx_transactions_client_account_id ON public.transactions(client_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_sub_category ON public.transactions(sub_category);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_date ON public.transactions(transaction_date);

-- ============================================
-- PART 3: ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on new tables
ALTER TABLE public.treasury_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_accounts ENABLE ROW LEVEL SECURITY;

-- 3.1 Treasury Logs Policies
-- Only admin can view logs
DROP POLICY IF EXISTS "Only admin can view treasury logs" ON public.treasury_logs;
CREATE POLICY "Only admin can view treasury logs" ON public.treasury_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- Admin and accountant can insert logs
DROP POLICY IF EXISTS "Admin and accountant can insert logs" ON public.treasury_logs;
CREATE POLICY "Admin and accountant can insert logs" ON public.treasury_logs
    FOR INSERT WITH CHECK (public.is_accountant_or_admin());

-- 3.2 Packages Policies
-- Everyone can view active packages
DROP POLICY IF EXISTS "Anyone can view packages" ON public.packages;
CREATE POLICY "Anyone can view packages" ON public.packages
    FOR SELECT USING (is_active = true OR public.is_accountant_or_admin());

-- Only admin can manage packages
DROP POLICY IF EXISTS "Only admin can insert packages" ON public.packages;
CREATE POLICY "Only admin can insert packages" ON public.packages
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "Only admin can update packages" ON public.packages;
CREATE POLICY "Only admin can update packages" ON public.packages
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "Only admin can delete packages" ON public.packages;
CREATE POLICY "Only admin can delete packages" ON public.packages
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- 3.3 Client Accounts Policies
-- Admin, accountant, and client can view their accounts
DROP POLICY IF EXISTS "Users can view relevant client accounts" ON public.client_accounts;
CREATE POLICY "Users can view relevant client accounts" ON public.client_accounts
    FOR SELECT USING (
        public.is_accountant_or_admin()
        OR EXISTS (
            SELECT 1 FROM public.clients 
            WHERE clients.id = client_accounts.client_id 
            AND clients.user_id = auth.uid()
        )
    );

-- Admin and accountant can create client accounts
DROP POLICY IF EXISTS "Admin and accountant can create client accounts" ON public.client_accounts;
CREATE POLICY "Admin and accountant can create client accounts" ON public.client_accounts
    FOR INSERT WITH CHECK (public.is_accountant_or_admin());

-- Only admin can update client accounts
DROP POLICY IF EXISTS "Only admin can update client accounts" ON public.client_accounts;
CREATE POLICY "Only admin can update client accounts" ON public.client_accounts
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- Only admin can delete client accounts
DROP POLICY IF EXISTS "Only admin can delete client accounts" ON public.client_accounts;
CREATE POLICY "Only admin can delete client accounts" ON public.client_accounts
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- 3.4 Update Transactions Policies
-- Only admin can update transactions
DROP POLICY IF EXISTS "Only admin can update transactions" ON public.transactions;
CREATE POLICY "Only admin can update transactions" ON public.transactions
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- Only admin can delete transactions
DROP POLICY IF EXISTS "Only admin can delete transactions" ON public.transactions;
CREATE POLICY "Only admin can delete transactions" ON public.transactions
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- Update SELECT policy to include client access
DROP POLICY IF EXISTS "Only admin and accountant can view transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view relevant transactions" ON public.transactions;
CREATE POLICY "Users can view relevant transactions" ON public.transactions
    FOR SELECT USING (
        public.is_accountant_or_admin()
        OR (
            visible_to_client = true
            AND client_id IN (
                SELECT id FROM public.clients WHERE user_id = auth.uid()
            )
        )
    );

-- ============================================
-- PART 4: FUNCTIONS AND TRIGGERS
-- ============================================

-- 4.1 Function: Log all transaction changes
CREATE OR REPLACE FUNCTION public.log_transaction_changes()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    performer_id UUID;
    client_name_val TEXT;
BEGIN
    -- Get current user
    performer_id := auth.uid();
    
    -- Get client name if exists
    IF (TG_OP = 'DELETE' AND OLD.client_id IS NOT NULL) THEN
        SELECT name INTO client_name_val FROM public.clients WHERE id = OLD.client_id;
    ELSIF (TG_OP IN ('INSERT', 'UPDATE') AND NEW.client_id IS NOT NULL) THEN
        SELECT name INTO client_name_val FROM public.clients WHERE id = NEW.client_id;
    END IF;

    -- Handle different operations
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.treasury_logs (
            transaction_id, action, performed_by, client_id, client_name,
            amount, transaction_type, category, description
        ) VALUES (
            NEW.id, 'create', performer_id, NEW.client_id, client_name_val,
            NEW.amount, NEW.type::text, NEW.category, NEW.description
        );
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- Determine action type
        DECLARE
            log_action TEXT;
        BEGIN
            IF NEW.is_approved = true AND OLD.is_approved = false THEN
                log_action := 'approve';
            ELSE
                log_action := 'update';
            END IF;

            INSERT INTO public.treasury_logs (
                transaction_id, action, performed_by, client_id, client_name,
                amount, transaction_type, category, description, changes
            ) VALUES (
                NEW.id, 
                log_action,
                performer_id, 
                NEW.client_id, 
                client_name_val,
                NEW.amount, 
                NEW.type::text, 
                NEW.category, 
                NEW.description,
                jsonb_build_object(
                    'amount', jsonb_build_object('old', OLD.amount, 'new', NEW.amount),
                    'type', jsonb_build_object('old', OLD.type::text, 'new', NEW.type::text),
                    'category', jsonb_build_object('old', OLD.category, 'new', NEW.category),
                    'is_approved', jsonb_build_object('old', OLD.is_approved, 'new', NEW.is_approved),
                    'visible_to_client', jsonb_build_object('old', OLD.visible_to_client, 'new', NEW.visible_to_client)
                )
            );
        END;
        
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.treasury_logs (
            transaction_id, action, performed_by, client_id, client_name,
            amount, transaction_type, category, description
        ) VALUES (
            OLD.id, 'delete', performer_id, OLD.client_id, client_name_val,
            OLD.amount, OLD.type::text, OLD.category, OLD.description
        );
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$;

-- 4.2 Create trigger for transaction logging
DROP TRIGGER IF EXISTS on_transaction_change ON public.transactions;
CREATE TRIGGER on_transaction_change
    AFTER INSERT OR UPDATE OR DELETE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.log_transaction_changes();

-- 4.3 Function: Update client account balance on approval
CREATE OR REPLACE FUNCTION public.update_client_account_balance()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- When transaction is approved and linked to client account, update balance
    IF NEW.is_approved = true 
       AND (OLD.is_approved = false OR OLD.is_approved IS NULL)
       AND NEW.client_account_id IS NOT NULL THEN
        
        UPDATE public.client_accounts 
        SET remaining_balance = remaining_balance - NEW.amount,
            updated_at = timezone('utc'::text, now())
        WHERE id = NEW.client_account_id;
        
        -- Create notification for client
        IF NEW.client_id IS NOT NULL THEN
            DECLARE
                client_user_id UUID;
                transaction_desc TEXT;
            BEGIN
                SELECT user_id INTO client_user_id 
                FROM public.clients 
                WHERE id = NEW.client_id;
                
                IF client_user_id IS NOT NULL THEN
                    transaction_desc := COALESCE(NEW.description, 'معاملة مالية');
                    
                    INSERT INTO public.notifications (
                        user_id, 
                        title, 
                        message,
                        link,
                        is_read
                    ) VALUES (
                        client_user_id,
                        CASE WHEN NEW.type = 'expense' THEN 'مصروف جديد' ELSE 'إيراد جديد' END,
                        'تم اعتماد معاملة: ' || transaction_desc || ' - المبلغ: ' || NEW.amount::text || ' ج.م',
                        '/client/account',
                        false
                    );
                END IF;
            END;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- 4.4 Create trigger for balance update
DROP TRIGGER IF EXISTS on_transaction_approved ON public.transactions;
CREATE TRIGGER on_transaction_approved
    AFTER UPDATE ON public.transactions
    FOR EACH ROW 
    WHEN (NEW.is_approved = true)
    EXECUTE FUNCTION public.update_client_account_balance();

-- 4.5 Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

-- 4.6 Create triggers for updated_at
DROP TRIGGER IF EXISTS update_packages_updated_at ON public.packages;
CREATE TRIGGER update_packages_updated_at
    BEFORE UPDATE ON public.packages
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_client_accounts_updated_at ON public.client_accounts;
CREATE TRIGGER update_client_accounts_updated_at
    BEFORE UPDATE ON public.client_accounts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- PART 5: SEED DATA (Optional - Default Packages)
-- ============================================

-- Insert default packages (can be customized)
INSERT INTO public.packages (name, name_ar, price, duration_days, description, description_ar, is_active)
VALUES 
    ('Gold Package', 'الباقة الذهبية', 10000, 90, 'Premium package with full features', 'باقة متميزة بجميع المميزات', true),
    ('Silver Package', 'الباقة الفضية', 5000, 30, 'Standard package with essential features', 'باقة قياسية بالمميزات الأساسية', true),
    ('Bronze Package', 'الباقة البرونزية', 2500, 15, 'Basic package for starting', 'باقة أساسية للبداية', true)
ON CONFLICT DO NOTHING;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

COMMENT ON SCHEMA public IS 'Treasury Enhancement Migration v6 - Complete';
