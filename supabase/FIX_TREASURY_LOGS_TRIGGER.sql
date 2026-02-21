-- ============================================
-- FIX: Treasury Logs Trigger
-- Problem: FIX_TREASURY_TRIGGER_V2.sql dropped and replaced `on_transaction_change`
--          with update_treasury_balance(), killing the log_transaction_changes() trigger.
--          Also: auth.uid() returns NULL on server-side (service role) calls,
--          causing performed_by NOT NULL constraint to fail silently.
-- Solution:
--   1. Recreate log_transaction_changes() with fallback performer_id
--   2. Create a SEPARATE trigger `on_transaction_log` for logging
--      (so balance trigger stays untouched)
-- ============================================

-- Step 1: Fix log_transaction_changes() to handle NULL auth.uid()
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
                'amount',          jsonb_build_object('old', OLD.amount,          'new', NEW.amount),
                'type',            jsonb_build_object('old', OLD.type::text,       'new', NEW.type::text),
                'category',        jsonb_build_object('old', OLD.category,         'new', NEW.category),
                'is_approved',     jsonb_build_object('old', OLD.is_approved,      'new', NEW.is_approved),
                'visible_to_client', jsonb_build_object('old', OLD.visible_to_client, 'new', NEW.visible_to_client)
            )
        );

    -- ── DELETE ──────────────────────────────────────────────
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

-- Step 2: Drop old combined trigger (if it still exists under old name)
DROP TRIGGER IF EXISTS on_transaction_log ON public.transactions;

-- Step 3: Create a dedicated LOGGING trigger (separate from the balance trigger)
CREATE TRIGGER on_transaction_log
    AFTER INSERT OR UPDATE OR DELETE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.log_transaction_changes();

-- Step 4: Grant INSERT on treasury_logs to the service role (if not already)
-- (needed when the trigger runs under SECURITY DEFINER via service key)
GRANT INSERT ON public.treasury_logs TO service_role;
GRANT SELECT ON public.clients TO service_role;

-- Step 5: Make sure RLS on treasury_logs allows the trigger to insert
-- The trigger runs as SECURITY DEFINER (superuser), so RLS is bypassed — no extra policy needed.

-- Verify both triggers now exist on transactions:
-- on_transaction_change  → update_treasury_balance()   (balance updates)
-- on_transaction_log     → log_transaction_changes()   (audit trail)
