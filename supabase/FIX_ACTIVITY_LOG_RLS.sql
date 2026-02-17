-- ============================================
-- FIX: Activity Log - RLS Policies + Auto-Logging Triggers
-- ============================================
-- 1. RLS Policies (skip if already exist)
-- 2. Database Triggers for automatic activity logging
--    (best performance: zero client-side overhead)
-- ============================================

-- =====================
-- PART 1: RLS POLICIES
-- =====================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activity_log' AND policyname = 'Users can view own activity logs') THEN
    CREATE POLICY "Users can view own activity logs" ON public.activity_log FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activity_log' AND policyname = 'Team leaders can view team activity logs') THEN
    CREATE POLICY "Team leaders can view team activity logs" ON public.activity_log FOR SELECT USING (
      public.is_team_leader_or_admin()
      AND user_id IN (SELECT u2.id FROM public.users u2 WHERE u2.department = (SELECT u1.department FROM public.users u1 WHERE u1.id = auth.uid()))
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activity_log' AND policyname = 'Admin can view all activity logs') THEN
    CREATE POLICY "Admin can view all activity logs" ON public.activity_log FOR SELECT USING (public.is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activity_log' AND policyname = 'Users can insert own activity logs') THEN
    CREATE POLICY "Users can insert own activity logs" ON public.activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activity_log' AND policyname = 'Admin can manage activity logs') THEN
    CREATE POLICY "Admin can manage activity logs" ON public.activity_log FOR ALL USING (public.is_admin());
  END IF;
END $$;

-- ====================================
-- PART 2: AUTO-LOGGING TRIGGERS
-- ====================================
-- These triggers automatically record activity in activity_log
-- whenever tasks, schedules, or transactions are modified.
-- Performance: runs inside the DB, zero extra network requests.

-- ————————————————————————
-- 2a. TASKS trigger
-- ————————————————————————
CREATE OR REPLACE FUNCTION public.log_task_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_log (user_id, action, details)
    VALUES (
      COALESCE(NEW.created_by, auth.uid()),
      'task_create',
      jsonb_build_object('task_id', NEW.id, 'title', NEW.title, 'status', NEW.status, 'priority', NEW.priority)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.activity_log (user_id, action, details)
    VALUES (
      COALESCE(auth.uid(), NEW.created_by),
      'task_update',
      jsonb_build_object(
        'task_id', NEW.id,
        'title', NEW.title,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'old_priority', OLD.priority,
        'new_priority', NEW.priority
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_log_task_activity ON public.tasks;
CREATE TRIGGER trg_log_task_activity
  AFTER INSERT OR UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.log_task_activity();

-- ————————————————————————
-- 2b. SCHEDULES trigger
-- ————————————————————————
CREATE OR REPLACE FUNCTION public.log_schedule_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_log (user_id, action, details)
    VALUES (
      COALESCE(NEW.created_by, auth.uid()),
      'schedule_create',
      jsonb_build_object('schedule_id', NEW.id, 'client_id', NEW.client_id, 'department', NEW.department, 'schedule_type', NEW.schedule_type)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.activity_log (user_id, action, details)
    VALUES (
      COALESCE(auth.uid(), NEW.created_by),
      'schedule_update',
      jsonb_build_object(
        'schedule_id', NEW.id,
        'client_id', NEW.client_id,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'approval_status', NEW.approval_status
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.activity_log (user_id, action, details)
    VALUES (
      COALESCE(auth.uid(), OLD.created_by),
      'schedule_delete',
      jsonb_build_object('schedule_id', OLD.id, 'client_id', OLD.client_id)
    );
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_log_schedule_activity ON public.schedules;
CREATE TRIGGER trg_log_schedule_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.schedules
  FOR EACH ROW EXECUTE FUNCTION public.log_schedule_activity();

-- ————————————————————————
-- 2c. TRANSACTIONS trigger
-- ————————————————————————
CREATE OR REPLACE FUNCTION public.log_transaction_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.activity_log (user_id, action, details)
  VALUES (
    COALESCE(NEW.created_by, auth.uid()),
    'transaction_create',
    jsonb_build_object('transaction_id', NEW.id, 'type', NEW.type, 'amount', NEW.amount, 'category', NEW.category)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_log_transaction_activity ON public.transactions;
CREATE TRIGGER trg_log_transaction_activity
  AFTER INSERT ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.log_transaction_activity();

-- ————————————————————————
-- 2d. USERS update trigger (settings, profile changes)
-- ————————————————————————
CREATE OR REPLACE FUNCTION public.log_user_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log meaningful changes (not just last_seen or trivial updates)
  IF OLD.name IS DISTINCT FROM NEW.name
     OR OLD.role IS DISTINCT FROM NEW.role
     OR OLD.is_active IS DISTINCT FROM NEW.is_active
     OR OLD.avatar_url IS DISTINCT FROM NEW.avatar_url THEN
    INSERT INTO public.activity_log (user_id, action, details)
    VALUES (
      COALESCE(auth.uid(), NEW.id),
      'user_update',
      jsonb_build_object(
        'target_user_id', NEW.id,
        'target_name', NEW.name,
        'changes', jsonb_build_object(
          'name', CASE WHEN OLD.name IS DISTINCT FROM NEW.name THEN jsonb_build_object('old', OLD.name, 'new', NEW.name) ELSE NULL END,
          'role', CASE WHEN OLD.role IS DISTINCT FROM NEW.role THEN jsonb_build_object('old', OLD.role, 'new', NEW.role) ELSE NULL END,
          'is_active', CASE WHEN OLD.is_active IS DISTINCT FROM NEW.is_active THEN jsonb_build_object('old', OLD.is_active, 'new', NEW.is_active) ELSE NULL END
        )
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_log_user_activity ON public.users;
CREATE TRIGGER trg_log_user_activity
  AFTER UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.log_user_activity();

-- ————————————————————————
-- 2e. PAGES update trigger
-- ————————————————————————
CREATE OR REPLACE FUNCTION public.log_page_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.activity_log (user_id, action, details)
  VALUES (
    auth.uid(),
    CASE WHEN TG_OP = 'INSERT' THEN 'page_create' ELSE 'page_update' END,
    jsonb_build_object('page_id', NEW.id, 'slug', NEW.slug)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_log_page_activity ON public.pages;
CREATE TRIGGER trg_log_page_activity
  AFTER INSERT OR UPDATE ON public.pages
  FOR EACH ROW EXECUTE FUNCTION public.log_page_activity();
