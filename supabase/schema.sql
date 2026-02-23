-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS TABLE (Extends Supabase Auth)
-- ============================================
CREATE TYPE user_role AS ENUM ('admin', 'accountant', 'team_leader', 'creator', 'client');

CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  role user_role DEFAULT 'client',
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger to create public.users on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'client')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================
-- 2. CLIENTS TABLE
-- ============================================
CREATE TABLE public.clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- 3. PROJECTS TABLE
-- ============================================
CREATE TYPE project_status AS ENUM ('active', 'completed', 'on_hold', 'cancelled');

CREATE TABLE public.projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  status project_status DEFAULT 'active',
  budget DECIMAL(12, 2),
  start_date DATE,
  end_date DATE,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- 4. TASKS TABLE
-- ============================================
CREATE TYPE task_status AS ENUM ('new', 'in_progress', 'review', 'revision', 'approved', 'rejected');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

CREATE TABLE public.tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status task_status DEFAULT 'new',
  priority task_priority DEFAULT 'medium',
  assigned_to UUID REFERENCES public.users(id),
  created_by UUID REFERENCES public.users(id),
  deadline TIMESTAMP WITH TIME ZONE,
  client_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ============================================
-- 5. ATTACHMENTS TABLE (Cloudinary Links)
-- ============================================
CREATE TABLE public.attachments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT,
  file_size BIGINT,
  is_final BOOLEAN DEFAULT false,
  uploaded_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- 6. COMMENTS TABLE
-- ============================================
CREATE TABLE public.comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- 7. TREASURY TABLE (Current Balance)
-- ============================================
CREATE TABLE public.treasury (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  current_balance DECIMAL(12, 2) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insert initial treasury record
INSERT INTO public.treasury (current_balance) VALUES (0);

-- ============================================
-- 8. TRANSACTIONS TABLE
-- ============================================
CREATE TYPE transaction_type AS ENUM ('income', 'expense');

CREATE TABLE public.transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type transaction_type NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT,
  category TEXT,
  receipt_url TEXT,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger to update treasury balance on transaction insert
CREATE OR REPLACE FUNCTION public.update_treasury_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'income' THEN
    UPDATE public.treasury 
    SET current_balance = current_balance + NEW.amount, 
        updated_at = now()
    WHERE id = (SELECT id FROM public.treasury LIMIT 1);
  ELSE
    UPDATE public.treasury 
    SET current_balance = current_balance - NEW.amount, 
        updated_at = now()
    WHERE id = (SELECT id FROM public.treasury LIMIT 1);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_transaction_created
  AFTER INSERT ON public.transactions
  FOR EACH ROW EXECUTE PROCEDURE public.update_treasury_balance();

-- ============================================
-- 9. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- 10. SITE SETTINGS TABLE
-- ============================================
CREATE TABLE public.site_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  type TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insert default theme settings
INSERT INTO public.site_settings (key, value, type) VALUES 
  ('theme', '{"primary": "#FFD700", "background": "#0A1628", "accent": "#00D4FF"}', 'theme'),
  ('site_name', '"DEX Advertising"', 'text'),
  ('site_logo', '"/images/logo.png"', 'text'),
  ('contact_phone', '"+20 123 456 7890"', 'contact'),
  ('contact_email', '"info@dex-advertising.com"', 'contact'),
  ('contact_address_ar', '"القاهرة، مصر"', 'contact'),
  ('contact_address_en', '"Cairo, Egypt"', 'contact'),
  ('social_facebook', '"https://facebook.com/dexadvertising"', 'social'),
  ('social_instagram', '"https://instagram.com/dexadvertising"', 'social'),
  ('social_twitter', '"https://twitter.com/dexadvertising"', 'social'),
  ('social_linkedin', '"https://linkedin.com/company/dexadvertising"', 'social');

-- ============================================
-- 11. PAGES TABLE (CMS)
-- ============================================
CREATE TABLE public.pages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title_en TEXT,
  title_ar TEXT,
  content_en JSONB,
  content_ar JSONB,
  is_published BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insert default pages
INSERT INTO public.pages (slug, title_en, title_ar, is_published) VALUES
  ('about', 'About Us', 'من نحن', true),
  ('contact', 'Contact Us', 'تواصل معنا', true),
  ('portfolio', 'Our Work', 'أعمالنا', true),
  ('team', 'Our Team', 'فريقنا', true);

-- ============================================
-- 12. TEAM MEMBERS TABLE (Public Page)
-- ============================================
CREATE TABLE public.team_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ar TEXT,
  position_en TEXT,
  position_ar TEXT,
  bio_en TEXT,
  bio_ar TEXT,
  photo_url TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- 13. PORTFOLIO TABLE (Public Page)
-- ============================================
CREATE TABLE public.portfolio (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title_en TEXT NOT NULL,
  title_ar TEXT,
  description_en TEXT,
  description_ar TEXT,
  images JSONB DEFAULT '[]',
  category TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- 14. ACTIVITY LOG TABLE
-- ============================================
CREATE TABLE public.activity_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- 15. STORAGE SETTINGS TABLE
-- ============================================
CREATE TABLE public.storage_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  auto_delete_months INT DEFAULT 0, -- 0 means never
  last_cleanup TIMESTAMP WITH TIME ZONE
);

-- Insert default storage settings
INSERT INTO public.storage_settings (auto_delete_months) VALUES (0);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treasury ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS POLICIES
-- ============================================
-- Users can view their own profile
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Admin can view all users (uses SECURITY DEFINER function to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE POLICY "Admin can view all users" ON public.users
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admin can manage users" ON public.users
  FOR ALL USING (public.is_admin());

-- ============================================
-- TASKS POLICIES
-- ============================================
-- Helper function for team leader check
CREATE OR REPLACE FUNCTION public.is_team_leader_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role IN ('admin', 'team_leader', 'account_manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper function for accountant check
CREATE OR REPLACE FUNCTION public.is_accountant_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role IN ('admin', 'accountant')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE POLICY "Users can view assigned tasks" ON public.tasks
  FOR SELECT USING (
    auth.uid() = assigned_to OR 
    auth.uid() = created_by OR
    public.is_team_leader_or_admin()
  );

CREATE POLICY "Team leaders can create tasks" ON public.tasks
  FOR INSERT WITH CHECK (public.is_team_leader_or_admin());

CREATE POLICY "Task owners can update" ON public.tasks
  FOR UPDATE USING (
    auth.uid() = assigned_to OR
    auth.uid() = created_by OR
    public.is_team_leader_or_admin()
  );

-- ============================================
-- TREASURY & TRANSACTIONS POLICIES
-- ============================================
CREATE POLICY "Only admin and accountant can view treasury" ON public.treasury
  FOR SELECT USING (public.is_accountant_or_admin());

CREATE POLICY "Only admin and accountant can view transactions" ON public.transactions
  FOR SELECT USING (public.is_accountant_or_admin());

CREATE POLICY "Accountant can create transactions" ON public.transactions
  FOR INSERT WITH CHECK (public.is_accountant_or_admin());

-- ============================================
-- NOTIFICATIONS POLICIES
-- ============================================
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- PUBLIC PAGES POLICIES (Readable by all)
-- ============================================
CREATE POLICY "Anyone can read published pages" ON public.pages
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admin can manage pages" ON public.pages
  FOR ALL USING (public.is_admin());

CREATE POLICY "Anyone can read team members" ON public.team_members
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can manage team members" ON public.team_members
  FOR ALL USING (public.is_admin());

CREATE POLICY "Anyone can read portfolio" ON public.portfolio
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage portfolio" ON public.portfolio
  FOR ALL USING (public.is_admin());

-- ============================================
-- SITE SETTINGS POLICIES
-- ============================================
CREATE POLICY "Anyone can read site settings" ON public.site_settings
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage site settings" ON public.site_settings
  FOR ALL USING (public.is_admin());

-- ============================================
-- STORAGE SETTINGS POLICIES
-- ============================================
CREATE POLICY "Admin can manage storage settings" ON public.storage_settings
  FOR ALL USING (public.is_admin());

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read);
CREATE INDEX idx_activity_log_user ON public.activity_log(user_id, created_at DESC);
CREATE INDEX idx_projects_client ON public.projects(client_id);
CREATE INDEX idx_attachments_task ON public.attachments(task_id);
CREATE INDEX idx_comments_task ON public.comments(task_id);

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
