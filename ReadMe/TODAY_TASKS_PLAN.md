# خطة: قسم "مهام اليوم" لأفراد التيم في قسم التصوير

## الهدف
عندما يقوم team leader بإنشاء **task** أو **schedule** لأحد أفراد تيمه (photographer / videographer)،
يظهر للفرد المعيّن قسم جديد في لوحة التحكم الخاصة به اسمه **"مهام اليوم"** يضم:
- المهام (tasks) التي `scheduled_date` = اليوم و`assigned_to` = هو
- الجلسات (schedules) التي `scheduled_date` = اليوم و userId ضمن `assigned_members[]`

---

## التحليل الحالي

### صفحات الأدوار المتأثرة
| الصفحة | المسار |
|--------|--------|
| Photographer | `src/app/[locale]/(dashboard)/photographer/page.tsx` |
| Videographer | `src/app/[locale]/(dashboard)/videographer/page.tsx` |

### المكونات الحالية
- **`RoleDashboard`** → `src/components/shared/role-dashboard.tsx`  
  يعرض المهام (tasks) فقط عبر `useMyTasks(userId)`.
- لا يوجد حالياً أي عرض للـ schedules في dashboard الفرد.

### Hooks الموجودة
| Hook | الملف | الغرض |
|------|-------|--------|
| `useMyTasks(userId)` | `use-tasks.ts` | جلب المهام المسندة للمستخدم |
| `useMySchedules(userId, year, month)` | `use-schedule.ts` | جلب الجلسات المرتبطة بالمستخدم (من خلال tasks.assigned_to) |

### مشكلة في `useMySchedules`
الـ hook الحالي يجلب based on `tasks.assigned_to` من خلال join مع tasks:
```sql
.eq('tasks.assigned_to', userId)
```
لكن الـ schedules تحتوي على `assigned_members: string[]` مباشرةً.
يجب إضافة hook جديد يجلب schedules حيث `userId` ضمن `assigned_members`.

---

## خطة التنفيذ

### الخطوة 1 — إضافة hook جديد في `use-schedule.ts`
**اسم الـ Hook:** `useTodayAssignedSchedules(userId)`

يجلب الجلسات التي:
- `scheduled_date` = تاريخ اليوم
- `assigned_members` يحتوي على `userId` (باستخدام `cs` operator في supabase: `contains`)

```typescript
export function useTodayAssignedSchedules(userId: string) {
    // schedules where scheduled_date = today AND userId IN assigned_members
}
```

### الخطوة 2 — إضافة hook مساعد في `use-tasks.ts`
**اسم الـ Hook:** `useTodayMyTasks(userId)`

يجلب المهام التي:
- `assigned_to` = userId
- `scheduled_date` = تاريخ اليوم
- `status` != 'completed'

### الخطوة 3 — إنشاء مكوّن `TodayTasksSection`
**المسار:** `src/components/shared/today-tasks-section.tsx`

مكوّن مستقل يعرض قسم "مهام اليوم" يضم:
- بطاقة لكل **task** اليوم (scheduled_date = today)
- بطاقة لكل **schedule** اليوم (scheduled_date = today)
- يُعرض فقط إذا كان هناك عناصر (لا يظهر إذا لم تكن هناك مهام)
- يحتوي على badge "جديد" أو مؤشر بصري مميّز

**محتوى البطاقة للـ Task:**
- العنوان، العميل، الوقت، الموقع
- زر "تم"، زر رفع ملف

**محتوى البطاقة للـ Schedule:**
- العنوان، الوقت (start_time - end_time)، الموقع
- اسم العميل، ملاحظات

### الخطوة 4 — تعديل `role-dashboard.tsx`
إضافة عرض `TodayTasksSection` في أعلى لوحة التحكم (قبل "جلسات التصوير").

### الخطوة 5 — تعديل صفحات photographer و videographer
لا يحتاجان تعديل إذا تم التعديل على `RoleDashboard` مباشرة.

---

## تسلسل التنفيذ

```
1. use-schedule.ts     → إضافة useTodayAssignedSchedules()
2. use-tasks.ts        → إضافة useTodayMyTasks()
3. today-tasks-section.tsx  → إنشاء المكوّن
4. role-dashboard.tsx  → دمج TodayTasksSection في الأعلى
```

---

## تفاصيل الـ Supabase Query

### للجلسات (schedules)
```sql
SELECT * FROM schedules
WHERE scheduled_date = CURRENT_DATE
  AND assigned_members @> ARRAY['userId']::uuid[]
ORDER BY start_time ASC
```

في supabase-js:
```typescript
.contains('assigned_members', [userId])
.eq('scheduled_date', today)
```

### للمهام (tasks)
```sql
SELECT * FROM tasks
WHERE assigned_to = 'userId'
  AND scheduled_date = CURRENT_DATE
  AND status != 'completed'
```

---

## الملفات التي ستُعدَّل / تُنشأ

| الملف | نوع التغيير |
|-------|-------------|
| `src/hooks/use-schedule.ts` | إضافة `useTodayAssignedSchedules` |
| `src/hooks/use-tasks.ts` | إضافة `useTodayMyTasks` |
| `src/components/shared/today-tasks-section.tsx` | **إنشاء جديد** |
| `src/components/shared/role-dashboard.tsx` | إضافة section في الأعلى |

**ملاحظة:** صفحتا `photographer/page.tsx` و `videographer/page.tsx` لا تحتاجان تعديل لأن التغيير سيكون في `RoleDashboard` المشترك.

---

## المظهر المتوقع

```
┌─────────────────────────────────────────────────────┐
│  مهام التصوير الفوتوغرافي                           │
│  [3 cards: نشط / مكتملة / لليوم]                   │
├─────────────────────────────────────────────────────┤
│  🔥 مهام اليوم           [NEW SECTION - TOP]        │
│  ┌──────────────────────────────────────────────┐   │
│  │ 📋 [Task] تصوير شركة X   ⏰ 10:00 صباحاً     │   │
│  │  📍 القاهرة        [رفع] [تم]                │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │ 📅 [جلسة] جلسة تصوير منتج  ⏰ 2:00 مساءً    │   │
│  │  📍 الاستوديو      👤 من: Ahmed (TL)         │   │
│  └──────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────┤
│  جلسات التصوير           [EXISTING SECTION]         │
│  ...                                                 │
└─────────────────────────────────────────────────────┘
```
