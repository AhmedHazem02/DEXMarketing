-- =====================================================
-- FIX: Remove recursive policy causing 500 error
-- =====================================================
-- Problem: The "View own participation" policy has a recursive EXISTS clause
-- that queries the same table it's protecting, causing infinite recursion.
--
-- Error: GET conversation_participants 500 (Internal Server Error)
-- =====================================================

-- Drop the problematic policy
DROP POLICY IF EXISTS "View own participation" ON public.conversation_participants;

-- Create a fixed policy without recursion
CREATE POLICY "View own participation" ON public.conversation_participants
  FOR SELECT USING (
    -- Users can see their own participations
    user_id = auth.uid()
    -- Admins can see all participations
    OR public.is_admin()
  );

-- =====================================================
-- Optional: If you want participants to see other 
-- participants in the same conversation, use this instead:
-- =====================================================
-- Uncomment below if needed (currently commented out)

/*
DROP POLICY IF EXISTS "View own participation" ON public.conversation_participants;

CREATE POLICY "View conversation participants" ON public.conversation_participants
  FOR SELECT USING (
    -- Users can see their own participations
    user_id = auth.uid()
    -- Admins can see all
    OR public.is_admin()
    -- OR users can see participants in conversations they're part of
    -- (Use a helper function to avoid recursion)
    OR public.is_conversation_participant(conversation_id)
  );
*/

-- =====================================================
-- Apply changes
-- =====================================================
-- Run this file in your Supabase SQL Editor:
-- 1. Go to Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire file
-- 4. Click "Run"
-- =====================================================
