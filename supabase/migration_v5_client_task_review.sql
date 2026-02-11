-- Migration V5: Client Task Review Workflow
-- Adds direct client linking to tasks and client review status

-- ============================================
-- IMPORTANT: This migration must be run in TWO steps due to PostgreSQL enum limitations
-- Step 1: Run this section first, then COMMIT
-- Step 2: Run the rest of the file after committing
-- ============================================

-- ============================================
-- STEP 1: Add 'client_review' status to task_status enum
-- ============================================
-- Run this first, then commit before continuing:
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'client_review';

-- ============================================
-- COMMIT HERE - Then run the rest of the file
-- ============================================

-- ============================================
-- COMMIT HERE - Then run the rest of the file
-- ============================================

-- ============================================
-- STEP 2: Add client_id column and related changes
-- ============================================

-- Add client_id column to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

COMMENT ON COLUMN tasks.client_id IS 'Direct link to client for task review workflow. NULL means task is not linked to a specific client.';

-- ============================================
-- 3. Create indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_tasks_client_review 
ON tasks(client_id, status) 
WHERE client_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_client_id 
ON tasks(client_id) 
WHERE client_id IS NOT NULL;

-- ============================================
-- 4. Update RLS Policies for Clients
-- ============================================

-- Allow clients to view tasks directly assigned to them (via client_id)
DROP POLICY IF EXISTS "Clients can view their assigned tasks" ON tasks;
CREATE POLICY "Clients can view their assigned tasks" ON tasks
    FOR SELECT
    USING (
        client_id IN (
            SELECT id FROM clients WHERE user_id = auth.uid()
        )
    );

-- Keep existing policy for clients viewing tasks they created (requests)
-- This should already exist from migration_v4, but we ensure it's present
DROP POLICY IF EXISTS "Clients can view their created tasks" ON tasks;
CREATE POLICY "Clients can view their created tasks" ON tasks
    FOR SELECT
    USING (created_by = auth.uid());

-- Allow clients to update tasks assigned to them (for approve/reject feedback)
DROP POLICY IF EXISTS "Clients can update their assigned tasks" ON tasks;
CREATE POLICY "Clients can update their assigned tasks" ON tasks
    FOR UPDATE
    USING (
        client_id IN (
            SELECT id FROM clients WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        client_id IN (
            SELECT id FROM clients WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- 5. Notification Triggers
-- ============================================

-- Trigger function: Notify client when task enters client_review status
CREATE OR REPLACE FUNCTION notify_client_task_review()
RETURNS TRIGGER AS $$
DECLARE
    client_user_id UUID;
BEGIN
    -- Only proceed if status changed to 'client_review' and client_id is set
    IF NEW.status::text = 'client_review' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.client_id IS NOT NULL THEN
        -- Get the user_id for this client
        SELECT user_id INTO client_user_id
        FROM clients
        WHERE id = NEW.client_id;

        -- Insert notification if client has a user account
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
$$ LANGUAGE plpgsql;

-- Create trigger for client review notifications
DROP TRIGGER IF EXISTS on_task_client_review ON tasks;
CREATE TRIGGER on_task_client_review
    AFTER UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION notify_client_task_review();

-- Trigger function: Notify team leader when client responds (approve/revision)
CREATE OR REPLACE FUNCTION notify_team_leader_client_response()
RETURNS TRIGGER AS $$
BEGIN
    -- Only proceed if status changed FROM client_review to approved or revision
    IF OLD.status::text = 'client_review' AND NEW.status IN ('approved', 'revision') THEN
        -- Notify the task creator (team leader)
        IF NEW.created_by IS NOT NULL THEN
            INSERT INTO notifications (user_id, title, message, link)
            VALUES (
                NEW.created_by,
                CASE 
                    WHEN NEW.status = 'approved' THEN 'تمت الموافقة على المهمة'
                    WHEN NEW.status = 'revision' THEN 'طلب تعديل على المهمة'
                END,
                CASE 
                    WHEN NEW.status = 'approved' THEN 'العميل وافق على المهمة "' || NEW.title || '"'
                    WHEN NEW.status = 'revision' THEN 'العميل طلب تعديلات على المهمة "' || NEW.title || '"'
                END,
                '/team-leader/tasks/' || NEW.id
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for team leader notifications
DROP TRIGGER IF EXISTS on_client_review_response ON tasks;
CREATE TRIGGER on_client_review_response
    AFTER UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION notify_team_leader_client_response();

-- ============================================
-- 6. Update existing data (optional)
-- ============================================
-- If you want to link existing tasks to clients via their projects:
-- UPDATE tasks t
-- SET client_id = p.client_id
-- FROM projects p
-- WHERE t.project_id = p.id 
--   AND p.client_id IS NOT NULL 
--   AND t.client_id IS NULL;

COMMENT ON TABLE tasks IS 'Tasks can now be directly linked to clients via client_id for review workflow';
