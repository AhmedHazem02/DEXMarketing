-- ============================================
-- Migration: Forward Task — RLS Policies
-- ============================================
-- Enables Account Managers to clone attachments and send
-- notifications when forwarding an approved task to a designer.
-- ============================================

-- 1. Attachments INSERT — allow team leaders & account managers
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename  = 'attachments'
          AND policyname = 'Leaders can insert attachments'
    ) THEN
        CREATE POLICY "Leaders can insert attachments"
            ON public.attachments
            FOR INSERT
            WITH CHECK (public.is_team_leader_or_admin());
    END IF;
END $$;

-- 2. Notifications INSERT — allow team leaders & account managers
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename  = 'notifications'
          AND policyname = 'Leaders can create notifications'
    ) THEN
        CREATE POLICY "Leaders can create notifications"
            ON public.notifications
            FOR INSERT
            WITH CHECK (public.is_team_leader_or_admin());
    END IF;
END $$;

-- 3. Comments INSERT — allow team leaders & account managers (needed for Forward cloning)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename  = 'comments'
          AND policyname = 'Leaders can insert comments'
    ) THEN
        CREATE POLICY "Leaders can insert comments"
            ON public.comments
            FOR INSERT
            WITH CHECK (public.is_team_leader_or_admin());
    END IF;
END $$;
