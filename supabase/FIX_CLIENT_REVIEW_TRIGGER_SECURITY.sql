-- ============================================
-- FIX: Client review notification trigger must run as SECURITY DEFINER
-- Problem: notify_team_leader_client_response() runs as the invoking user (client),
--          but tries to INSERT a notification for created_by (team leader).
--          RLS on notifications allows INSERT only for auth.uid() = user_id,
--          so the insert fails with 403.
-- Fix: Recreate both client-review trigger functions with SECURITY DEFINER
--      so they run with the privileges of the function owner (postgres/superuser)
--      and bypass RLS — matching the intent stated in the original RLS comments.
-- ============================================

-- Fix notify_client_task_review (client gets notified when task enters client_review)
CREATE OR REPLACE FUNCTION notify_client_task_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only proceed if status changed to 'client_review' and client_id is set
    IF NEW.status::text = 'client_review' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.client_id IS NOT NULL THEN
        -- Find the user_id of the client and notify them
        INSERT INTO notifications (user_id, title, message, link)
        SELECT
            c.user_id,
            'مهمة جاهزة للمراجعة',
            'المهمة "' || NEW.title || '" جاهزة لمراجعتك والموافقة عليها',
            '/client/tasks'
        FROM clients c
        WHERE c.id = NEW.client_id
          AND c.user_id IS NOT NULL;
    END IF;

    RETURN NEW;
END;
$$;

-- Fix notify_team_leader_client_response (team leader notified when client approves/rejects)
CREATE OR REPLACE FUNCTION notify_team_leader_client_response()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only proceed if status changed FROM client_review to approved or revision
    IF OLD.status::text = 'client_review' AND NEW.status::text IN ('approved', 'revision') THEN
        -- Notify the task creator (team leader)
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
