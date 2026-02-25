-- Migration V11: Advance Recipients
CREATE TABLE IF NOT EXISTS public.advance_recipients (id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, name TEXT NOT NULL, recipient_type advance_recipient_type NOT NULL DEFAULT 'employee', created_by UUID REFERENCES public.users(id) ON DELETE SET NULL, created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL);
CREATE INDEX IF NOT EXISTS idx_advance_recipients_created_at ON public.advance_recipients(created_at DESC);
ALTER TABLE public.advances ADD COLUMN IF NOT EXISTS recipient_id UUID REFERENCES public.advance_recipients(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_advances_recipient_id ON public.advances(recipient_id);
ALTER TABLE public.advance_recipients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin can view all advance_recipients" ON public.advance_recipients;
DROP POLICY IF EXISTS "Admin can insert advance_recipients" ON public.advance_recipients;
DROP POLICY IF EXISTS "Admin can delete advance_recipients" ON public.advance_recipients;
CREATE POLICY "Admin can view all advance_recipients" ON public.advance_recipients FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "Admin can insert advance_recipients" ON public.advance_recipients FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "Admin can delete advance_recipients" ON public.advance_recipients FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));