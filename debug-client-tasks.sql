-- ============================================
-- Debug Script: Client Task Review Workflow
-- ============================================
-- افتح Supabase Dashboard > SQL Editor > نفذ هذا الكود
-- لو كنت مسجل دخول كـ Client، القيمة auth.uid() هترجع user_id تبعك

-- 📋 1. معلومات اليوزر الحالي (المسجل دخول)
SELECT 
    '👤 Current User Info' as "=== Section ===",
    auth.uid() as your_user_id;

-- 📋 2. فحص الـ Client Profile للمستخدم الحالي
SELECT 
    '🏢 Your Client Profile' as "=== Section ===",
    c.id as client_id,
    c.name as client_name,
    c.company,
    c.user_id,
    c.email
FROM clients c
WHERE c.user_id = auth.uid();

-- 📋 3. فحص الـ Enum Values (جميع حالات المهام)
SELECT 
    '📊 Task Status Values' as "=== Section ===",
    enumlabel as status_value,
    enumsortorder as sort_order
FROM pg_enum 
WHERE enumtypid = 'task_status'::regtype
ORDER BY enumsortorder;

-- 📋 4. فحص جميع المهام المرتبطة بالـ Client ID
SELECT 
    '📝 Tasks with Your Client ID' as "=== Section ===",
    t.id,
    t.title,
    t.status::text as current_status,
    t.client_id,
    c.name as client_name,
    t.created_at,
    t.updated_at
FROM tasks t
LEFT JOIN clients c ON t.client_id = c.id
WHERE t.client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
ORDER BY t.updated_at DESC;

-- 📋 5. المهام في حالة Client Review للعميل الحالي
SELECT 
    '✅ Tasks in Client Review Status' as "=== Section ===",
    t.id,
    t.title,
    t.status::text,
    t.client_id,
    c.name as client_name,
    t.updated_at
FROM tasks t
JOIN clients c ON t.client_id = c.id
WHERE t.status = 'client_review'
    AND c.user_id = auth.uid();

-- 📋 6. فحص RLS Policies على جدول tasks
SELECT 
    '🔒 RLS Policies on Tasks Table' as "=== Section ===",
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'tasks'
    AND policyname LIKE '%client%'
ORDER BY policyname;

-- 📋 7. إحصائيات عامة
SELECT 
    '📈 General Statistics' as "=== Section ===",
    (SELECT count(*) FROM clients) as total_clients,
    (SELECT count(*) FROM tasks WHERE client_id IS NOT NULL) as tasks_with_client,
    (SELECT count(*) FROM tasks WHERE status = 'client_review') as tasks_in_review;
