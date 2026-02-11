-- ============================================
-- FIX: Update Notification Triggers to Remove 'type' Column
-- ============================================
-- Run this in Supabase SQL Editor to fix the notification triggers

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS on_task_client_review ON tasks;
DROP TRIGGER IF EXISTS on_client_review_response ON tasks;
DROP FUNCTION IF EXISTS notify_client_task_review();
DROP FUNCTION IF EXISTS notify_team_leader_client_response();

-- Recreate function: Notify client when task enters client_review status
CREATE OR REPLACE FUNCTION notify_client_task_review()
RETURNS TRIGGER AS $$
DECLARE
    client_user_id UUID;
BEGIN
    -- Only proceed if status changed to 'client_review' and client_id is set
    -- Using ::text to compare enum safely
    IF NEW.status::text = 'client_review' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.client_id IS NOT NULL THEN
        -- Get the user_id for this client
        SELECT user_id INTO client_user_id
        FROM clients
        WHERE id = NEW.client_id;

        -- Insert notification if client has a user account (WITHOUT 'type' column)
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

-- Recreate trigger for client review notifications
CREATE TRIGGER on_task_client_review
    AFTER UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION notify_client_task_review();

-- Recreate function: Notify team leader when client responds (approve/revision)
CREATE OR REPLACE FUNCTION notify_team_leader_client_response()
RETURNS TRIGGER AS $$
BEGIN
    -- Only proceed if status changed FROM client_review to approved or revision
    -- Using ::text to compare enum safely
    IF OLD.status::text = 'client_review' AND NEW.status::text IN ('approved', 'revision') THEN
        -- Notify the task creator (team leader) (WITHOUT 'type' column)
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
$$ LANGUAGE plpgsql;

-- Recreate trigger for team leader notifications
CREATE TRIGGER on_client_review_response
    AFTER UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION notify_team_leader_client_response();

-- Success message
SELECT 'Notification triggers updated successfully!' as result;
