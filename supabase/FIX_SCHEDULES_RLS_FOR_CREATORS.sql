-- ============================================
-- FIX RLS POLICIES: Allow creators to update/delete their own schedules
-- ============================================
-- Problem: Creators (content_creator role) can INSERT schedules but
--   cannot UPDATE or DELETE them because:
--   - UPDATE policy only covers: team_leader_id match, TL/Admin role, or assigned_members
--   - DELETE has no policy for creators at all (only FOR ALL covers TL/Admin)
--
-- Fix: Add created_by = auth.uid() condition to UPDATE and DELETE policies
-- ============================================

-- Drop conflicting policies
DROP POLICY IF EXISTS "Team members can update assigned schedules" ON public.schedules;
DROP POLICY IF EXISTS "TL and Admin can manage schedules" ON public.schedules;

-- ============================================
-- Full management for TL, Admin, AND schedule creators
-- ============================================
CREATE POLICY "TL Admin and creator can manage schedules" ON public.schedules
  FOR ALL USING (
    auth.uid() = team_leader_id
    OR auth.uid() = created_by
    OR public.is_admin()
    OR public.is_team_leader_or_admin()
  );

-- ============================================
-- Team members can update schedules they are assigned to
-- ============================================
CREATE POLICY "Team members can update assigned schedules" ON public.schedules
  FOR UPDATE USING (
    auth.uid() = team_leader_id
    OR auth.uid() = created_by
    OR public.is_team_leader_or_admin()
    OR auth.uid() = ANY(assigned_members)
  );

-- ============================================
-- RESULT:
--   ✅ Creators can UPDATE schedules they created (created_by = auth.uid())
--   ✅ Creators can DELETE schedules they created (created_by = auth.uid())
--   ✅ Team Leaders continue to manage all their schedules
--   ✅ Admins continue to manage all schedules
--   ✅ Assigned members can still update schedules they're assigned to
-- ============================================
