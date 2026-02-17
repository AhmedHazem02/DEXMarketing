-- ============================================
-- FIX: Notifications RLS - Each user sees ONLY their own notifications
-- ============================================
-- Problem: All users can see all notifications
-- Fix: Drop all existing policies, re-create strict ones
-- Also: Fix notification trigger functions with proper search_path
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Ensure RLS is enabled on notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 2. Force RLS even for table owner (prevents bypass)
ALTER TABLE public.notifications FORCE ROW LEVEL SECURITY;

-- 3. Drop ALL existing policies on notifications table
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'notifications'
          AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.notifications', pol.policyname);
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

-- 4. Re-create correct SELECT policy: Users can only see their OWN notifications
CREATE POLICY "Users can view own notifications"
    ON public.notifications
    FOR SELECT
    USING (auth.uid() = user_id);

-- 5. Re-create correct UPDATE policy: Users can only update their OWN notifications (mark as read)
CREATE POLICY "Users can update own notifications"
    ON public.notifications
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 6. Re-create INSERT policy: Only self or system (SECURITY DEFINER) can insert
-- Trigger functions run as SECURITY DEFINER so they bypass RLS entirely.
-- This policy restricts direct client inserts to own user_id only.
CREATE POLICY "Users can create own notifications"
    ON public.notifications
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 7. DELETE policy: Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
    ON public.notifications
    FOR DELETE
    USING (auth.uid() = user_id);

-- 8. Verify: List all current policies on notifications
SELECT 
    policyname,
    cmd AS operation,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies
WHERE tablename = 'notifications'
  AND schemaname = 'public'
ORDER BY policyname;

-- Success message
SELECT 'Notifications RLS fixed! Each user now sees only their own notifications.' AS result;

-- ============================================
-- FIX: Notification trigger functions - add SECURITY DEFINER + search_path
-- These functions insert notifications on behalf of users, so they must:
-- 1. Use SECURITY DEFINER to bypass RLS
-- 2. Set search_path = public to prevent search_path injection
-- ============================================

-- Fix: notify_client_task_review
CREATE OR REPLACE FUNCTION public.notify_client_task_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    client_user_id UUID;
BEGIN
    IF NEW.status::text = 'client_review' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.client_id IS NOT NULL THEN
        SELECT user_id INTO client_user_id
        FROM clients
        WHERE id = NEW.client_id;

        IF client_user_id IS NOT NULL THEN
            INSERT INTO notifications (user_id, title, message, link)
            VALUES (
                client_user_id,
                'مهمة جديدة تحتاج مراجعتك',
                'المهمة "' || NEW.title || '" جاهزة للمراجعة والموافقة',
                '/client/tasks/' || NEW.id
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

-- Fix: notify_team_leader_client_response
CREATE OR REPLACE FUNCTION public.notify_team_leader_client_response()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF OLD.status::text = 'client_review' AND NEW.status::text IN ('approved', 'revision') THEN
        IF NEW.created_by IS NOT NULL THEN
            INSERT INTO notifications (user_id, title, message, link)
            VALUES (
                NEW.created_by,
                CASE 
                    WHEN NEW.status::text = 'approved' THEN 'تمت الموافقة على المهمة'
                    WHEN NEW.status::text = 'revision' THEN 'طلب تعديل على المهمة'
                END,
                CASE 
                    WHEN NEW.status::text = 'approved' THEN 'العميل وافق على المهمة "' || NEW.title || '"'
                    WHEN NEW.status::text = 'revision' THEN 'العميل طلب تعديلات على المهمة "' || NEW.title || '"'
                END,
                '/team-leader/tasks/' || NEW.id
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

-- Fix: handle_new_user (also SECURITY DEFINER, add search_path)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'client')
  );
  RETURN new;
END;
$$;

-- Fix: is_admin, is_team_leader_or_admin, is_accountant_or_admin (add search_path)
ALTER FUNCTION public.is_admin() SET search_path = public;
ALTER FUNCTION public.is_team_leader_or_admin() SET search_path = public;
ALTER FUNCTION public.is_accountant_or_admin() SET search_path = public;

SELECT 'All SECURITY DEFINER functions patched with search_path = public' AS result;
