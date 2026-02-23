-- ============================================
-- FIX: treasury_logs FK violation on DELETE
-- Problem: AFTER DELETE trigger tries to INSERT into treasury_logs
--          with transaction_id = OLD.id, but the transaction is already
--          deleted, so the FK check fails with PGRST23503.
-- Solution: Set transaction_id = NULL for DELETE log entries.
--           The audit data (amount, type, category) is still preserved.
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
                'amount',            jsonb_build_object('old', OLD.amount,              'new', NEW.amount),
                'type',              jsonb_build_object('old', OLD.type::text,           'new', NEW.type::text),
                'category',          jsonb_build_object('old', OLD.category,             'new', NEW.category),
                'is_approved',       jsonb_build_object('old', OLD.is_approved,          'new', NEW.is_approved),
                'visible_to_client', jsonb_build_object('old', OLD.visible_to_client,    'new', NEW.visible_to_client)
            )
        );

    -- ── DELETE ──────────────────────────────────────────────
    -- NOTE: transaction_id is set to NULL here because the transaction row
    -- is already deleted (AFTER trigger), so the FK would fail otherwise.
    -- All other audit data (amount, type, category etc.) is still captured.
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.treasury_logs (
            transaction_id, action, performed_by, client_id, client_name,
            amount, transaction_type, category, description
        ) VALUES (
            NULL, 'delete', performer_id, OLD.client_id, client_name_val,
            OLD.amount, OLD.type::text, OLD.category, OLD.description
        );
        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$$;
