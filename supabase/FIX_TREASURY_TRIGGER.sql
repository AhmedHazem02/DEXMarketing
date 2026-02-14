-- Fix treasury balance update trigger to include WHERE clause
-- This fixes the "UPDATE requires a WHERE clause" error

CREATE OR REPLACE FUNCTION public.update_treasury_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'income' THEN
    UPDATE public.treasury 
    SET current_balance = current_balance + NEW.amount, 
        updated_at = now()
    WHERE id = (SELECT id FROM public.treasury LIMIT 1);
  ELSE
    UPDATE public.treasury 
    SET current_balance = current_balance - NEW.amount, 
        updated_at = now()
    WHERE id = (SELECT id FROM public.treasury LIMIT 1);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
