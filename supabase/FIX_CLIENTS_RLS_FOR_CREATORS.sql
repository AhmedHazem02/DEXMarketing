-- Fix RLS Policy for clients table to allow all team members to view clients
-- Run this in Supabase SQL Editor

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Staff can manage clients" ON public.clients;

-- Create new policy allowing all team members (not just admin/team_leader/accountant) to view clients
CREATE POLICY "Team members can view clients" ON public.clients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'team_leader', 'accountant', 'creator', 'videographer', 'photographer', 'editor', 'account_manager', 'designer')
    )
  );

-- Keep management (INSERT/UPDATE/DELETE) restricted to admin, team_leader, and accountant
CREATE POLICY "Staff can manage clients" ON public.clients
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'team_leader', 'accountant', 'account_manager')
    )
  );

CREATE POLICY "Staff can update clients" ON public.clients
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'team_leader', 'accountant', 'account_manager')
    )
  );

CREATE POLICY "Staff can delete clients" ON public.clients
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('admin')
    )
  );

-- Keep the existing client self-view policy
-- (Clients can view own profile policy should already exist)
