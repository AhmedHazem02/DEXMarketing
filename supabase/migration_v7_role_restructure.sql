-- ============================================
-- Migration V7: Role Restructure & Schedule Enhancements
-- Date: 2026-02-15
-- ============================================

-- ============================================
-- 1. Add new roles to user_role ENUM
-- ============================================
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'account_manager';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'designer';

-- ============================================
-- 2. Schedule table enhancements
-- ============================================

-- Missing items (text description of what's missing)
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS missing_items TEXT;

-- Missing items status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'missing_items_status') THEN
        CREATE TYPE missing_items_status AS ENUM ('pending', 'resolved', 'not_applicable');
    END IF;
END$$;
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS missing_items_status missing_items_status DEFAULT 'not_applicable';

-- Schedule type (reels or post)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'schedule_type') THEN
        CREATE TYPE schedule_type AS ENUM ('reels', 'post');
    END IF;
END$$;
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS schedule_type schedule_type DEFAULT 'post';

-- Who created the schedule entry
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id);

-- Approval status for content creator schedules
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_status') THEN
        CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
    END IF;
END$$;
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS approval_status approval_status DEFAULT 'pending';

-- Account Manager notes on schedule
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS manager_notes TEXT;

-- Links with comments: [{url, comment}]
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS links JSONB DEFAULT '[]';

-- Images array: ["url1", "url2", ...] max 10
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';

-- ============================================
-- 3. RLS: Allow account_manager same privileges as team_leader
-- ============================================
CREATE OR REPLACE FUNCTION public.is_team_leader_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role IN ('admin', 'team_leader', 'account_manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- 4. Indexes for new columns
-- ============================================
CREATE INDEX IF NOT EXISTS idx_schedules_created_by ON public.schedules(created_by);
CREATE INDEX IF NOT EXISTS idx_schedules_approval_status ON public.schedules(approval_status);
CREATE INDEX IF NOT EXISTS idx_schedules_schedule_type ON public.schedules(schedule_type);
CREATE INDEX IF NOT EXISTS idx_schedules_department ON public.schedules(department);
