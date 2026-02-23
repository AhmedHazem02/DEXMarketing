-- ============================================
-- Fix: Allow account_manager to create/view/update tasks
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Update the helper function to include account_manager
CREATE OR REPLACE FUNCTION public.is_team_leader_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role IN ('admin', 'team_leader', 'account_manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Step 2: Drop and recreate all tasks policies explicitly
DROP POLICY IF EXISTS "Team leaders can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can view assigned tasks" ON public.tasks;
DROP POLICY IF EXISTS "Task owners can update" ON public.tasks;

-- INSERT: admin, team_leader, account_manager can create tasks
CREATE POLICY "Team leaders can create tasks" ON public.tasks
  FOR INSERT WITH CHECK (public.is_team_leader_or_admin());

-- SELECT: assigned users, creators, team leaders, account managers, admins
CREATE POLICY "Users can view assigned tasks" ON public.tasks
  FOR SELECT USING (
    auth.uid() = assigned_to OR
    auth.uid() = created_by OR
    public.is_team_leader_or_admin()
  );

-- UPDATE: assigned users, creators, team leaders, account managers, admins
CREATE POLICY "Task owners can update" ON public.tasks
  FOR UPDATE USING (
    auth.uid() = assigned_to OR
    auth.uid() = created_by OR
    public.is_team_leader_or_admin()
  );

