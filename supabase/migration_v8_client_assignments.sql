-- ============================================
-- Migration V8: Client Assignments
-- Allows team leaders (team_leader for photography, account_manager for content)
-- to assign specific clients to their team members.
-- Team members will only see their assigned clients in forms.
-- ============================================

-- Make start_time nullable so creator/simplified forms can omit it
ALTER TABLE public.schedules ALTER COLUMN start_time DROP NOT NULL;

-- ============================================
-- RLS: Allow content team members (creator, designer) to INSERT schedules
-- The existing policy only allows team_leader_id = auth.uid() or admin.
-- Creators insert schedules with team_leader_id = account_manager, so we
-- need a separate INSERT policy scoped to created_by = auth.uid().
-- ============================================

DROP POLICY IF EXISTS "Content team can create schedules" ON public.schedules;

CREATE POLICY "Content team can create schedules" ON public.schedules
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('creator', 'designer')
    )
  );

-- Also allow content team members to SELECT and UPDATE their own schedules
DROP POLICY IF EXISTS "Content team can view and update own schedules" ON public.schedules;

CREATE POLICY "Content team can view and update own schedules" ON public.schedules
  FOR SELECT USING (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('creator', 'designer')
    )
  );

CREATE POLICY "Content team can update own schedules" ON public.schedules
  FOR UPDATE USING (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('creator', 'designer')
    )
  );

-- Create the client_assignments table
CREATE TABLE IF NOT EXISTS public.client_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(client_id, user_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_client_assignments_user_id ON public.client_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_client_assignments_assigned_by ON public.client_assignments(assigned_by);
CREATE INDEX IF NOT EXISTS idx_client_assignments_client_id ON public.client_assignments(client_id);

-- Enable RLS
ALTER TABLE public.client_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- SELECT: Users can see their own assignments
DROP POLICY IF EXISTS "Users can view own assignments" ON public.client_assignments;
CREATE POLICY "Users can view own assignments"
    ON public.client_assignments FOR SELECT
    USING (
        auth.uid() = user_id
    );

-- SELECT: Team leaders can see assignments they created
DROP POLICY IF EXISTS "Leaders can view assignments they created" ON public.client_assignments;
CREATE POLICY "Leaders can view assignments they created"
    ON public.client_assignments FOR SELECT
    USING (
        auth.uid() = assigned_by
    );

-- SELECT: Admins can see all assignments
DROP POLICY IF EXISTS "Admins can view all assignments" ON public.client_assignments;
CREATE POLICY "Admins can view all assignments"
    ON public.client_assignments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- INSERT: Only team_leader, account_manager, admin can insert
DROP POLICY IF EXISTS "Leaders and admins can create assignments" ON public.client_assignments;
CREATE POLICY "Leaders and admins can create assignments"
    ON public.client_assignments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('team_leader', 'account_manager', 'admin')
        )
    );

-- DELETE: Only team_leader, account_manager, admin can delete
DROP POLICY IF EXISTS "Leaders and admins can delete assignments" ON public.client_assignments;
CREATE POLICY "Leaders and admins can delete assignments"
    ON public.client_assignments FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('team_leader', 'account_manager', 'admin')
        )
    );

-- UPDATE: Only team_leader, account_manager, admin can update
DROP POLICY IF EXISTS "Leaders and admins can update assignments" ON public.client_assignments;
CREATE POLICY "Leaders and admins can update assignments"
    ON public.client_assignments FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('team_leader', 'account_manager', 'admin')
        )
    );
