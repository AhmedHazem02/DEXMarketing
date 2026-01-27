-- Run this in Supabase SQL Editor to fix the issue where clients cannot see their dashboard

-- 1. Check if RLS is enabled (It is by default in schema, but good to ensure)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- 2. Add Policy for Client to see their own profile
-- This matches the user_id column in clients table with the authenticated user's ID
CREATE POLICY "Clients can view own profile" ON public.clients
  FOR SELECT USING (auth.uid() = user_id);

-- 3. Add Policy for Admins/Staff to manage clients
CREATE POLICY "Staff can manage clients" ON public.clients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'team_leader', 'accountant')
    )
  );

-- 4. Fix Projects Visibility for Clients (If missing)
CREATE POLICY "Clients can view own projects" ON public.projects
  FOR SELECT USING (
    client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
  );
