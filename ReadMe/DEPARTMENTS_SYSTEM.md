# نظام الأقسام - DEX ERP v2

## نظرة عامة

تم إضافة نظام أقسام كامل يدعم قسمين رئيسيين:

| القسم | Department | الأدوار |
|-------|-----------|--------|
| قسم التصوير | `photography` | مصور فيديو، مونتير، مصور فوتوغرافي، قائد فريق تصوير |
| قسم المحتوى | `content` | صانع محتوى، قائد فريق محتوى |

**الأدوار المشتركة** (لا تنتمي لقسم محدد): مدير `admin`، محاسب `accountant`، عميل `client`

---

## 1. تشغيل Migration قاعدة البيانات

```sql
-- شغّل هذا الملف على Supabase SQL Editor
-- الملف: supabase/migration_v2_departments.sql
```

**ما يفعله الـ Migration:**
- إضافة أنواع جديدة: `department`, `task_type`, `workflow_stage`, `schedule_status`, `message_type`
- إضافة أدوار جديدة لـ `user_role`: `videographer`, `editor`, `photographer`
- إضافة عمود `department` لجداول `users`, `tasks`, `projects`
- إنشاء جداول جديدة: `schedules`, `conversations`, `conversation_participants`, `messages`
- إضافة RLS policies وـ triggers وـ indexes

**بعد تشغيل الـ Migration:**
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts
```

---

## 2. الأدوار والصلاحيات

### جدول الأدوار الكامل

| الدور | Role | القسم | المسار | الوصف |
|------|------|-------|--------|------|
| مدير | `admin` | مشترك | `/admin` | إدارة كاملة للنظام |
| محاسب | `accountant` | مشترك | `/accountant` | إدارة الخزينة |
| قائد فريق | `team_leader` | تصوير أو محتوى | `/team-leader` | إدارة المهام + جدولة + شات (تصوير) |
| صانع محتوى | `creator` | محتوى | `/creator` | تنفيذ مهام المحتوى |
| مصور فيديو | `videographer` | تصوير | `/videographer` | تصوير الفيديو |
| مونتير | `editor` | تصوير | `/editor` | مونتاج الفيديو |
| مصور فوتوغرافي | `photographer` | تصوير | `/photographer` | التصوير الفوتوغرافي |
| عميل | `client` | — | `/client` | متابعة المشاريع + شات مع TL |

### إضافة مستخدم جديد

من لوحة الأدمن ← المستخدمين ← "إضافة عضو":

```
الاسم: أحمد
البريد: ahmed@dex.com
كلمة المرور: ******
الدور: مصور فيديو    ← يتم تعيين القسم تلقائياً (تصوير)
```

> **ملاحظة:** عند اختيار "قائد فريق" يظهر حقل إضافي لاختيار القسم (تصوير / محتوى)

### تحديد القسم التلقائي

| الدور | القسم التلقائي |
|------|---------------|
| `videographer` | `photography` |
| `editor` | `photography` |
| `photographer` | `photography` |
| `creator` | `content` |
| `team_leader` | يُختار يدوياً |
| `admin`, `accountant`, `client` | `null` (مشترك) |

---

## 3. سير عمل التصوير (Photography Workflow)

### مراحل تصوير الفيديو

```
filming → filming_done → editing → editing_done → final_review → delivered
تصوير  ←  تم التصوير  ← مونتاج ←  تم المونتاج  ← مراجعة نهائية ← تم التسليم
```

### مراحل التصوير الفوتوغرافي

```
shooting → shooting_done → final_review → delivered
تصوير   ←   تم التصوير  ← مراجعة نهائية ← تم التسليم
```

### كيف يعمل سير العمل

1. **قائد فريق التصوير** ينشئ مهمة ويحدد نوعها (`video` أو `photo`)
2. المهمة تبدأ بمرحلة `filming` (فيديو) أو `shooting` (فوتو)
3. **المصور** يضغط "تم الانتهاء" ← تنتقل المهمة للمرحلة التالية
4. (فيديو فقط) **المونتير** يستلم المهمة في مرحلة `editing` ← يرفع الملفات ← يضغط "تم"
5. **قائد الفريق** يراجع ← يسلم للعميل

### استخدام الـ Hooks

```typescript
import {
  usePhotographyTasks,
  useEditorTasks,
  useAdvanceWorkflowStage,
  useMarkTaskComplete,
  useDeliverToClient,
  useCreatePhotographyTask,
} from '@/hooks'

// جلب مهام المصور الحالي
const { data: tasks } = usePhotographyTasks(userId)

// جلب مهام المونتاج
const { data: editingTasks } = useEditorTasks(userId)

// نقل المهمة للمرحلة التالية
const advance = useAdvanceWorkflowStage()
advance.mutate({
  taskId: 'xxx',
  currentStage: 'filming',
  taskType: 'video',
})

// إنشاء مهمة تصوير جديدة
const create = useCreatePhotographyTask()
create.mutate({
  title: 'تصوير إعلان شركة ABC',
  task_type: 'video',
  department: 'photography',
  assigned_to: videographerId,
  editor_id: editorId,            // المونتير (للفيديو)
  company_name: 'شركة ABC',
  location: 'الرياض',
  scheduled_date: '2026-02-10',
  scheduled_time: '14:00',
  project_id: projectId,
})
```

---

## 4. نظام الجدولة (Schedule System)

متاح لـ **قائد فريق التصوير** فقط عبر `/team-leader/schedule`

### الواجهة

- **عرض تقويم شهري** مع نقاط ملونة حسب حالة الموعد
- **عرض قائمة** مرتبة بالتاريخ
- **إنشاء / تعديل / حذف** مواعيد
- **تحديث الحالة** بضغطة زر

### حالات الجدولة

| الحالة | Status | اللون |
|--------|--------|------|
| مجدول | `scheduled` | أزرق |
| جاري | `in_progress` | أصفر |
| مكتمل | `completed` | أخضر |
| ملغي | `cancelled` | أحمر |

### استخدام الـ Hooks

```typescript
import {
  useCalendarSchedules,
  useCreateSchedule,
  useUpdateSchedule,
  useDeleteSchedule,
  useUpdateScheduleStatus,
} from '@/hooks'

// جلب مواعيد الشهر
const { data: schedules } = useCalendarSchedules(teamLeaderId, 2026, 2)

// إنشاء موعد جديد
const create = useCreateSchedule()
create.mutate({
  title: 'تصوير شركة XYZ',
  scheduled_date: '2026-02-15',
  start_time: '10:00',
  location: 'جدة - حي الروضة',
  company_name: 'شركة XYZ',
  team_leader_id: currentUserId,
  department: 'photography',
  notes: 'إحضار إضاءة إضافية',
})

// تحديث الحالة
const updateStatus = useUpdateScheduleStatus()
updateStatus.mutate({ id: scheduleId, status: 'completed' })
```

### المكون الجاهز

```tsx
import { ScheduleCalendar } from '@/components/schedule'

<ScheduleCalendar teamLeaderId={currentUser.id} />
```

---

## 5. نظام المحادثات (Chat System)

متاح لـ **قائد فريق التصوير** و**العميل**

### المسارات

| الدور | المسار | الوصف |
|------|--------|------|
| قائد فريق | `/team-leader/chat` | محادثات مع العملاء |
| عميل | `/client/chat` | محادثة مع قائد الفريق |

### الميزات

- **محادثة فورية (Real-time)** عبر Supabase Realtime
- **مؤشر كتابة** (typing indicator) عبر Supabase Presence
- **تمرير لا نهائي** للرسائل القديمة (50 رسالة في كل صفحة)
- **عداد الرسائل غير المقروءة** مع تحديث تلقائي
- **دعم الصور والملفات** (image, file, text)
- **علامة القراءة** (✓ مرسلة، ✓✓ مقروءة)
- **تصميم متجاوب** — يدعم الموبايل والديسكتوب

### استخدام الـ Hooks

```typescript
import {
  useConversations,
  useMessages,
  useSendMessage,
  useChatRealtime,
  useTypingIndicator,
  useFindOrCreateConversation,
  useUnreadCount,
} from '@/hooks'

// جلب المحادثات
const { data: conversations } = useConversations(userId)

// جلب الرسائل (infinite scroll)
const { data, fetchNextPage, hasNextPage } = useMessages(conversationId)

// إرسال رسالة
const send = useSendMessage()
send.mutate({
  conversation_id: convId,
  sender_id: userId,
  content: 'مرحباً، تم الانتهاء من التصوير',
  message_type: 'text',
})

// الاشتراك في الرسائل الفورية
useChatRealtime(conversationId, userId)

// مؤشر الكتابة
const { setTyping, getTypingUsers } = useTypingIndicator(convId, userId, userName)
setTyping(true)  // يظهر "يكتب..." للطرف الآخر

// إيجاد أو إنشاء محادثة بين شخصين
const findOrCreate = useFindOrCreateConversation()
const result = await findOrCreate.mutateAsync({
  userId: currentUserId,
  otherUserId: clientId,
})

// عداد الرسائل غير المقروءة
const { data: unread } = useUnreadCount(userId)
```

### المكون الجاهز

```tsx
import { ChatLayout } from '@/components/chat'

// يعرض قائمة المحادثات + نافذة الشات
<ChatLayout userId={currentUser.id} userName={currentUser.name} />
```

---

## 6. التوجيه وحماية المسارات

### كيف تعمل حماية المسارات

الـ Layout في `src/app/[locale]/(dashboard)/layout.tsx` يفحص:

1. هل المستخدم مسجل دخول؟ ← إذا لا → redirect `/login`
2. يجلب `role` و `department` من جدول `users`
3. يقارن المسار الحالي مع المسارات المسموحة للدور
4. إذا دور غير مسموح ← redirect للصفحة الرئيسية الخاصة بدوره

```typescript
// مثال: مصور فيديو يحاول الدخول لـ /admin
// النتيجة: redirect → /videographer

const ROLE_PATH_MAP = {
  admin: ['/admin'],
  videographer: ['/videographer'],
  editor: ['/editor'],
  photographer: ['/photographer'],
  team_leader: ['/team-leader'],
  creator: ['/creator'],
  client: ['/client'],
  accountant: ['/accountant'],
}
```

> **ملاحظة:** الأدمن يمكنه الوصول لجميع المسارات.

### القائمة الجانبية (Sidebar)

القائمة تتغير تلقائياً حسب الدور والقسم:

```typescript
// قائد فريق تصوير يرى:
// ✅ لوحة المهام
// ✅ المراجعات
// ✅ جدول المواعيد    ← فقط لقسم التصوير
// ✅ مراسلة العملاء   ← فقط لقسم التصوير

// قائد فريق محتوى يرى:
// ✅ لوحة المهام
// ✅ المراجعات
// ❌ جدول المواعيد
// ❌ مراسلة العملاء
```

---

## 7. هيكل الملفات الجديدة

```
src/
├── types/
│   ├── database.ts          ← تحديث (أنواع + أدوار + أقسام)
│   ├── task.ts              ← تحديث (workflow stages)
│   ├── chat.ts              ← جديد
│   └── schedule.ts          ← جديد
├── hooks/
│   ├── use-users.ts         ← تحديث (useCurrentUser)
│   ├── use-tasks.ts         ← تحديث (photography hooks)
│   ├── use-chat.ts          ← جديد
│   ├── use-schedule.ts      ← جديد
│   └── index.ts             ← تحديث (exports)
├── components/
│   ├── chat/
│   │   ├── chat-layout.tsx  ← جديد (ChatLayout, ChatWindow, ConversationList)
│   │   └── index.ts
│   ├── schedule/
│   │   ├── schedule-calendar.tsx ← جديد (ScheduleCalendar)
│   │   └── index.ts
│   ├── admin/
│   │   ├── add-user-dialog.tsx   ← تحديث (أدوار + قسم)
│   │   └── users-table.tsx       ← تحديث (ألوان + تسميات)
│   ├── layout/
│   │   ├── sidebar.tsx           ← تحديث (department prop)
│   │   ├── mobile-sidebar.tsx    ← تحديث (department prop)
│   │   └── header.tsx            ← تحديث (department prop)
│   └── shared/
│       └── notifications-popover.tsx ← إصلاح (useCurrentUser)
├── lib/
│   ├── routes.tsx           ← تحديث (8 أدوار + department-aware)
│   └── actions/users.ts     ← تحديث (department support)
├── app/[locale]/(dashboard)/
│   ├── layout.tsx           ← تحديث (role-path map + department)
│   ├── videographer/page.tsx    ← جديد
│   ├── editor/page.tsx          ← جديد
│   ├── photographer/page.tsx    ← جديد
│   ├── team-leader/
│   │   ├── schedule/page.tsx    ← جديد
│   │   └── chat/page.tsx        ← جديد
│   └── client/
│       └── chat/page.tsx        ← جديد
└── i18n/messages/
    ├── en.json              ← تحديث (departments, roles, chat, schedule)
    └── ar.json              ← تحديث
```

---

## 8. الترجمة (i18n)

تم إضافة مفاتيح ترجمة جديدة في `en.json` و `ar.json`:

| القسم | المفاتيح |
|-------|---------|
| `departments` | `photography`, `content` |
| `roles` | جميع الأدوار الـ 8 |
| `dashboard` | `myTasks`, `schedule`, `messages`, `markDone`, `deliver`, ... |
| `chat` | `conversations`, `typeMessage`, `typing`, `today`, ... |
| `schedule` | `newSchedule`, `editSchedule`, `scheduled`, `completed`, ... |

---

## 9. بعد التثبيت - Checklist

- [ ] تشغيل `migration_v2_departments.sql` على Supabase
- [ ] تجديد أنواع Supabase: `npx supabase gen types typescript`
- [ ] إنشاء قائد فريق تصوير (team_leader + department: photography)
- [ ] إنشاء مصور فيديو ومونتير ومصور فوتوغرافي
- [ ] تفعيل Supabase Realtime على جداول `messages` و `conversations`
- [ ] اختبار سير العمل: إنشاء مهمة → تصوير → مونتاج → مراجعة → تسليم
- [ ] اختبار الشات بين قائد الفريق والعميل
- [ ] اختبار الجدولة (إنشاء + تعديل + تحديث حالة)

---

## 10. ملاحظات تقنية

### Supabase Realtime
الشات يعمل عبر قناتين:
- **INSERT subscription** على جدول `messages` — لاستلام الرسائل الجديدة فوراً
- **Presence** على القناة — لمؤشر "يكتب..." بين المستخدمين

### الأداء
- الرسائل تُحمّل بـ **infinite scroll** (50 رسالة/صفحة)
- المحادثات تُحدّث كل **30 ثانية** كـ fallback
- عداد الرسائل غير المقروءة يُحدّث كل **15 ثانية**
- الجداول مُفهرسة بشكل صحيح (indexes) للاستعلامات المتكررة

### الأمان (RLS)
- كل جدول جديد له Row Level Security policies
- المستخدم يرى فقط محادثاته ورسائله
- قائد الفريق يرى فقط جداوله
- الأدمن يرى كل شيء
