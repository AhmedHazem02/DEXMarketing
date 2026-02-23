-- ============================================
-- Fix: Client Revision Notification Link
-- ============================================
-- The original trigger sent notifications with a link to /team-leader/tasks/{id}
-- which doesn't exist. The correct page is /team-leader/revisions
-- ============================================

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
                '/team-leader/revisions'   -- Fixed: was /team-leader/tasks/{id} (non-existent route)
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-create the trigger (no change needed, function is replaced above)
DROP TRIGGER IF EXISTS on_client_review_response ON tasks;
CREATE TRIGGER on_client_review_response
    AFTER UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION notify_team_leader_client_response();
