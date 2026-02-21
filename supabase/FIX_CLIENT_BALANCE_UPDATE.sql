-- ============================================
-- Fix: Auto-Update Client Account Balance on Transaction
-- Created: 2026-02-21
-- Description: Automatically update client_accounts.remaining_balance after each transaction
--              - INSERT: Update balance when transaction is created
--              - UPDATE: Update balance when transaction is modified
--              - DELETE: Revert balance when transaction is deleted
-- ============================================

-- 1. Updated function to handle balance updates correctly
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

    -- Handle DELETE: Revert the transaction from balance
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

    RETURN NEW;
END;
$$;

-- 2. Drop old triggers (if they exist)
DROP TRIGGER IF EXISTS on_transaction_balance_change ON public.transactions;
DROP TRIGGER IF EXISTS on_transaction_approved ON public.transactions;

-- 3. Create new unified trigger for all balance updates
-- Fires on INSERT, UPDATE, and DELETE to maintain balance in real-time
CREATE TRIGGER on_transaction_balance_change
    AFTER INSERT OR UPDATE OR DELETE ON public.transactions
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_client_account_balance();

-- 4. Create notification function for transaction changes
CREATE OR REPLACE FUNCTION public.notify_on_transaction_change()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    client_user_id UUID;
    transaction_desc TEXT;
BEGIN
    -- Only notify on INSERT or successful approval
    IF TG_OP = 'INSERT' AND NEW.client_id IS NOT NULL AND NEW.visible_to_client = true THEN
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
                'تم تسجيل معاملة: ' || transaction_desc || ' - المبلغ: ' || NEW.amount::text || ' ج.م',
                '/client/account',
                false
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- 5. Create trigger for notifications
DROP TRIGGER IF EXISTS on_transaction_notify ON public.transactions;
CREATE TRIGGER on_transaction_notify
    AFTER INSERT ON public.transactions
    FOR EACH ROW 
    EXECUTE FUNCTION public.notify_on_transaction_change();

-- ============================================
-- Testing (can be commented out after verification)
-- ============================================
-- To test: 
-- 1. Insert an income transaction: SELECT remaining_balance FROM client_accounts WHERE id = '<account_id>'
-- 2. Insert an expense transaction: Check balance decreased
-- 3. Update transaction amount: Check balance adjusted correctly
-- 4. Delete transaction: Check balance reverted
