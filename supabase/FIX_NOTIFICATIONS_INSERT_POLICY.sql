-- ============================================
-- FIX: Restrict notifications INSERT policy
-- Previously: WITH CHECK (true) — allowed any authenticated user to create 
-- notifications for any user, enabling potential phishing attacks.
-- Now: Only allows system (via SECURITY DEFINER triggers) or self-notifications.
-- ============================================

-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Create a restricted INSERT policy:
-- Users can only insert notifications targeted at themselves.
-- System notifications (from triggers) use SECURITY DEFINER functions
-- which bypass RLS, so they still work.
CREATE POLICY "Users can create own notifications"
    ON public.notifications
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
