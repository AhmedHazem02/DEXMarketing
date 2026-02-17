-- Fix: Treasury trigger should handle UPDATE and DELETE on transactions
-- M-14: Currently only handles INSERT (via NEW), ignoring balance corrections
-- M-17: Add SET search_path = public to SECURITY DEFINER functions

-- Drop ALL existing triggers on transactions (both old and new names)
DROP TRIGGER IF EXISTS on_transaction_insert ON public.transactions;
DROP TRIGGER IF EXISTS on_transaction_created ON public.transactions;
DROP TRIGGER IF EXISTS on_transaction_change ON public.transactions;

-- Recreate function to handle INSERT, UPDATE, and DELETE
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

-- Recreate trigger for INSERT, UPDATE, and DELETE
CREATE TRIGGER on_transaction_change
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_treasury_balance();

-- M-17: Fix search_path on other SECURITY DEFINER trigger functions
-- Find and patch notification triggers
DO $$
DECLARE
  func_record RECORD;
  func_identity TEXT;
BEGIN
  FOR func_record IN 
    SELECT p.oid, p.proname, pg_get_functiondef(p.oid) as funcdef
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.prosecdef = true  -- SECURITY DEFINER
      AND p.prokind = 'f'
  LOOP
    -- Build full function identity with argument types (handles functions with params)
    func_identity := func_record.proname || '(' || pg_get_function_identity_arguments(func_record.oid) || ')';
    BEGIN
      EXECUTE format('ALTER FUNCTION public.%s SET search_path = public', func_identity);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skipped function %: %', func_identity, SQLERRM;
    END;
  END LOOP;
END;
$$;
