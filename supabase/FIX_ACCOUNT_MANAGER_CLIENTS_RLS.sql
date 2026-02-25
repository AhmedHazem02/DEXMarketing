-- ============================================
-- Fix: Account Manager cannot see clients when creating tasks
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Drop ALL existing clients policies to start clean
DROP POLICY IF EXISTS "Clients can view own profile" ON public.clients;
DROP POLICY IF EXISTS "Staff can manage clients" ON public.clients;
DROP POLICY IF EXISTS "Team leaders can view clients" ON public.clients;
DROP POLICY IF EXISTS "Team members can view clients" ON public.clients;
DROP POLICY IF EXISTS "Staff can update clients" ON public.clients;
DROP POLICY IF EXISTS "Staff can delete clients" ON public.clients;

-- Step 2: Ensure is_team_leader_or_admin() includes account_manager
CREATE OR REPLACE FUNCTION public.is_team_leader_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role IN ('admin', 'team_leader', 'account_manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Step 3: SELECT — All staff roles can view clients (needed for task/schedule forms)
CREATE POLICY "Staff can view clients" ON public.clients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN (
        'admin',
        'team_leader',
        'account_manager',
        'accountant',
        'creator',
        'videographer',
        'photographer',
        'editor',
        'designer'
      )
    )
  );

-- Step 4: Clients can view their own profile
CREATE POLICY "Clients can view own profile" ON public.clients
  FOR SELECT USING (auth.uid() = user_id);

-- Step 5: INSERT — admin, team_leader, account_manager, accountant can add clients
CREATE POLICY "Staff can insert clients" ON public.clients
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'team_leader', 'account_manager', 'accountant')
    )
  );

-- Step 6: UPDATE — admin, team_leader, account_manager, accountant can update clients
CREATE POLICY "Staff can update clients" ON public.clients
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'team_leader', 'account_manager', 'accountant')
    )
  );

-- Step 7: DELETE — admin only
CREATE POLICY "Admin can delete clients" ON public.clients
  FOR DELETE USING (public.is_admin());

-- ============================================
-- Step 8: Ensure account_manager can read users table
-- (needed for the useClients inner join query)
-- ============================================
DROP POLICY IF EXISTS "Team leaders can view team members" ON public.users;

CREATE POLICY "Team leaders can view team members" ON public.users
  FOR SELECT USING (public.is_team_leader_or_admin());

-- ============================================
-- DONE! Refresh your app after running this.
-- ============================================
