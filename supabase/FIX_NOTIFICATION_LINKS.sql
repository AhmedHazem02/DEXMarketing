-- ============================================
-- FIX: All broken notification links
-- Problem: Several triggers had invalid links that caused 404 errors:
--   1. notify_task_assignment        → '/task/{id}' (no such route)
--   2. notify_team_leader_client_response → '/team-leader/tasks/{id}' (no such route)
--   3. notify_client_task_review     → '/client/tasks/{id}' (no dynamic route)
-- Fix: Use only valid, existing routes for each role.
-- Run this in Supabase SQL Editor.
-- ============================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. FIX notify_task_assignment
--    When a task is assigned, send the assignee to their own role dashboard.
--    Looks up the assigned user's role and maps it to the correct base path.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_task_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  creator_name TEXT;
  assignee_role TEXT;
  assignee_link TEXT;
BEGIN
  -- Only notify on new assignment or reassignment
  IF (TG_OP = 'INSERT' AND NEW.assigned_to IS NOT NULL)
     OR (TG_OP = 'UPDATE' AND NEW.assigned_to IS DISTINCT FROM OLD.assigned_to AND NEW.assigned_to IS NOT NULL)
  THEN
    -- Look up creator name and assignee role
    SELECT name INTO creator_name FROM public.users WHERE id = NEW.created_by;
    SELECT role::text INTO assignee_role FROM public.users WHERE id = NEW.assigned_to;

    -- Map role to the correct existing route
    assignee_link := CASE assignee_role
      WHEN 'photographer'    THEN '/photographer'
      WHEN 'videographer'    THEN '/videographer'
      WHEN 'editor'          THEN '/editor'
      WHEN 'creator'         THEN '/creator'
      WHEN 'designer'        THEN '/creator'
      WHEN 'team_leader'     THEN '/team-leader'
      WHEN 'account_manager' THEN '/account-manager'
      WHEN 'admin'           THEN '/admin'
      ELSE '/creator'  -- safe fallback
    END;

    INSERT INTO public.notifications (user_id, title, message, link)
    VALUES (
      NEW.assigned_to,
      'مهمة جديدة',
      'تم تعيين مهمة "' || NEW.title || '" لك بواسطة ' || COALESCE(creator_name, 'المدير'),
      assignee_link
    );
  END IF;

  -- Notify editor if editor_id assigned/changed
  IF (TG_OP = 'UPDATE' AND NEW.editor_id IS DISTINCT FROM OLD.editor_id AND NEW.editor_id IS NOT NULL) THEN
    INSERT INTO public.notifications (user_id, title, message, link)
    VALUES (
      NEW.editor_id,
      'مهمة مونتاج جديدة',
      'تم تعيين مهمة مونتاج "' || NEW.title || '" لك',
      '/editor'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Re-attach trigger
DROP TRIGGER IF EXISTS on_task_assigned ON public.tasks;
CREATE TRIGGER on_task_assigned
  AFTER INSERT OR UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.notify_task_assignment();


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. FIX notify_team_leader_client_response
--    When client approves or requests revision, send TL to /team-leader/revisions
--    (not /team-leader/tasks/{id} which doesn't exist)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_team_leader_client_response()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notify team leader when client approves OR requests revision
  IF OLD.status::text = 'client_review'
     AND NEW.status::text IN ('approved', 'client_revision', 'revision')
  THEN
    IF NEW.created_by IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, link)
      VALUES (
        NEW.created_by,
        CASE
          WHEN NEW.status::text = 'approved'         THEN 'تمت الموافقة على المهمة'
          WHEN NEW.status::text IN ('client_revision', 'revision') THEN 'طلب تعديل من العميل'
        END,
        CASE
          WHEN NEW.status::text = 'approved'         THEN 'العميل وافق على المهمة "' || NEW.title || '"'
          WHEN NEW.status::text IN ('client_revision', 'revision') THEN 'العميل طلب تعديلات على المهمة "' || NEW.title || '" — يرجى المراجعة'
        END,
        '/team-leader/revisions'   -- ✅ valid route
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Re-attach trigger
DROP TRIGGER IF EXISTS on_client_review_response ON public.tasks;
CREATE TRIGGER on_client_review_response
  AFTER UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.notify_team_leader_client_response();


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. FIX notify_client_task_review
--    Send client to /client/tasks (list page, not /client/tasks/{id}
--    which has no dynamic route)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_client_task_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status::text = 'client_review'
     AND OLD.status IS DISTINCT FROM NEW.status
     AND NEW.client_id IS NOT NULL
  THEN
    INSERT INTO public.notifications (user_id, title, message, link)
    SELECT
      c.user_id,
      'مهمة جاهزة للمراجعة',
      'المهمة "' || NEW.title || '" جاهزة لمراجعتك والموافقة عليها',
      '/client/tasks'   -- ✅ valid route
    FROM public.clients c
    WHERE c.id = NEW.client_id
      AND c.user_id IS NOT NULL;
  END IF;

  RETURN NEW;
END;
$$;

-- Re-attach trigger
DROP TRIGGER IF EXISTS on_task_client_review ON public.tasks;
CREATE TRIGGER on_task_client_review
  AFTER UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.notify_client_task_review();


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. FIX notify_workflow_change (already OK but ensure consistent links)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_workflow_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  worker_name TEXT;
  tl_id UUID;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.workflow_stage IS DISTINCT FROM OLD.workflow_stage THEN
    tl_id := NEW.created_by;

    -- When worker finishes their stage, notify TL at revisions hub
    IF NEW.workflow_stage IN ('filming_done', 'editing_done', 'shooting_done') THEN
      SELECT name INTO worker_name FROM public.users WHERE id = NEW.assigned_to;

      INSERT INTO public.notifications (user_id, title, message, link)
      VALUES (
        tl_id,
        'تم إنجاز مهمة',
        COALESCE(worker_name, 'عضو الفريق') || ' أنهى العمل على "' || NEW.title || '"',
        '/team-leader'   -- ✅ valid route (TL main dashboard)
      );
    END IF;

    -- When delivered, notify client via project
    IF NEW.workflow_stage = 'delivered' AND NEW.project_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, link)
      SELECT
        c.user_id,
        'تسليم جديد',
        'تم تسليم "' || NEW.title || '" — يرجى المراجعة',
        '/client/tasks'   -- ✅ valid route
      FROM public.projects p
      JOIN public.clients c ON c.id = p.client_id
      WHERE p.id = NEW.project_id
        AND c.user_id IS NOT NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Re-attach trigger
DROP TRIGGER IF EXISTS on_workflow_change ON public.tasks;
CREATE TRIGGER on_workflow_change
  AFTER UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.notify_workflow_change();


SELECT 'All notification links fixed successfully!' AS result;
