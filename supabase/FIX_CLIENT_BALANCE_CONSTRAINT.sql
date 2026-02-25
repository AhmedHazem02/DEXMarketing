-- ============================================================
-- FIX: client_accounts_remaining_balance_check violation
-- Error: 23514 — new row violates check constraint
--        "client_accounts_remaining_balance_check"
-- Root cause:
--   The remaining_balance column has CHECK (remaining_balance >= 0)
--   which blocks legitimate deductions that take the balance negative
--   (i.e. client owes more than their package price / deposit).
--
-- Fix:
--   1. Drop the >= 0 check so balances can go negative (debt tracking)
--   2. Remove trigger double-deduction: drop the old approval-only
--      trigger (migration_v6) which runs on top of the newer
--      INSERT/UPDATE/DELETE trigger (FIX_CLIENT_BALANCE_UPDATE)
-- ============================================================

-- ============================================================
-- PART 1: Drop the non-negative balance constraint
-- ============================================================

ALTER TABLE public.client_accounts
    DROP CONSTRAINT IF EXISTS client_accounts_remaining_balance_check;

-- Optionally re-add without the lower bound (just type safety):
-- ALTER TABLE public.client_accounts
--     ADD CONSTRAINT client_accounts_remaining_balance_check
--     CHECK (remaining_balance IS NOT NULL);

-- ============================================================
-- PART 2: Remove trigger double-deduction
--
-- migration_v6 created  → on_transaction_approved
--   fires AFTER UPDATE  WHEN (NEW.is_approved = true)
--   deducts NEW.amount from remaining_balance
--
-- FIX_CLIENT_BALANCE_UPDATE created → on_transaction_balance_change
--   fires AFTER INSERT OR UPDATE OR DELETE
--   deducts on INSERT (creation), reverts on DELETE,
--   adjusts only when amount/type/account changes on UPDATE
--
-- If BOTH triggers are active at the same time:
--   - Insert transaction (linked to account): balance deducted once ✓
--   - Approve transaction: on_transaction_approved fires again
--     and deducts AGAIN → double deduction ✗
--
-- Solution: Drop the old approval-only trigger.
-- The newer unified trigger handles inserts correctly already.
-- ============================================================

DROP TRIGGER IF EXISTS on_transaction_approved ON public.transactions;

-- ============================================================
-- PART 3: Fix the unified balance trigger to also correctly
-- handle the case where is_approved transitions to true AND
-- the transaction was inserted WITHOUT a client_account_id
-- (i.e., account was linked only at approval time).
--
-- The current FIX_CLIENT_BALANCE_UPDATE logic misses:
--   UPDATE where OLD.client_account_id IS NULL
--            and NEW.client_account_id IS NOT NULL
-- because it uses != comparison which is NULL-unsafe.
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_client_account_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    balance_change     DECIMAL(12,2);
    old_balance_change DECIMAL(12,2);
BEGIN
    -- ── INSERT ───────────────────────────────────────────────
    IF TG_OP = 'INSERT' THEN
        IF NEW.client_account_id IS NOT NULL THEN
            -- Income adds to balance; expense subtracts
            balance_change := CASE WHEN NEW.type = 'income'
                                   THEN NEW.amount
                                   ELSE -NEW.amount END;

            UPDATE public.client_accounts
               SET remaining_balance = remaining_balance + balance_change,
                   updated_at        = timezone('utc', now())
             WHERE id = NEW.client_account_id;
        END IF;
        RETURN NEW;
    END IF;

    -- ── UPDATE ───────────────────────────────────────────────
    IF TG_OP = 'UPDATE' THEN
        -- Case 1: client_account_id assigned for the first time
        IF OLD.client_account_id IS NULL AND NEW.client_account_id IS NOT NULL THEN
            balance_change := CASE WHEN NEW.type = 'income'
                                   THEN NEW.amount
                                   ELSE -NEW.amount END;

            UPDATE public.client_accounts
               SET remaining_balance = remaining_balance + balance_change,
                   updated_at        = timezone('utc', now())
             WHERE id = NEW.client_account_id;

        -- Case 2: client_account_id removed
        ELSIF OLD.client_account_id IS NOT NULL AND NEW.client_account_id IS NULL THEN
            old_balance_change := CASE WHEN OLD.type = 'income'
                                       THEN -OLD.amount
                                       ELSE OLD.amount END;

            UPDATE public.client_accounts
               SET remaining_balance = remaining_balance + old_balance_change,
                   updated_at        = timezone('utc', now())
             WHERE id = OLD.client_account_id;

        -- Case 3: account changed from one to another
        ELSIF OLD.client_account_id IS NOT NULL
          AND NEW.client_account_id IS NOT NULL
          AND OLD.client_account_id <> NEW.client_account_id THEN

            old_balance_change := CASE WHEN OLD.type = 'income'
                                       THEN -OLD.amount
                                       ELSE OLD.amount END;
            balance_change     := CASE WHEN NEW.type = 'income'
                                       THEN NEW.amount
                                       ELSE -NEW.amount END;

            UPDATE public.client_accounts
               SET remaining_balance = remaining_balance + old_balance_change,
                   updated_at        = timezone('utc', now())
             WHERE id = OLD.client_account_id;

            UPDATE public.client_accounts
               SET remaining_balance = remaining_balance + balance_change,
                   updated_at        = timezone('utc', now())
             WHERE id = NEW.client_account_id;

        -- Case 4: same account, but amount or type changed
        ELSIF NEW.client_account_id IS NOT NULL
          AND NEW.client_account_id = OLD.client_account_id
          AND (NEW.amount <> OLD.amount OR NEW.type <> OLD.type) THEN

            old_balance_change := CASE WHEN OLD.type = 'income'
                                       THEN -OLD.amount
                                       ELSE OLD.amount END;
            balance_change     := CASE WHEN NEW.type = 'income'
                                       THEN NEW.amount
                                       ELSE -NEW.amount END;

            UPDATE public.client_accounts
               SET remaining_balance = remaining_balance + old_balance_change + balance_change,
                   updated_at        = timezone('utc', now())
             WHERE id = NEW.client_account_id;
        END IF;

        RETURN NEW;
    END IF;

    -- ── DELETE ───────────────────────────────────────────────
    IF TG_OP = 'DELETE' THEN
        IF OLD.client_account_id IS NOT NULL THEN
            old_balance_change := CASE WHEN OLD.type = 'income'
                                       THEN -OLD.amount
                                       ELSE OLD.amount END;

            UPDATE public.client_accounts
               SET remaining_balance = remaining_balance + old_balance_change,
                   updated_at        = timezone('utc', now())
             WHERE id = OLD.client_account_id;
        END IF;
        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$$;

-- Re-attach the unified trigger (idempotent)
DROP TRIGGER IF EXISTS on_transaction_balance_change ON public.transactions;

CREATE TRIGGER on_transaction_balance_change
    AFTER INSERT OR UPDATE OR DELETE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_client_account_balance();

-- ============================================================
-- Verification queries
-- ============================================================
-- Check constraint is gone:
-- SELECT conname FROM pg_constraint
-- WHERE conrelid = 'public.client_accounts'::regclass
--   AND conname = 'client_accounts_remaining_balance_check';

-- Check triggers on transactions:
-- SELECT trigger_name, event_manipulation, action_timing
-- FROM information_schema.triggers
-- WHERE event_object_table = 'transactions'
--   AND trigger_schema = 'public'
-- ORDER BY trigger_name;
