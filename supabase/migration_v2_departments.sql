-- ============================================
-- DEX ERP v2 - Department System Migration
-- Photography Department + Chat System
-- ============================================
-- Run this in Supabase SQL Editor AFTER the initial schema.sql

-- ============================================
-- 1. NEW ENUMS
-- ============================================

-- Department enum
CREATE TYPE department AS ENUM ('photography', 'content');

-- Task type enum  
CREATE TYPE task_type AS ENUM ('video', 'photo', 'editing', 'content', 'general');

-- Workflow stage for photography pipeline
CREATE TYPE workflow_stage AS ENUM (
  -- Video workflow
  'filming',           -- Assigned to videographer
  'filming_done',      -- Videographer marked complete
  'editing',           -- Assigned to editor (monteur)
  'editing_done',      -- Editor finished
  'final_review',      -- TL reviewing final
  -- Photo workflow  
  'shooting',          -- Assigned to photographer
  'shooting_done',     -- Photographer marked complete
  -- Shared final stages
  'delivered',         -- Sent to client
  -- Content workflow uses task_status, no workflow_stage needed
  'none'               -- Default for content department tasks
);

-- Schedule status
CREATE TYPE schedule_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');

-- Message type
CREATE TYPE message_type AS ENUM ('text', 'image', 'file');

-- ============================================
-- 2. ADD department TO user_role ENUM
-- ============================================

-- Add new roles to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'videographer';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'editor';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'photographer';

-- ============================================
-- 3. ALTER EXISTING TABLES
-- ============================================

-- Add department column to users
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS department department;

-- Add department, task_type, workflow_stage, editor_id to tasks
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS department department,
  ADD COLUMN IF NOT EXISTS task_type task_type DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS workflow_stage workflow_stage DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS editor_id UUID REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS scheduled_date DATE,
  ADD COLUMN IF NOT EXISTS scheduled_time TIME;

-- Add department to projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS department department;

-- ============================================
-- 4. SCHEDULES TABLE (Photography Calendar)
-- ============================================
CREATE TABLE IF NOT EXISTS public.schedules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  department department DEFAULT 'photography',
  team_leader_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  location TEXT,
  status schedule_status DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ============================================
-- 5. CONVERSATIONS TABLE (Chat System)
-- ============================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  department department,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ============================================
-- 6. CONVERSATION PARTICIPANTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(conversation_id, user_id)
);

-- ============================================
-- 7. MESSAGES TABLE (Real-time Chat)
-- ============================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT,
  message_type message_type DEFAULT 'text',
  file_url TEXT,
  file_name TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- 8. RLS - Enable on new tables
-- ============================================
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 9. HELPER FUNCTIONS
-- ============================================

-- Check if user is in photography department
CREATE OR REPLACE FUNCTION public.is_photography_team()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND (
      role IN ('videographer', 'editor', 'photographer')
      OR (role = 'team_leader' AND department = 'photography')
      OR role = 'admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is in content department
CREATE OR REPLACE FUNCTION public.is_content_team()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND (
      role = 'creator'
      OR (role = 'team_leader' AND department = 'content')
      OR role = 'admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is a conversation participant
CREATE OR REPLACE FUNCTION public.is_conversation_participant(conv_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = conv_id AND user_id = auth.uid()
  ) OR public.is_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- 10. RLS POLICIES - Schedules
-- ============================================

-- Photography TL can manage their own schedules
CREATE POLICY "TL can manage own schedules" ON public.schedules
  FOR ALL USING (
    auth.uid() = team_leader_id 
    OR public.is_admin()
  );

-- Photography team members can view schedules they're assigned to
CREATE POLICY "Photography team can view schedules" ON public.schedules
  FOR SELECT USING (
    public.is_photography_team()
    OR public.is_admin()
  );

-- ============================================
-- 11. RLS POLICIES - Conversations
-- ============================================

CREATE POLICY "Participants can view conversations" ON public.conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = id AND user_id = auth.uid()
    )
    OR public.is_admin()
  );

CREATE POLICY "TL and Admin can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (
    public.is_team_leader_or_admin()
  );

CREATE POLICY "Participants can update conversations" ON public.conversations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = id AND user_id = auth.uid()
    )
    OR public.is_admin()
  );

-- ============================================
-- 12. RLS POLICIES - Conversation Participants
-- ============================================

CREATE POLICY "View own participation" ON public.conversation_participants
  FOR SELECT USING (
    user_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "TL and Admin can add participants" ON public.conversation_participants
  FOR INSERT WITH CHECK (
    public.is_team_leader_or_admin()
  );

-- ============================================
-- 13. RLS POLICIES - Messages
-- ============================================

CREATE POLICY "Participants can view messages" ON public.messages
  FOR SELECT USING (
    public.is_conversation_participant(conversation_id)
  );

CREATE POLICY "Participants can send messages" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND public.is_conversation_participant(conversation_id)
  );

CREATE POLICY "Sender can update own messages" ON public.messages
  FOR UPDATE USING (
    auth.uid() = sender_id
    OR public.is_admin()
  );

-- ============================================
-- 14. UPDATE TASKS POLICIES for new roles
-- ============================================

-- Drop old task policies to recreate with new roles
DROP POLICY IF EXISTS "Users can view assigned tasks" ON public.tasks;
DROP POLICY IF EXISTS "Task owners can update" ON public.tasks;

-- Recreated: Users can view tasks they're assigned to, created, or are team leads/admin
CREATE POLICY "Users can view assigned tasks" ON public.tasks
  FOR SELECT USING (
    auth.uid() = assigned_to 
    OR auth.uid() = created_by
    OR auth.uid() = editor_id
    OR public.is_team_leader_or_admin()
  );

-- Recreated: Task owners + editor can update
CREATE POLICY "Task owners can update" ON public.tasks
  FOR UPDATE USING (
    auth.uid() = assigned_to
    OR auth.uid() = created_by
    OR auth.uid() = editor_id
    OR public.is_team_leader_or_admin()
  );

-- ============================================
-- 15. INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_tasks_department ON public.tasks(department);
CREATE INDEX IF NOT EXISTS idx_tasks_task_type ON public.tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_tasks_workflow_stage ON public.tasks(workflow_stage);
CREATE INDEX IF NOT EXISTS idx_tasks_editor_id ON public.tasks(editor_id);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_date ON public.tasks(scheduled_date);

CREATE INDEX IF NOT EXISTS idx_users_department ON public.users(department);
CREATE INDEX IF NOT EXISTS idx_users_role_dept ON public.users(role, department);

CREATE INDEX IF NOT EXISTS idx_schedules_tl ON public.schedules(team_leader_id);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON public.schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_schedules_status ON public.schedules(status);

CREATE INDEX IF NOT EXISTS idx_conversations_last_msg ON public.conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conv_participants_user ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conv_participants_conv ON public.conversation_participants(conversation_id);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(conversation_id, is_read) WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_projects_department ON public.projects(department);

-- ============================================
-- 16. REALTIME SUBSCRIPTIONS for new tables
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.schedules;

-- ============================================
-- 17. TRIGGER: Update conversation last_message_at
-- ============================================
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations 
  SET last_message_at = NEW.created_at, 
      updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE PROCEDURE public.update_conversation_last_message();

-- ============================================
-- 18. TRIGGER: Auto-create notification on message
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  participant RECORD;
  sender_name TEXT;
BEGIN
  -- Get sender name
  SELECT name INTO sender_name FROM public.users WHERE id = NEW.sender_id;
  
  -- Notify all participants except sender
  FOR participant IN
    SELECT user_id FROM public.conversation_participants
    WHERE conversation_id = NEW.conversation_id AND user_id != NEW.sender_id
  LOOP
    INSERT INTO public.notifications (user_id, title, message, link)
    VALUES (
      participant.user_id,
      'رسالة جديدة من ' || COALESCE(sender_name, 'مستخدم'),
      LEFT(NEW.content, 100),
      '/chat/' || NEW.conversation_id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_message_notify
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE PROCEDURE public.notify_new_message();

-- ============================================
-- 19. TRIGGER: Auto-create notification on task assignment
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_task_assignment()
RETURNS TRIGGER AS $$
DECLARE
  creator_name TEXT;
BEGIN
  -- Only notify on new assignment or reassignment
  IF (TG_OP = 'INSERT' AND NEW.assigned_to IS NOT NULL) 
     OR (TG_OP = 'UPDATE' AND NEW.assigned_to IS DISTINCT FROM OLD.assigned_to AND NEW.assigned_to IS NOT NULL) 
  THEN
    SELECT name INTO creator_name FROM public.users WHERE id = NEW.created_by;
    
    INSERT INTO public.notifications (user_id, title, message, link)
    VALUES (
      NEW.assigned_to,
      'مهمة جديدة',
      'تم تعيين مهمة "' || NEW.title || '" لك بواسطة ' || COALESCE(creator_name, 'المدير'),
      CASE 
        WHEN NEW.department = 'photography' THEN '/task/' || NEW.id
        ELSE '/creator'
      END
    );
  END IF;
  
  -- Notify editor if assigned
  IF (TG_OP = 'UPDATE' AND NEW.editor_id IS DISTINCT FROM OLD.editor_id AND NEW.editor_id IS NOT NULL) THEN
    INSERT INTO public.notifications (user_id, title, message, link)
    VALUES (
      NEW.editor_id,
      'مهمة مونتاج جديدة',
      'تم تعيين مهمة مونتاج "' || NEW.title || '" لك',
      '/editor'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_task_assigned
  AFTER INSERT OR UPDATE ON public.tasks
  FOR EACH ROW EXECUTE PROCEDURE public.notify_task_assignment();

-- ============================================
-- 20. TRIGGER: Notify TL on workflow stage change
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_workflow_change()
RETURNS TRIGGER AS $$
DECLARE
  worker_name TEXT;
  tl_id UUID;
BEGIN
  -- Only fire when workflow_stage actually changes
  IF TG_OP = 'UPDATE' AND NEW.workflow_stage IS DISTINCT FROM OLD.workflow_stage THEN
    tl_id := NEW.created_by;
    
    -- When stage moves to *_done, notify the TL
    IF NEW.workflow_stage IN ('filming_done', 'editing_done', 'shooting_done') THEN
      SELECT name INTO worker_name FROM public.users WHERE id = NEW.assigned_to;
      
      INSERT INTO public.notifications (user_id, title, message, link)
      VALUES (
        tl_id,
        'تم إنجاز مهمة',
        COALESCE(worker_name, 'عضو الفريق') || ' أنهى العمل على "' || NEW.title || '"',
        '/team-leader'
      );
    END IF;
    
    -- When delivered to client, notify client via project
    IF NEW.workflow_stage = 'delivered' AND NEW.project_id IS NOT NULL THEN
      INSERT INTO public.notifications (
        user_id, title, message, link
      )
      SELECT 
        c.user_id,
        'تسليم جديد',
        'تم تسليم "' || NEW.title || '" - يرجى المراجعة',
        '/client'
      FROM public.projects p
      JOIN public.clients c ON c.id = p.client_id
      WHERE p.id = NEW.project_id
      AND c.user_id IS NOT NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_workflow_change
  AFTER UPDATE ON public.tasks
  FOR EACH ROW EXECUTE PROCEDURE public.notify_workflow_change();

-- ============================================
-- 21. Update handle_new_user for department
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  u_role public.user_role;
  u_dept public.department;
BEGIN
  -- Safely determine role
  BEGIN
    u_role := COALESCE((new.raw_user_meta_data->>'role')::public.user_role, 'client'::public.user_role);
  EXCEPTION WHEN OTHERS THEN
    u_role := 'client'::public.user_role;
  END;

  -- Safely determine department
  BEGIN
    u_dept := (new.raw_user_meta_data->>'department')::public.department;
  EXCEPTION WHEN OTHERS THEN
    u_dept := NULL;
  END;

  -- Insert into public.users
  INSERT INTO public.users (id, email, name, role, department)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    u_role,
    u_dept
  );
  
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
