
-- 1. Ensure UUID extension exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Clean up existing trigger/function to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Recreate the Handler Function (Robust Version)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  u_role public.user_role;
BEGIN
  -- Safely determine role
  BEGIN
    u_role := COALESCE((new.raw_user_meta_data->>'role')::public.user_role, 'client'::public.user_role);
  EXCEPTION WHEN OTHERS THEN
    u_role := 'client'::public.user_role;
  END;

  -- Insert into public.users
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    u_role
  );
  
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- In case of any error, we log it and allow the Auth user to be created.
    -- This prevents the 500 Internal Server Error, allowing you to debug the profile creation later.
    RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Rebind the Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Verify User Role Enum Exists (Just in case)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('admin', 'accountant', 'team_leader', 'creator', 'client');
    END IF;
END
$$;
