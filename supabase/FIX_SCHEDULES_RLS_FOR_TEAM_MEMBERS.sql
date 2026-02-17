-- ============================================
-- FIX RLS POLICIES FOR SCHEDULES
-- Allow team members to create schedules
-- ============================================
-- Problem: Creators and other team members can't INSERT schedules
-- because the existing policy only allows team_leader_id = auth.uid()
-- 
-- Solution: Add INSERT policy for team members + update SELECT policy

-- ============================================
-- 1. Update is_content_team() to include account_manager
-- ============================================
CREATE OR REPLACE FUNCTION public.is_content_team()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND (
      role IN ('creator', 'designer')
      OR (role = 'team_leader' AND department = 'content')
      OR (role = 'account_manager' AND department = 'content')
      OR role = 'admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- 2. Drop ALL existing schedule policies
-- ============================================
DROP POLICY IF EXISTS "TL can manage own schedules" ON public.schedules;
DROP POLICY IF EXISTS "Photography team can view schedules" ON public.schedules;
DROP POLICY IF EXISTS "TL and Admin can manage schedules" ON public.schedules;
DROP POLICY IF EXISTS "Team members can create schedules" ON public.schedules;
DROP POLICY IF EXISTS "Team members can view schedules" ON public.schedules;
DROP POLICY IF EXISTS "Team members can update assigned schedules" ON public.schedules;

-- ============================================
-- 3. NEW POLICIES
-- ============================================

-- Team Leaders, Account Managers, and Admins can manage their own schedules (full CRUD)
CREATE POLICY "TL and Admin can manage schedules" ON public.schedules
  FOR ALL USING (
    auth.uid() = team_leader_id 
    OR public.is_admin()
    OR public.is_team_leader_or_admin()
  );

-- Team members can INSERT schedules (create entries)
CREATE POLICY "Team members can create schedules" ON public.schedules
  FOR INSERT WITH CHECK (
    public.is_photography_team() 
    OR public.is_content_team()
    OR public.is_team_leader_or_admin()
  );

-- Team members can view schedules (both photography and content teams)
CREATE POLICY "Team members can view schedules" ON public.schedules
  FOR SELECT USING (
    public.is_photography_team()
    OR public.is_content_team()
    OR public.is_team_leader_or_admin()
  );

-- Team members can update schedules they created or are assigned to
CREATE POLICY "Team members can update assigned schedules" ON public.schedules
  FOR UPDATE USING (
    auth.uid() = team_leader_id
    OR public.is_team_leader_or_admin()
    OR (
      -- Allow if user is in assigned_members array
      auth.uid() = ANY(assigned_members)
    )
  );

-- ============================================
-- NOTES
-- ============================================
-- Run this in Supabase SQL Editor
-- This allows:
--   ✅ Creators to create schedule entries (Missing Items form)
--   ✅ Photographers/Videographers to create schedule entries
--   ✅ All team members to view schedules
--   ✅ Assigned members to update schedules
--   ✅ Team Leaders & Account Managers to manage all their schedules
--   ✅ Admins to manage all schedules
