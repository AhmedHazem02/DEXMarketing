-- ============================================
-- Migration v12: Add 'client_revision' task status
-- Purpose: When a client requests a revision, the task gets status 'client_revision'
--          instead of immediately returning to 'in_progress'.
--          This keeps the task visible in:
--            - The client's dedicated "My Revisions" page (/client/revisions)
--            - The team leader's Revisions Hub
--          The team leader then moves it to 'in_progress' to action it.
-- ============================================

-- 1. Add 'client_revision' to task_status enum (if not already present)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'client_revision'
          AND enumtypid = 'task_status'::regtype
    ) THEN
        ALTER TYPE task_status ADD VALUE 'client_revision';
    END IF;
END;
$$;

-- 2. Add index for fast lookup of tasks by client and status
-- NOTE: Cannot use a partial WHERE clause with the new enum value in the same transaction.
--       A plain composite index covers the same query pattern efficiently.
CREATE INDEX IF NOT EXISTS idx_tasks_client_revision
    ON tasks(client_id, status);

-- 3. Update notify_team_leader_client_response to fire on 'client_revision' (not 'revision')
--    When client requests a revision via the portal, status goes to 'client_revision'
CREATE OR REPLACE FUNCTION notify_team_leader_client_response()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Notify team leader when client approves OR requests revision
    IF OLD.status::text = 'client_review'
       AND NEW.status::text IN ('approved', 'client_revision')
    THEN
        IF NEW.created_by IS NOT NULL THEN
            INSERT INTO notifications (user_id, title, message, link)
            VALUES (
                NEW.created_by,
                CASE
                    WHEN NEW.status::text = 'approved'          THEN 'تمت الموافقة على المهمة'
                    WHEN NEW.status::text = 'client_revision'   THEN 'طلب تعديل من العميل'
                END,
                CASE
                    WHEN NEW.status::text = 'approved'          THEN 'العميل وافق على المهمة "' || NEW.title || '"'
                    WHEN NEW.status::text = 'client_revision'   THEN 'العميل طلب تعديلات على المهمة "' || NEW.title || '" — يرجى المراجعة والتصحيح'
                END,
                '/team-leader/revisions'
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- 4. Re-attach trigger (it may already exist; DROP + CREATE ensures latest version)
DROP TRIGGER IF EXISTS on_client_review_response ON tasks;
CREATE TRIGGER on_client_review_response
    AFTER UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION notify_team_leader_client_response();
