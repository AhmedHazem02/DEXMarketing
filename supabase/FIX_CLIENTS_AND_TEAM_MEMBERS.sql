-- =====================================================
-- FIX: Clients not loading + Team members visibility
-- =====================================================
-- IMPORTANT: Uses SECURITY DEFINER functions to avoid
-- recursive RLS policies (which cause 500 errors)
-- =====================================================
-- Run this ENTIRE file in Supabase SQL Editor
-- =====================================================

-- ============================================
-- 1. FIX CLIENTS TABLE: Add missing SELECT policy
-- ============================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Clients can view own profile" ON public.clients;
DROP POLICY IF EXISTS "Staff can manage clients" ON public.clients;
DROP POLICY IF EXISTS "Team leaders can view clients" ON public.clients;

-- Staff (admin, team_leader, accountant) can fully manage clients
-- Uses SECURITY DEFINER function to avoid recursion
CREATE POLICY "Staff can manage clients" ON public.clients
  FOR ALL USING (public.is_team_leader_or_admin() OR public.is_accountant_or_admin());

-- Clients can view their own record
CREATE POLICY "Clients can view own profile" ON public.clients
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- 2. FIX USERS TABLE: Team leaders need to see team members
-- ============================================

-- Allow team leaders to view all users (needed for team member selection)
-- Uses SECURITY DEFINER function to avoid recursion
DROP POLICY IF EXISTS "Team leaders can view team members" ON public.users;

CREATE POLICY "Team leaders can view team members" ON public.users
  FOR SELECT USING (public.is_team_leader_or_admin());

-- ============================================
-- DONE! Refresh your app after running this.
-- ============================================
