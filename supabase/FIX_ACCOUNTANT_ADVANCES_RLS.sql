-- Fix: Allow accountant role full access to advances and advance_recipients tables
-- This mirrors the admin's permissions so accountants can manage advances just like admins.

-- ── advance_recipients ───────────────────────────────────────────────────────

-- Drop existing admin-only policies and recreate them to include accountant
DROP POLICY IF EXISTS "Admin can view all advance_recipients" ON public.advance_recipients;
DROP POLICY IF EXISTS "Admin can insert advance_recipients" ON public.advance_recipients;
DROP POLICY IF EXISTS "Admin can delete advance_recipients" ON public.advance_recipients;

-- Allow admin and accountant to SELECT
CREATE POLICY "Admin and accountant can view all advance_recipients"
  ON public.advance_recipients FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'accountant')
    )
  );

-- Allow admin and accountant to INSERT
CREATE POLICY "Admin and accountant can insert advance_recipients"
  ON public.advance_recipients FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'accountant')
    )
  );

-- Allow admin and accountant to DELETE
CREATE POLICY "Admin and accountant can delete advance_recipients"
  ON public.advance_recipients FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'accountant')
    )
  );

-- ── advances ─────────────────────────────────────────────────────────────────

-- Drop existing admin-only policies and recreate them to include accountant
DROP POLICY IF EXISTS "Admin can view all advances" ON public.advances;
DROP POLICY IF EXISTS "Admin can insert advances" ON public.advances;
DROP POLICY IF EXISTS "Admin can delete advances" ON public.advances;
DROP POLICY IF EXISTS "Admin can update advances" ON public.advances;

-- Allow admin and accountant to SELECT
CREATE POLICY "Admin and accountant can view all advances"
  ON public.advances FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'accountant')
    )
  );

-- Allow admin and accountant to INSERT
CREATE POLICY "Admin and accountant can insert advances"
  ON public.advances FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'accountant')
    )
  );

-- Allow admin and accountant to DELETE
CREATE POLICY "Admin and accountant can delete advances"
  ON public.advances FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'accountant')
    )
  );

-- Allow admin and accountant to UPDATE
CREATE POLICY "Admin and accountant can update advances"
  ON public.advances FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'accountant')
    )
  );
