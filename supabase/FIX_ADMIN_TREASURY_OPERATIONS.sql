-- Fix: Ensure Admin can UPDATE and DELETE transactions
-- Issue: Admin cannot edit or delete treasury transactions
-- This ensures the necessary RLS policies exist for admin operations

-- ============================================
-- 1. DROP existing policies to avoid conflicts
-- ============================================
DROP POLICY IF EXISTS "Only admin can update transactions" ON public.transactions;
DROP POLICY IF EXISTS "Only admin can delete transactions" ON public.transactions;

-- ============================================
-- 2. CREATE UPDATE policy for admin
-- ============================================
CREATE POLICY "Only admin can update transactions" ON public.transactions
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- ============================================
-- 3. CREATE DELETE policy for admin
-- ============================================
CREATE POLICY "Only admin can delete transactions" ON public.transactions
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- ============================================
-- 4. Verify RLS is enabled on the table
-- ============================================
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. Fix log_transaction_changes() — FK violation on DELETE
-- Problem: AFTER DELETE trigger inserts OLD.id into treasury_logs.transaction_id,
--          but the row is already gone, so the FK constraint fails.
-- Fix: Use NULL for transaction_id on DELETE operations.
-- ============================================
CREATE OR REPLACE FUNCTION public.log_transaction_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    performer_id     UUID;
    client_name_val  TEXT;
    log_action       TEXT;
BEGIN
    -- Use auth.uid() first; fall back to the row's created_by for server-side calls
    performer_id := COALESCE(
        auth.uid(),
        CASE WHEN TG_OP = 'DELETE' THEN OLD.created_by ELSE NEW.created_by END
    );

    -- If still NULL, skip logging (no user context at all)
    IF performer_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    -- Resolve client name
    IF TG_OP = 'DELETE' AND OLD.client_id IS NOT NULL THEN
        SELECT name INTO client_name_val FROM public.clients WHERE id = OLD.client_id;
    ELSIF TG_OP IN ('INSERT', 'UPDATE') AND NEW.client_id IS NOT NULL THEN
        SELECT name INTO client_name_val FROM public.clients WHERE id = NEW.client_id;
    END IF;

    -- ── INSERT ──────────────────────────────────────────────
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.treasury_logs (
            transaction_id, action, performed_by, client_id, client_name,
            amount, transaction_type, category, description
        ) VALUES (
            NEW.id, 'create', performer_id, NEW.client_id, client_name_val,
            NEW.amount, NEW.type::text, NEW.category, NEW.description
        );

    -- ── UPDATE ──────────────────────────────────────────────
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.is_approved = true AND (OLD.is_approved = false OR OLD.is_approved IS NULL) THEN
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
                'amount',            jsonb_build_object('old', OLD.amount,            'new', NEW.amount),
                'type',              jsonb_build_object('old', OLD.type::text,         'new', NEW.type::text),
                'category',          jsonb_build_object('old', OLD.category,           'new', NEW.category),
                'is_approved',       jsonb_build_object('old', OLD.is_approved,        'new', NEW.is_approved),
                'visible_to_client', jsonb_build_object('old', OLD.visible_to_client,  'new', NEW.visible_to_client)
            )
        );

    -- ── DELETE ──────────────────────────────────────────────
    -- Use NULL for transaction_id because the row is already deleted
    -- and the FK constraint would reject OLD.id
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.treasury_logs (
            transaction_id, action, performed_by, client_id, client_name,
            amount, transaction_type, category, description, changes
        ) VALUES (
            NULL, 'delete', performer_id, OLD.client_id, client_name_val,
            OLD.amount, OLD.type::text, OLD.category, OLD.description,
            jsonb_build_object(
                'deleted_transaction_id', OLD.id::text,
                'amount', OLD.amount,
                'type', OLD.type::text,
                'category', OLD.category,
                'description', OLD.description
            )
        );
        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$$;

-- ============================================
-- 6. Ensure treasury balance trigger handles UPDATE and DELETE
-- ============================================
-- Drop existing triggers to avoid duplicates
DROP TRIGGER IF EXISTS on_transaction_insert ON public.transactions;
DROP TRIGGER IF EXISTS on_transaction_created ON public.transactions;
DROP TRIGGER IF EXISTS on_transaction_change ON public.transactions;
DROP TRIGGER IF EXISTS on_transaction_log ON public.transactions;
DROP TRIGGER IF EXISTS on_transaction_balance ON public.transactions;

-- Recreate balance function
CREATE OR REPLACE FUNCTION public.update_treasury_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  treasury_id uuid;
BEGIN
  SELECT id INTO treasury_id FROM public.treasury LIMIT 1;

  IF treasury_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- On DELETE: reverse the old transaction
  IF TG_OP = 'DELETE' THEN
    IF OLD.type = 'income' THEN
      UPDATE public.treasury
      SET current_balance = current_balance - OLD.amount, updated_at = now()
      WHERE id = treasury_id;
    ELSE
      UPDATE public.treasury
      SET current_balance = current_balance + OLD.amount, updated_at = now()
      WHERE id = treasury_id;
    END IF;
    RETURN OLD;
  END IF;

  -- On UPDATE: reverse old amount, apply new amount
  IF TG_OP = 'UPDATE' THEN
    -- Reverse old
    IF OLD.type = 'income' THEN
      UPDATE public.treasury
      SET current_balance = current_balance - OLD.amount, updated_at = now()
      WHERE id = treasury_id;
    ELSE
      UPDATE public.treasury
      SET current_balance = current_balance + OLD.amount, updated_at = now()
      WHERE id = treasury_id;
    END IF;
    -- Apply new
    IF NEW.type = 'income' THEN
      UPDATE public.treasury
      SET current_balance = current_balance + NEW.amount, updated_at = now()
      WHERE id = treasury_id;
    ELSE
      UPDATE public.treasury
      SET current_balance = current_balance - NEW.amount, updated_at = now()
      WHERE id = treasury_id;
    END IF;
    RETURN NEW;
  END IF;

  -- On INSERT: apply new amount
  IF NEW.type = 'income' THEN
    UPDATE public.treasury
    SET current_balance = current_balance + NEW.amount, updated_at = now()
    WHERE id = treasury_id;
  ELSE
    UPDATE public.treasury
    SET current_balance = current_balance - NEW.amount, updated_at = now()
    WHERE id = treasury_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate BOTH triggers on transactions table
-- PostgreSQL fires AFTER triggers in alphabetical order.
-- "on_transaction_balance" fires BEFORE "on_transaction_log"
-- so balance is updated first, then the log is recorded.
-- 1. Balance trigger (fires first alphabetically)
CREATE TRIGGER on_transaction_balance
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_treasury_balance();

-- 2. Logging trigger (fires second alphabetically)
CREATE TRIGGER on_transaction_log
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.log_transaction_changes();
