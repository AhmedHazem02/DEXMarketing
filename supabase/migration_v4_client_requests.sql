-- ============================================
-- Migration V4: Client Task Requests System
-- ============================================
-- Enables clients to submit task requests (new tasks or modifications)
-- that route to department team leaders for approval/rejection.
-- ============================================

-- ============================================
-- 1. NEW ENUMS
-- ============================================

-- Request type: distinguish client requests from regular tasks
DO $$ BEGIN
  CREATE TYPE public.request_type AS ENUM ('new_task', 'modification');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Request status: approval workflow
DO $$ BEGIN
  CREATE TYPE public.request_status AS ENUM ('pending_approval', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 2. ALTER TASKS TABLE - Add request columns
-- ============================================

-- Type of client request (NULL = regular task, not a request)
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS request_type public.request_type DEFAULT NULL;

-- Approval status for client requests
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS request_status public.request_status DEFAULT NULL;

-- Rejection reason (optional, set by team leader)
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT DEFAULT NULL;

-- Link to original task for modification requests
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS original_task_id UUID REFERENCES public.tasks(id) DEFAULT NULL;

-- ============================================
-- 3. INDEXES for performance
-- ============================================

-- Fast lookup: pending requests by department (team leader dashboard)
CREATE INDEX IF NOT EXISTS idx_tasks_pending_requests
  ON public.tasks(department, request_status)
  WHERE request_type IS NOT NULL;

-- Fast lookup: client's own requests
CREATE INDEX IF NOT EXISTS idx_tasks_client_requests
  ON public.tasks(created_by, request_type)
  WHERE request_type IS NOT NULL;

-- Lookup modification chain
CREATE INDEX IF NOT EXISTS idx_tasks_original_task
  ON public.tasks(original_task_id)
  WHERE original_task_id IS NOT NULL;

-- ============================================
-- 4. HELPER FUNCTION: Check if user is a client
-- ============================================

CREATE OR REPLACE FUNCTION public.is_client()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'client'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- 5. RLS POLICIES for client requests
-- ============================================

-- Clients can insert task requests (only as pending)
CREATE POLICY "Clients can create task requests" ON public.tasks
  FOR INSERT WITH CHECK (
    public.is_client()
    AND auth.uid() = created_by
    AND request_type IS NOT NULL
    AND request_status = 'pending_approval'
  );

-- Clients can view their own requests
CREATE POLICY "Clients can view own requests" ON public.tasks
  FOR SELECT USING (
    public.is_client()
    AND auth.uid() = created_by
    AND request_type IS NOT NULL
  );

-- Clients can view tasks assigned to them or created by them (general)
CREATE POLICY "Clients can view own tasks" ON public.tasks
  FOR SELECT USING (
    public.is_client()
    AND auth.uid() = created_by
  );

-- ============================================
-- 6. NOTIFICATION TRIGGERS
-- ============================================

-- Trigger: Notify team leader when client creates a request
CREATE OR REPLACE FUNCTION public.notify_client_request_created()
RETURNS TRIGGER AS $$
DECLARE
  client_name TEXT;
  tl_record RECORD;
  dept_label TEXT;
BEGIN
  -- Only fire for client requests
  IF NEW.request_type IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get client name
  SELECT u.name INTO client_name
  FROM public.users u
  WHERE u.id = NEW.created_by;

  -- Department label for notification
  dept_label := CASE NEW.department
    WHEN 'photography' THEN 'التصوير'
    WHEN 'content' THEN 'المحتوى'
    ELSE 'عام'
  END;

  -- Notify all active team leaders of this department
  FOR tl_record IN
    SELECT id FROM public.users
    WHERE role = 'team_leader'
      AND department = NEW.department
      AND is_active = true
  LOOP
    INSERT INTO public.notifications (user_id, title, message, link)
    VALUES (
      tl_record.id,
      'طلب جديد من عميل',
      'العميل ' || COALESCE(client_name, 'غير معروف') || ' أرسل طلب ' ||
        CASE NEW.request_type
          WHEN 'new_task' THEN 'مهمة جديدة'
          WHEN 'modification' THEN 'تعديل'
        END ||
        ' في قسم ' || dept_label || ': "' || NEW.title || '"',
      '/team-leader'
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS on_client_request_created ON public.tasks;
CREATE TRIGGER on_client_request_created
  AFTER INSERT ON public.tasks
  FOR EACH ROW
  WHEN (NEW.request_type IS NOT NULL)
  EXECUTE PROCEDURE public.notify_client_request_created();


-- Trigger: Notify client when request is approved or rejected
CREATE OR REPLACE FUNCTION public.notify_request_status_changed()
RETURNS TRIGGER AS $$
DECLARE
  tl_name TEXT;
BEGIN
  -- Only fire when request_status actually changes
  IF OLD.request_status IS NOT DISTINCT FROM NEW.request_status THEN
    RETURN NEW;
  END IF;

  -- Only notify on approved or rejected
  IF NEW.request_status NOT IN ('approved', 'rejected') THEN
    RETURN NEW;
  END IF;

  -- Get team leader name (the one who changed status)
  SELECT name INTO tl_name FROM public.users WHERE id = NEW.assigned_to;

  IF NEW.request_status = 'approved' THEN
    INSERT INTO public.notifications (user_id, title, message, link)
    VALUES (
      NEW.created_by,
      'تمت الموافقة على طلبك',
      'تمت الموافقة على طلبك "' || NEW.title || '" بواسطة ' || COALESCE(tl_name, 'التيم ليدر'),
      '/client'
    );
  ELSIF NEW.request_status = 'rejected' THEN
    INSERT INTO public.notifications (user_id, title, message, link)
    VALUES (
      NEW.created_by,
      'تم رفض طلبك',
      'تم رفض طلبك "' || NEW.title || '"' ||
        CASE WHEN NEW.rejection_reason IS NOT NULL
          THEN ' - السبب: ' || NEW.rejection_reason
          ELSE ''
        END,
      '/client'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_request_status_changed ON public.tasks;
CREATE TRIGGER on_request_status_changed
  AFTER UPDATE ON public.tasks
  FOR EACH ROW
  WHEN (OLD.request_type IS NOT NULL)
  EXECUTE PROCEDURE public.notify_request_status_changed();

-- ============================================
-- 7. INSERT POLICY for notifications (allow triggers to insert)
-- ============================================

-- Ensure notifications can be inserted by triggers (SECURITY DEFINER handles this)
-- But also allow system inserts
DO $$ BEGIN
  CREATE POLICY "System can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
