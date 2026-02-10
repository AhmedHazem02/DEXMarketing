-- =====================================================
-- Migration: Add assigned_members to schedules
-- =====================================================
-- Purpose: Allow team leaders to assign multiple team 
-- members to a schedule entry (shoot/session)
-- =====================================================

-- Add assigned_members column (UUID array)
ALTER TABLE public.schedules 
ADD COLUMN IF NOT EXISTS assigned_members UUID[] DEFAULT '{}';

-- Index for efficient lookups (e.g., "find all schedules for this member")
CREATE INDEX IF NOT EXISTS idx_schedules_assigned_members 
ON public.schedules USING GIN (assigned_members);

-- =====================================================
-- Update RLS: Team members can view schedules they're assigned to
-- =====================================================

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Team members can view assigned schedules" ON public.schedules;

-- Team members can view schedules they're assigned to
CREATE POLICY "Team members can view assigned schedules" ON public.schedules
  FOR SELECT USING (
    auth.uid() = ANY(assigned_members)
    OR auth.uid() = team_leader_id
    OR public.is_admin()
  );

-- =====================================================
-- Run this in Supabase SQL Editor
-- =====================================================
