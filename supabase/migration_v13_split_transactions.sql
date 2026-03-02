-- ============================================
-- Migration V13: Split Client vs Treasury Transactions
-- Created: 2026-03-02
-- Description: Add affects_treasury column to transactions table
--   - affects_treasury = true  → Treasury transaction (affects treasury balance only, NOT visible to client)
--   - affects_treasury = false → Client transaction (affects client account balance only, visible to client)
-- ============================================

-- 1. Add the new column (default true keeps all existing transactions working as before)
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS affects_treasury BOOLEAN NOT NULL DEFAULT true;

-- 2. Drop ALL existing triggers on transactions to avoid duplicates
--    (various fix files created triggers with different names over time)
DROP TRIGGER IF EXISTS on_transaction_insert ON public.transactions;
DROP TRIGGER IF EXISTS on_transaction_created ON public.transactions;
DROP TRIGGER IF EXISTS on_transaction_change ON public.transactions;
DROP TRIGGER IF EXISTS on_transaction_balance ON public.transactions;
DROP TRIGGER IF EXISTS on_transaction_balance_change ON public.transactions;
DROP TRIGGER IF EXISTS on_transaction_approved ON public.transactions;
DROP TRIGGER IF EXISTS on_transaction_log ON public.transactions;
DROP TRIGGER IF EXISTS on_transaction_notify ON public.transactions;

-- 3. Update treasury balance trigger — skip if affects_treasury = false
CREATE OR REPLACE FUNCTION public.update_treasury_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  treasury_id uuid;
BEGIN
  -- Skip client-only transactions (they don't affect treasury)
  IF COALESCE((CASE WHEN TG_OP = 'DELETE' THEN OLD.affects_treasury ELSE NEW.affects_treasury END), true) = false THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

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

-- 3. Update client account balance trigger — skip if affects_treasury = true
CREATE OR REPLACE FUNCTION public.update_client_account_balance()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    balance_change DECIMAL(12,2);
    old_balance_change DECIMAL(12,2);
BEGIN
    -- Skip treasury-only transactions (they don't affect client account balance)
    IF COALESCE((CASE WHEN TG_OP = 'DELETE' THEN OLD.affects_treasury ELSE NEW.affects_treasury END), true) = true THEN
      RETURN COALESCE(NEW, OLD);
    END IF;

    -- Handle DELETE first (NEW is NULL for DELETE operations)
    IF TG_OP = 'DELETE' THEN
        IF OLD.client_account_id IS NOT NULL THEN
            -- Revert the balance change
            IF OLD.type = 'income' THEN
                old_balance_change := -OLD.amount;
            ELSE
                old_balance_change := OLD.amount;
            END IF;
            
            UPDATE public.client_accounts 
            SET remaining_balance = remaining_balance + old_balance_change,
                updated_at = timezone('utc'::text, now())
            WHERE id = OLD.client_account_id;
        END IF;
        RETURN OLD;
    END IF;

    -- Calculate the balance change based on transaction type
    -- Income: adds to balance (positive)
    -- Expense: subtracts from balance (negative)
    IF NEW.type = 'income' THEN
        balance_change := NEW.amount;
    ELSE  -- type = 'expense'
        balance_change := -NEW.amount;
    END IF;

    -- Handle INSERT: Add transaction to balance
    IF TG_OP = 'INSERT' THEN
        IF NEW.client_account_id IS NOT NULL THEN
            UPDATE public.client_accounts 
            SET remaining_balance = remaining_balance + balance_change,
                updated_at = timezone('utc'::text, now())
            WHERE id = NEW.client_account_id;
        END IF;
        RETURN NEW;
    END IF;

    -- Handle UPDATE: Adjust balance for the change
    IF TG_OP = 'UPDATE' THEN
        -- Only update balance if amount or type changed
        IF NEW.client_account_id IS NOT NULL OR OLD.client_account_id IS NOT NULL THEN
            -- If account changed, we need to adjust both old and new accounts
            IF NEW.client_account_id != OLD.client_account_id THEN
                -- Revert from old account
                IF OLD.client_account_id IS NOT NULL THEN
                    IF OLD.type = 'income' THEN
                        old_balance_change := -OLD.amount;
                    ELSE
                        old_balance_change := OLD.amount;
                    END IF;
                    
                    UPDATE public.client_accounts 
                    SET remaining_balance = remaining_balance + old_balance_change,
                        updated_at = timezone('utc'::text, now())
                    WHERE id = OLD.client_account_id;
                END IF;
                
                -- Add to new account
                UPDATE public.client_accounts 
                SET remaining_balance = remaining_balance + balance_change,
                    updated_at = timezone('utc'::text, now())
                WHERE id = NEW.client_account_id;
            ELSE
                -- Same account, adjust if amount or type changed
                IF NEW.amount != OLD.amount OR NEW.type != OLD.type THEN
                    -- Calculate old balance change
                    IF OLD.type = 'income' THEN
                        old_balance_change := -OLD.amount;
                    ELSE
                        old_balance_change := OLD.amount;
                    END IF;
                    
                    -- Apply the net change
                    UPDATE public.client_accounts 
                    SET remaining_balance = remaining_balance + old_balance_change + balance_change,
                        updated_at = timezone('utc'::text, now())
                    WHERE id = NEW.client_account_id;
                END IF;
            END IF;
        END IF;
        RETURN NEW;
    END IF;

    RETURN NEW;
END;
$$;

-- 5. Recreate ALL triggers on transactions table
--    PostgreSQL fires AFTER triggers in alphabetical order.

-- a. Treasury balance trigger
CREATE TRIGGER on_transaction_balance
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_treasury_balance();

-- b. Client account balance trigger
CREATE TRIGGER on_transaction_balance_change
    AFTER INSERT OR UPDATE OR DELETE ON public.transactions
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_client_account_balance();

-- c. Logging trigger (if the function exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'log_transaction_changes' AND pronamespace = 'public'::regnamespace) THEN
    EXECUTE 'CREATE TRIGGER on_transaction_log AFTER INSERT OR UPDATE OR DELETE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.log_transaction_changes()';
  END IF;
END;
$$;

-- d. Notification trigger (if the function exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'notify_on_transaction_change' AND pronamespace = 'public'::regnamespace) THEN
    EXECUTE 'CREATE TRIGGER on_transaction_notify AFTER INSERT ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.notify_on_transaction_change()';
  END IF;
END;
$$;
