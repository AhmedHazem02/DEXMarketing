# خطة ميزة "Forward to Designer" — تحويل التاسك من Account Manager للمصمم

## الملخص

بعد ما الـ Creator يسلّم التاسك والـ Account Manager يعتمدها (Approve)، يقدر الـ Account Manager يعمل **Forward** (اختياري) للتاسك لأي **Designer** في نفس التيم.

**الطريقة:** Clone كامل للتاسك بنفس كل البيانات — نغيّر بس الـ `id` + `assigned_to` + `status`. التاسكين **مستقلين تماماً** — مفيش ربط بينهم.

العميل يشوف التاسك الجديدة تلقائي في الداشبورد بتاعه (لأن `client_id` بيتنسخ).

---

## الفلو الكامل

> **ملاحظة:** الفلو كله بيتم عن طريق الـ Account Manager — مفيش تدخل للـ Team Leader.

```
1. Account Manager ➜ ينشئ تاسك ويعيّنها لـ Creator
2. Creator ➜ يشتغل عليها ويعمل Upload للملفات ➜ يسلّمها (status → review)
3. Account Manager ➜ يراجع التاسك:
   a. يقدر يعتمدها (Approve) ✅
   b. يقدر يرجعها للتعديل (Return for Revision) 🔄
   c. ✨ [جديد] بعد الاعتماد ➜ زرار "Forward to Designer" يظهر
4. ✨ [جديد] Account Manager يختار Designer من التيم ➜ يضغط Forward
5. ✨ [جديد] يتم عمل Clone كامل للتاسك:
   - id: جديد (auto-generated)
   - assigned_to: الـ Designer المختار
   - status: new
   - كل الباقي: نسخة طبق الأصل (client_id, project_id, priority, description, etc.)
   - المرفقات: تتنسخ (Reference — نفس الـ file URLs)
   - التاسك الأصلية: تفضل approved ومستقلة تماماً
6. ✨ [جديد] التاسك تظهر عند الـ Designer + عند العميل كتاسك جديدة مستقلة
```

### مقارنة: Clone vs الخطة القديمة

| البند | الخطة القديمة | Clone (الخطة الجديدة) |
|-------|--------------|----------------------|
| **طريقة الإنشاء** | ننسخ حقول يدوي واحد واحد | Clone كامل + تغيير 3 حقول بس |
| **`client_id`** | سؤال مفتوح (ينتقل ولا لا) | بيتنقل تلقائي ✅ |
| **ظهور عند العميل** | محتاج logic إضافي | تلقائي (نفس `client_id`) ✅ |
| **ربط بين التاسكين** | `original_task_id` | ❌ مفيش ربط — مستقلين |
| **الكود** | ~50 سطر hook | ~30 سطر hook |
| **التعقيد** | عالي | بسيط جداً |

---

## التغييرات المطلوبة

### 1. Database / Types

#### 1.1 جدول `tasks` — لا يحتاج تعديل ✅
- مفيش حقول جديدة
- مفيش `original_task_id` — التاسكين مستقلين
- مفيش `forwarded_by` أو `forwarded_at`

#### 1.2 جدول `attachments` — لا يحتاج تعديل ✅
- المرفقات هتتنسخ كصفوف جديدة بنفس الـ `file_url` (Reference — مفيش ملفات جديدة في Storage)

#### 1.3 Types — Fix بسيط مطلوب
في `src/types/task.ts` الـ `CONTENT_ROLES` ناقصها `designer`:
```typescript
// قبل:
export const CONTENT_ROLES = ['creator'] as const

// بعد:
export const CONTENT_ROLES = ['creator', 'designer'] as const
```

---

### 2. Backend / Hooks

#### 2.1 Hook جديد: `useForwardTask`
**ملف:** `src/hooks/use-tasks.ts`

```typescript
export function useForwardTask() {
  return useMutation({
    mutationFn: async ({
      task,              // التاسك الأصلية كاملة
      designerId,        // الـ Designer المختار
      notes,             // ملاحظات اختيارية من الـ AM
      accountManagerId,  // الـ AM اللي عمل Forward
    }) => {
      // ─── Step 1: Clone التاسك ───
      // نسخة طبق الأصل — نغيّر 3 حقول بس
      const clonedTask = {
        title:          task.title,
        description:    notes
          ? `🔀 Notes: ${notes}\n───────────────────\n${task.description || ''}`
          : task.description,
        project_id:     task.project_id,
        client_id:      task.client_id,       // ← بيتنقل تلقائي
        priority:       task.priority,
        deadline:       task.deadline,
        department:     task.department,
        task_type:      task.task_type,
        company_name:   task.company_name,
        location:       task.location,

        // الحقول اللي بنغيّرها:
        assigned_to:    designerId,            // ← Designer بدل Creator
        status:         'new',                 // ← تاسك جديدة
        created_by:     accountManagerId,      // ← الـ AM
      }
      const newTask = await supabase.from('tasks').insert(clonedTask)

      // ─── Step 2: Clone المرفقات ───
      const attachments = await supabase.from('attachments')
        .select('*').eq('task_id', task.id)

      if (attachments.length > 0) {
        const clonedAttachments = attachments.map(att => ({
          task_id:     newTask.id,             // ← التاسك الجديدة
          file_url:    att.file_url,           // ← نفس الـ URL
          file_name:   att.file_name,
          file_type:   att.file_type,
          file_size:   att.file_size,
          uploaded_by: att.uploaded_by,
        }))
        await supabase.from('attachments').insert(clonedAttachments)
      }

      // ─── Step 3: Notification للـ Designer ───
      await supabase.from('notifications').insert({
        user_id: designerId,
        title:   'تم تحويل تاسك جديدة إليك',
        message: `Task: ${task.title}`,
        link:    '/creator',
      })

      return newTask
      // ملاحظة: التاسك الأصلية مش بنغيّر فيها حاجة خالص
    },
  })
}
```

#### 2.2 `useMyTasks` — لا يحتاج تعديل ✅
- الـ Designer هيشوف التاسك الجديدة تلقائي (لأن `assigned_to = designer_id`)
- العميل هيشوف التاسك تلقائي (لأن `client_id` نفسه)

---

### 3. UI Components

#### 3.1 تعديل `TaskDetails` Component
**ملف:** `src/components/tasks/task-details.tsx`

**التعديل:**
- إضافة prop جديد: `canForward?: boolean`
- لما التاسك حالتها `approved` + `canForward = true`:
  - يظهر زرار **"Forward to Designer"** 🎨
  - لما يدوس عليه → يفتح `ForwardToDesignerDialog`

**شروط ظهور الزرار:**
```typescript
const canShowForward = canForward && task.status === 'approved'
```

#### 3.2 Component جديد: `ForwardToDesignerDialog`
**ملف:** `src/components/tasks/forward-to-designer-dialog.tsx`

```
┌─────────────────────────────────┐
│  🎨 Forward to Designer         │
│                                 │
│  Select Designer:               │
│  ┌─────────────────────────┐    │
│  │ 👤 Ahmed (Designer)     │    │
│  │ 👤 Sara (Designer)      │    │
│  │ 👤 Mohamed (Designer)   │    │
│  └─────────────────────────┘    │
│                                 │
│  Notes (optional):              │
│  ┌─────────────────────────┐    │
│  │                         │    │
│  └─────────────────────────┘    │
│                                 │
│  [Cancel]        [Forward ➜]    │
└─────────────────────────────────┘
```

- Props:
  - `open: boolean`
  - `onOpenChange: (open: boolean) => void`
  - `task: TaskWithRelations`
  - `accountManagerId: string`
  - `onSuccess: () => void`

- Logic:
  - يجيب Designers من `useTeamMembers` مفلتر بـ `role === 'designer'`
  - لو مفيش designers → رسالة "لا يوجد مصممين في الفريق"
  - زرار Forward يكون `disabled` أثناء الـ mutation (`isPending`)

#### 3.3 تعديل `AccountManagerDashboard`
**ملف:** `src/app/[locale]/(dashboard)/account-manager/page.tsx`

- إضافة `canForward={true}` للـ `TaskDetails`

#### 3.4 عند العميل — مفيش تعديل
التاسكين بيظهروا بالحالة المختلفة:
```
┌────────────────────────────────────────────────────┐
│ 📋 My Tasks (Client Dashboard)                     │
│                                                    │
│ ✅ تصميم بوست رمضان  [Approved]  ← Creator خلّص  │
│ 🆕 تصميم بوست رمضان  [New]      ← Designer بيشتغل│
└────────────────────────────────────────────────────┘
```
الـ status badge كفاية للتفريق — مفيش UI إضافي مطلوب.

---

### 4. RLS (Row-Level Security) — Migrations مطلوبة

#### 4.1 Tasks INSERT — موجود ✅
```sql
-- FIX_ACCOUNT_MANAGER_TASKS_RLS.sql (applied already)
-- is_team_leader_or_admin() includes 'account_manager'
```

#### 4.2 Attachments INSERT — ⚠️ محتاج migration
```sql
CREATE POLICY "Leaders can insert attachments" ON public.attachments
    FOR INSERT WITH CHECK (public.is_team_leader_or_admin());
```

#### 4.3 Notifications INSERT — ⚠️ محتاج migration
```sql
CREATE POLICY "Leaders can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (public.is_team_leader_or_admin());
```

---

### 5. ملفات التعديل (ملخص)

| # | ملف | نوع التعديل |
|---|------|-------------|
| 1 | `src/types/task.ts` | Fix `CONTENT_ROLES` — إضافة `designer` |
| 2 | `src/hooks/use-tasks.ts` | إضافة `useForwardTask` hook |
| 3 | `src/components/tasks/forward-to-designer-dialog.tsx` | **ملف جديد** |
| 4 | `src/components/tasks/task-details.tsx` | إضافة زرار Forward + prop `canForward` |
| 5 | `src/components/tasks/index.ts` | Export الـ component الجديد |
| 6 | `src/app/[locale]/(dashboard)/account-manager/page.tsx` | إضافة `canForward={true}` |
| 7 | `supabase/migration_forward_task.sql` | RLS policies (attachments + notifications) |

---

### 6. القرارات النهائية

| # | السؤال | القرار |
|---|--------|--------|
| 1 | هل التاسكين مرتبطين؟ | ❌ لا — مستقلين تماماً |
| 2 | هل `client_id` بيتنقل؟ | ✅ نعم — clone كامل |
| 3 | هل العميل يشوف التاسك الجديدة؟ | ✅ تلقائي (نفس `client_id`) |
| 4 | هل في حقول DB جديدة؟ | ❌ لا — صفر تعديلات على schema |
| 5 | هل التاسك الأصلية بتتغيّر؟ | ❌ لا — تفضل `approved` كما هي |
| 6 | هل Chain Forwarding مسموح؟ | ❌ لا — Forward فقط على `approved` tasks |
| 7 | هل الـ Forward في الـ Schedule؟ | ❌ لا — Tasks فقط |
| 8 | هل الـ Designer عنده route مختلف؟ | ❌ لا — بيستخدم `/creator` |
| 9 | المرفقات تتنسخ إزاي؟ | Reference — نفس الـ URL (مفيش ملفات جديدة) |

---

### 7. تحليل الثغرات والحلول

#### 🔴 ثغرة #1: Auto-Reroute `approved` → `client_review`
- **المشكلة:** `useUpdateTaskStatus` (Kanban) بيحوّل `approved` لـ `client_review` لو في `client_id`
- **الأثر:** لو استخدم الـ Kanban بدل زرار Approve، الحالة مش هتوصل `approved`
- **الحل:** زرار Approve في `TaskDetails` بيستخدم `useUpdateTask` (مفيهوش auto-reroute) ✅
- **حماية إضافية:** زرار Forward يظهر **فقط** لما `status === 'approved'`

#### 🔴 ثغرة #2: RLS Attachments INSERT
- **المشكلة:** Account Manager مش يقدر يعمل INSERT في `attachments`
- **الحل:** Migration SQL يضيف policy ✅

#### 🟡 ثغرة #3: `CONTENT_ROLES` ناقصها `designer`
- **الحل:** إضافة `'designer'` في الـ array ✅

#### 🟡 ثغرة #4: Race Condition — Forward مزدوج
- **المشكلة:** ضغطتين Forward = تاسكين
- **الحل:** Disable الزرار أثناء `isPending` + بعد الـ Forward → قفل الـ Dialog + toast success ✅

#### 🟡 ثغرة #5: صفر Designers في التيم
- **الحل:** رسالة واضحة "لا يوجد مصممين" + disable الزرار ✅

#### 🟡 ثغرة #6: Notification INSERT RLS
- **الحل:** Migration SQL يضيف policy للـ `is_team_leader_or_admin()` ✅

---

### 8. تقدير الوقت

| مرحلة | الوقت المقدر |
|-------|-------------|
| Fix `CONTENT_ROLES` | 2 دقيقة |
| `useForwardTask` hook | 20 دقيقة |
| `ForwardToDesignerDialog` component | 40 دقيقة |
| تعديل `TaskDetails` | 15 دقيقة |
| تعديل Account Manager page | 5 دقيقة |
| Export في `index.ts` | 2 دقيقة |
| Migration SQL (RLS) | 10 دقيقة |
| **المجموع** | **~1.5 ساعة** |

---

## خطوات التنفيذ

1. **Fix** `CONTENT_ROLES` في `src/types/task.ts`
2. إنشاء `useForwardTask` hook في `src/hooks/use-tasks.ts`
3. إنشاء `ForwardToDesignerDialog` في `src/components/tasks/`
4. تعديل `TaskDetails` — إضافة `canForward` prop + زرار Forward
5. Export الـ component في `src/components/tasks/index.ts`
6. تعديل `account-manager/page.tsx` — إضافة `canForward={true}`
7. إنشاء `supabase/migration_forward_task.sql` — RLS policies
