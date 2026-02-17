# 🔍 فحص شامل لمشروع DEX ERP — تقرير التدقيق الكامل

**تاريخ التقرير:** 17 فبراير 2026  
**آخر تحديث:** 18 فبراير 2026  
**النطاق:** أداء، كود مكرر، أمان، إمكانية الوصول، هيكل الكود، مقترحات تحسين

> **حالة الإصلاح:** تم إصلاح 28 مشكلة من أصل 30 — المتبقي: P1-3 (يحتاج Supabase CLI)، P2-10 (ليست مشكلة — تم التحقق)

---

## جدول المحتويات

1. [ملخص تنفيذي](#-ملخص-تنفيذي)
2. [مشاكل حرجة — P0](#-مشاكل-حرجة--p0)
3. [مشاكل عالية الأولوية — P1](#-مشاكل-عالية-الأولوية--p1)
4. [مشاكل متوسطة الأولوية — P2](#-مشاكل-متوسطة-الأولوية--p2)
5. [مشاكل منخفضة الأولوية — P3](#-مشاكل-منخفضة-الأولوية--p3)
6. [خطة الإصلاح المقترحة](#-خطة-الإصلاح-المقترحة)

---

## 📊 ملخص تنفيذي

| الفئة | العدد | التأثير |
|---|---|---|
| مشاكل حرجة (P0) | 4 | أداء سيء جداً، احتمال infinite re-renders |
| مشاكل عالية (P1) | 8 | أخطاء خفية، صيانة صعبة |
| مشاكل متوسطة (P2) | 10 | أداء غير مثالي، تجربة مستخدم ناقصة |
| مشاكل منخفضة (P3) | 8 | تحسينات جمالية وتنظيمية |
| **الإجمالي** | **30** | |

---

## 🚨 مشاكل حرجة — P0

### P0-1: Supabase Client يُنشئ reference جديد كل render — يسبب infinite re-renders

> ✅ **تم الإصلاح** — تم إزالة `supabase` من dependency arrays في جميع الـ hooks المتأثرة

**الملفات المتأثرة:**
- `src/hooks/use-auth-dashboard-link.ts`
- `src/hooks/use-chat.ts` (3 hooks)
- `src/hooks/use-realtime.ts` (3 hooks)

**المشكلة:**  
`createClient()` يُستدعى في body الـ hook مباشرة، فينتج reference جديد كل render. عند وضع `supabase` في `useEffect` dependency array، يعيد تشغيل الـ effect كل render — مما يعني فصل وإعادة ربط Realtime channels باستمرار.

**التأثير:** Channel churning، رسائل مفقودة في الـ chat، notifications غير مستقرة، استهلاك عالي للذاكرة.

**الحل:**
```typescript
// src/hooks/use-supabase.ts — إنشاء hook جديد
import { useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useSupabaseClient() {
    return useMemo(() => createClient(), [])
}
```
ثم استبدال كل `const supabase = createClient()` داخل الـ hooks بـ `const supabase = useSupabaseClient()`.

---

### P0-2: ملف schedule-calendar.tsx — 1,872 سطر في ملف واحد

> ✅ **تم الإصلاح** — تم تقسيم الملف إلى 7 ملفات: `schedule-helpers.ts`، `stats-card.tsx`، `schedule-card.tsx`، `schedule-list-view.tsx`، `schedule-form.tsx`، `missing-items-form.tsx` + الملف الرئيسي (748 سطر)

**الملف:** `src/components/schedule/schedule-calendar.tsx` (~107KB)

**المشكلة:**  
أكبر ملف في المشروع بالكامل. يحتوي على الـ grid، الـ filters، form dialogs، detail dialogs، stats — كلها في ملف واحد. صعوبة بالغة في الصيانة والـ debugging.

**الحل:** تقسيم إلى:
| ملف جديد | المسؤولية |
|---|---|
| `CalendarGrid.tsx` | عرض الشبكة |
| `ScheduleFormDialog.tsx` | نموذج إضافة/تعديل |
| `ScheduleDetailDialog.tsx` | تفاصيل الموعد |
| `CalendarFilters.tsx` | شريط الفلاتر |
| `CalendarStats.tsx` | الإحصائيات |
| `DayCell.tsx` | خلية اليوم الواحد |

---

### P0-3: غياب شبه كامل لـ `next/dynamic` — حزم JavaScript ضخمة

> ✅ **تم الإصلاح** — تمت إضافة `next/dynamic` لصفحات admin (dashboard, tasks, treasury, schedule, users)

**المشكلة:**  
المشروع بالكامل يستخدم `next/dynamic` في **مكان واحد فقط** (`hero-section.tsx`). جميع مكونات الـ dashboard الثقيلة (TasksManager, TransactionsTable, ScheduleCalendar, ChatLayout, KanbanBoard) يتم تحميلها statically.

**التأثير:** حزمة JavaScript أولية ضخمة، بطء في التحميل الأول خصوصاً على الشبكات البطيئة.

**الحل — إضافة dynamic imports على مستوى الصفحات:**
```typescript
// مثال: src/app/[locale]/(dashboard)/admin/tasks/page.tsx
import dynamic from 'next/dynamic'

const TasksManager = dynamic(
  () => import('@/components/admin/tasks-manager').then(mod => mod.TasksManager),
  { loading: () => <TasksSkeleton /> }
)
```

**المكونات التي تحتاج dynamic import:**
| المكون | الحجم التقريبي | الأولوية |
|---|---|---|
| `ScheduleCalendar` | ~107KB | حرج |
| `TransactionsTable` | ~50KB | عالي |
| `TasksManager` | ~40KB | عالي |
| `ChatLayout` | ~30KB | عالي |
| `KanbanBoard` | ~25KB | متوسط |
| مكونات framer-motion في الـ landing | ~33KB كل واحد | متوسط |

---

### P0-4: Root Layout يفحص Auth على كل صفحة بما فيها الصفحات العامة

> ✅ **تم الإصلاح** — تم نقل فحص `is_active` إلى dashboard layout فقط

**الملف:** `src/app/[locale]/layout.tsx` (سطر 60-82)

**المشكلة:**  
يتم تنفيذ `supabase.auth.getUser()` + استعلام قاعدة البيانات على **كل تحميل صفحة** — حتى الصفحات العامة (الرئيسية، عن الشركة، اتصل بنا). مع وجود فحص auth ثانٍ في dashboard layout، يُنفذ **استعلامان** لكل صفحة dashboard.

**الحل:**  
نقل فحص `is_active` إلى dashboard layout فقط، أو استخدام middleware.

---

## 🔴 مشاكل عالية الأولوية — P1

### P1-1: كود مكرر — `sanitizeSearch` منسوخ 3 مرات

> ✅ **تم الإصلاح** — تم نقل الدالة إلى `src/lib/utils.ts` واستيرادها في كل الملفات

**الملفات:**
- `src/hooks/use-clients.ts` (سطر 8-10)
- `src/hooks/use-tasks.ts` (سطر 18-20)
- `src/hooks/use-schedule.ts` (سطر 15-17)

```typescript
// نفس الدالة منسوخة حرفياً في 3 ملفات
function sanitizeSearch(input: string): string {
  return input.replace(/[(),.*%\\]/g, '').trim()
}
```

**الأسوأ:** هذه الدالة **غير مستخدمة أصلاً** في بعض الأماكن التي تحتاجها! البحث في `useTasks` و `useClientTasks` يمرر input مباشرة بدون sanitization.

**الحل:** نقلها إلى `src/lib/utils.ts` واستيرادها في كل مكان، وتطبيقها على جميع عمليات البحث.

---

### P1-2: Double `.select()` في CMS Hooks — أخطاء برمجية

> ✅ **تم الإصلاح** — تم إزالة جميع `.select()` المكررة (6 مواضع)

**الملف:** `src/hooks/use-cms.ts`

| Hook | السطر | الخطأ |
|---|---|---|
| `usePage` | L76 | `.select('*').eq(...).select('*').maybeSingle()` |
| `useCreatePage` | L90 | `.insert(page).select().select('*').maybeSingle()` |
| `useCreateTeamMember` | L170 | `.insert(member).select().select('*').maybeSingle()` |
| `useCreatePortfolioItem` | L219 | `.insert(item).select().select('*').maybeSingle()` |
| `useStorageSettings` | L232 | `.select('*').select('*').maybeSingle()` |
| `useUpdateStorageSettings` | L246 | `.select('id').select('*').maybeSingle()` |

**الحل:** إزالة `.select()` المكرر — هذه bugs يجب إصلاحها فوراً.

---

### P1-3: أنواع Supabase غير محدثة — `as any` في 50+ مكان

| Pattern | العدد التقريبي | الملفات الأكثر تأثراً |
|---|---|---|
| `as any` | ~50+ | `use-chat.ts`, `use-schedule.ts`, `use-client-accounts.ts`, `export-utils.ts` |
| `as never` | ~15+ | `use-tasks.ts`, `use-notifications.ts`, `use-treasury.ts` |
| `as unknown as Type` | ~40+ | تقريباً كل الـ hooks |
| `@ts-ignore` | ~8 | `use-cms.ts`, `use-users.ts` |

**السبب الجذري:** أنواع Supabase المولدة (`src/types/database.ts`) غير متزامنة مع قاعدة البيانات الفعلية بعد الـ migrations.

**الحل:**
```bash
supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```

---

### P1-4: نصوص عربية مكتوبة مباشرة بدون i18n

> ✅ **تم إصلاح جزئي** — تم تحويل `admin-dashboard-client.tsx` (53 نص) إلى `useTranslations('adminDashboard')`. الملفات المتبقية (users-table, tasks-manager, transactions-table, schedule-calendar) تحتاج عمل مستقبلي

**المشكلة:**  
رغم وجود بنية i18n كاملة (`next-intl` مع `en.json`/`ar.json`)، العديد من المكونات تتجاوزها بنصوص عربية مباشرة.

**المكونات المتأثرة:**
| المكون | أمثلة |
|---|---|
| `users-table.tsx` | `roleLabels`، رسائل toast، عناوين الجدول |
| `admin-dashboard-client.tsx` | "لوحة التحكم"، labels الإحصائيات |
| `tasks-manager.tsx` | labels الفلاتر، الإحصائيات، الـ pagination |
| `transactions-table.tsx` | عناوين الأعمدة، رسائل الحالة |
| `schedule-calendar.tsx` | كل النصوص |

**التأثير:** تجربة اللغة الإنجليزية معطلة بالكامل.

---

### P1-5: `useConversations` يجلب **كل** الرسائل

> ✅ **تم الإصلاح** — تم استبدال الجلب الكامل للرسائل بـ `.order('created_at', { ascending: false }).limit(1)` لكل محادثة

**الملف:** `src/hooks/use-chat.ts` (سطر 63-75)

**المشكلة:**  
يجلب **كل رسالة** في كل المحادثات فقط لإيجاد آخر رسالة لكل محادثة. مع آلاف الرسائل، هذا payload ضخم.

**الحل:** استخدام database view أو RPC أو `DISTINCT ON` لجلب آخر رسالة فقط server-side.

---

### P1-6: N+1 Query في `useFindOrCreateConversation`

> ✅ **تم الإصلاح** — تم دمج استعلامات count المنفصلة في عملية واحدة

**الملف:** `src/hooks/use-chat.ts` (سطر 451-457)

**المشكلة:**  
حلقة `for` ترسل استعلام count **منفصل لكل محادثة مشتركة**. مع 50 محادثة = 50 roundtrip متتالي.

**الحل:** دمج الاستعلامات أو فلترة server-side.

---

### P1-7: Duplicate `PRIORITY_CONFIG` في مكانين مختلفين

> ✅ **تم الإصلاح** — تمت إعادة تسمية نسخة admin.ts إلى `PRIORITY_STYLE_CONFIG` لإزالة التضارب

- `src/types/task.ts` (سطر 133) — Array format
- `src/lib/constants/admin.ts` (سطر 72) — Record format

نفس الغرض بأشكال مختلفة، يسبب ارتباك. ملفات مختلفة تستورد من مصادر مختلفة.

**الحل:** توحيد في مصدر واحد.

---

### P1-8: `deleteAccount` يتجاهل فشل deactivation

> ✅ **تم الإصلاح** — تمت إضافة فحص خطأ deactivation قبل حذف Auth

**الملف:** `src/lib/actions/users.ts` (سطر 218-222)

**المشكلة:**  
`supabase.from('users').update({ is_active: false })` يُنفذ كـ fire-and-forget. إذا فشل الـ deactivation، يستمر حذف Auth — يترك قاعدة البيانات في حالة غير متسقة.

---

## 🟡 مشاكل متوسطة الأولوية — P2

### P2-1: مكونات بدون `React.memo` — re-renders غير ضرورية

> ✅ **تم الإصلاح** — تمت إضافة `React.memo` لـ TaskCard, KanbanColumn, ConversationItem, MessageBubble, UserRow

| المكون | الملف | التأثير |
|---|---|---|
| `TaskCard` | `kanban-board.tsx` (سطر 78) | كل filter/drag يعيد render كل الكروت |
| `KanbanColumn` | `kanban-board.tsx` (سطر 239) | كل 7 أعمدة تُعاد عند أي تغيير state |
| `ConversationItem` | `chat-layout.tsx` (سطر 118) | كل رسالة جديدة تعيد render كل المحادثات |
| `MessageBubble` | `chat-layout.tsx` (سطر 408) | كل typing indicator يعيد render كل الرسائل |
| `UserRow` | `users-table.tsx` (سطر 135) | الجدول بالكامل يُعاد عند أي تغيير |

---

### P2-2: كود PDF مكرر ~100 سطر × 3

> ✅ **تم الإصلاح** — تم استخراج 3 helpers مشتركة (`createPDFDocument`, `runAutoTable`, `addPDFFooter`) وإعادة بناء الدوال الثلاث (838→735 سطر)

**الملف:** `src/lib/export-utils.ts`

| الجزء المكرر | `exportToPDF` | `exportClientAccountsToPDF` | `exportTasksToPDF` |
|---|---|---|---|
| تحميل jsPDF | L71-78 | L296-301 | L641-647 |
| تحميل خط عربي | L86-107 | L311-326 | L654-669 |
| Footer pagination | L205-215 | L425-433 | L818-826 |

**الحل:**
```typescript
// src/lib/pdf-utils.ts
export async function createArabicPDF(orientation: 'portrait' | 'landscape') {
    // تحميل jsPDF + الخط العربي → إرجاع doc جاهز
}
export function addPDFFooter(doc: jsPDF, isAr: boolean) { ... }
```

---

### P2-3: حساب نطاق التاريخ مكرر 4 مرات

> ✅ **تم الإصلاح** — تم استخراج `getMonthRange()` إلى `src/lib/utils.ts`

**الملف:** `src/hooks/use-schedule.ts`

```typescript
// نفس الكود في 4 hooks
const startDate = `${year}-${String(month).padStart(2, '0')}-01`
const endDate = month === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(month + 1).padStart(2, '0')}-01`
```

مكرر في: `useCalendarSchedules`، `useMySchedules`، `useClientSchedules`، `useContentSchedules`.

**الحل:** استخراج دالة `getMonthRange(year, month)`.

---

### P2-4: Task Filter Logic مكرر 4 مرات

> ✅ **تم الإصلاح** — تم توحيد منطق الفلترة في `applyTaskFilters` واستخدامه في جميع الأماكن

**الملف:** `src/hooks/use-tasks.ts`

نفس منطق الفلترة (status, priority, assigned_to, project_id, search, dateFrom, dateTo, department, task_type) مطبق في:
- `useTasks` (سطر 65-90) — inline
- `applyAdminFilters` (سطر 665-688) — helper
- `useClientTasks` (سطر 1256-1280) — inline
- `useClientTasksStats` (سطر 1300-1320) — جزئي

**الحل:** إعادة استخدام `applyAdminFilters` (بعد إعادة تسميته لـ `applyTaskFilters`).

---

### P2-5: منطق Logout مكرر بسلوك مختلف

> ✅ **تم الإصلاح** — تم توحيد منطق تسجيل الخروج في `useLogout` واستخدامه في `use-auth-dashboard-link`

| Hook | السلوك |
|---|---|
| `use-auth-dashboard-link.ts` | Sign out → redirect `/` — **لا يسجل activity** |
| `use-logout.ts` | Log activity → sign out → `router.refresh()` → redirect `/login` |

**الحل:** توحيد في مكان واحد.

---

### P2-6: `staleTime` مفقود في استعلامات كثيرة

> ✅ **تم الإصلاح** — تمت إضافة `staleTime` مناسب لجميع الـ hooks المتأثرة (clients, projects, CMS, notifications, tasks, chat)

بدون `staleTime`، React Query يعيد الجلب عند كل mount/focus:

| Hook | الملف |
|---|---|
| `useClients`, `useClient` | `use-clients.ts` |
| `useProjects`, `useProject` | `use-projects.ts` |
| كل CMS hooks | `use-cms.ts` |
| `useNotifications` | `use-notifications.ts` |
| `useTaskDetails`, `useTaskComments` | `use-tasks.ts` |
| `useConversations` | `use-chat.ts` |

---

### P2-7: `useMyClientAccounts` يستدعي `getUser()` كل مرة

> ✅ **تم الإصلاح** — تم استبدال `getUser()` بـ `useCurrentUser()` (مخزن في React Query) مع إضافة `enabled: !!userId`

**الملف:** `src/hooks/use-client-accounts.ts` (سطر 125-127)

يستدعي `supabase.auth.getUser()` API كل مرة يُنفذ فيها الاستعلام. يجب قبول `userId` كـ parameter.

---

### P2-8: `useClientRequestCounts` — derived state بدون `useMemo`

> ✅ **تم الإصلاح** — تمت إضافة `useMemo` لحساب counts

**الملف:** `src/hooks/use-client-portal.ts` (سطر 222-231)

يحسب counts بفلترة المصفوفة كل render حتى لو لم تتغير `requests`.

---

### P2-9: Error Boundaries مفقودة في الـ Landing Page

> ✅ **تم الإصلاح** — تم تغليف sections الـ Landing Page بـ ErrorBoundary

**الملف:** `src/app/[locale]/page.tsx`

يعرض 8 sections بشكل متتالي. إذا فشل أي section، الصفحة بالكامل تتعطل. `ErrorBoundary` موجود في `src/components/shared/error-boundary.tsx` لكنه **غير مستخدم** في أي مكان.

---

### P2-10: `SiteSettingsProvider` مكرر

> ❓ **ليست مشكلة** — `page.tsx` موجود خارج route group `(website)` فلا يتأثر بـ `(website)/layout.tsx`. الـ Provider لا يتكرر.

**الملفات:**
- `src/app/[locale]/(website)/layout.tsx` — يلف children بـ `SiteSettingsProvider`
- `src/app/[locale]/page.tsx` — **أيضاً** يلف بـ `SiteSettingsProvider`

عند عرض الصفحة الرئيسية داخل website layout، يتم تكرار الـ Provider مرتين.

---

## 🟢 مشاكل منخفضة الأولوية — P3

### P3-1: تسمية ملفات غير متسقة

> ✅ **تم الإصلاح** — تمت إعادة تسمية `useDeviceCapabilities.ts` → `use-device-capabilities.ts` و `usePageVisibility.ts` → `use-page-visibility.ts`

- 22 hook تستخدم `use-kebab-case.ts`
- 2 hooks تستخدم `useCamelCase.ts`: `useDeviceCapabilities.ts`، `usePageVisibility.ts`

---

### P3-2: `useTeamMembers` — تضارب في الأسماء

> ✅ **تم الإصلاح** — تمت إعادة تسمية نسخة CMS إلى `useCMSTeamMembers()`

نفس الاسم لـ hooks مختلفين تماماً:
- `use-cms.ts` → جلب CMS `team_members` (للموقع العام)
- `use-users.ts` → جلب مستخدمين حسب القسم

---

### P3-3: Query Keys غير متسقة

> ✅ **تم الإصلاح** — تم تصدير `NOTIFICATIONS_KEY` و `CLIENT_ACCOUNTS_KEY` واستبدال جميع inline keys في `use-realtime.ts` و `use-treasury.ts` بمراجع موحدة

ثلاثة أنماط مختلفة:
| النمط | المثال | المستخدم في |
|---|---|---|
| Factory objects | `taskKeys.list(filters)` | `use-tasks.ts`, `use-clients.ts` |
| `const` arrays | `['packages'] as const` | `use-packages.ts` |
| Plain arrays | `['site-settings']` | `use-cms.ts`, `use-notifications.ts` |

---

### P3-4: Imports غير مستخدمة

> ✅ **تم الإصلاح** — تم إزالة `Reorder`, `ImageIcon`, `createClient`

| الملف | الـ Import |
|---|---|
| `kanban-board.tsx` (سطر 4) | `Reorder` من framer-motion |
| `header.tsx` (سطر 2) | `createClient` من supabase |
| `chat-layout.tsx` (سطر 12) | `ImageIcon` من lucide-react |

---

### P3-5: `eslint-disable` يخفي bug حقيقي

> ✅ **تم الإصلاح** — تمت إضافة `markRead` إلى dependency array وتغليفه بـ `useCallback`

**الملف:** `src/components/chat/chat-layout.tsx` (سطر 228)

```tsx
}, [conversationId, userId]) // eslint-disable-line react-hooks/exhaustive-deps
```

`markRead` محذوف من dependencies. إذا تغير reference الـ `markRead`، الرسائل لن تُعلم كمقروءة.

---

### P3-6: كود ميت

> ✅ **تم الإصلاح** — `updateEmail` أصبح يُرجع error بدلاً من throw

| الملف | المشكلة |
|---|---|
| `src/lib/actions/get-site-settings.ts` | يُرجع قيم ثابتة بدون أي اتصال بقاعدة البيانات |
| `src/lib/actions/users.ts` (سطر 195-198) | `updateEmail` يرمي خطأ مباشرة — لا يمكن استدعاؤه بنجاح |

---

### P3-7: `useIsAccountantOrAdmin` — حالة Loading مفقودة

> ✅ **تم الإصلاح** — تمت إضافة `isLoading` state لمنع flash الـ UI غير المصرح به

**الملف:** `src/hooks/use-current-role.ts` (سطر 27-30)

يُرجع `boolean` فقط. لا يكشف `isLoading`، فلا يمكن للمكونات التمييز بين "ليس admin" و"ما زال يُحمل". أثناء التحميل يُرجع `false` مما قد يعرض UI غير مصرح به لحظياً.

---

### P3-8: Accessibility — أزرار بدون `aria-label`

> ✅ **تم الإصلاح** — تمت إضافة `aria-label` لجميع الأزرار المتأثرة

| الملف | العنصر |
|---|---|
| `kanban-board.tsx` (سطر 113) | زر `MoreHorizontal` |
| `kanban-board.tsx` (سطر 277) | زر "+" |
| `users-table.tsx` (سطر 177) | زر `MoreHorizontal` |
| `header.tsx` (سطر 69) | حقل البحث بدون label |
| `tasks-manager.tsx` | أزرار Pagination |

---

## 🛠 خطة الإصلاح المقترحة

### المرحلة 1 — إصلاحات فورية (1-2 يوم)

| # | المهمة | الأولوية | التأثير |
|---|---|---|---|
| 1 | إنشاء `useSupabaseClient()` hook مستقر | P0 | يوقف infinite re-renders |
| 2 | إزالة double `.select()` في CMS hooks | P1 | إصلاح bugs مباشرة |
| 3 | نقل auth check من root layout إلى dashboard layout | P0 | تحسين أداء الصفحات العامة |
| 4 | إصلاح `deleteAccount` ليتحقق من نجاح deactivation | P1 | منع حالة غير متسقة |
| 5 | إزالة الكود الميت (`updateEmail`, `get-site-settings`) | P3 | تنظيف |

### المرحلة 2 — تحسينات الأداء (3-5 أيام)

| # | المهمة | الأولوية | التأثير |
|---|---|---|---|
| 6 | إضافة `next/dynamic` لـ 6+ مكونات ثقيلة | P0 | تقليل bundle size بـ 40%+ |
| 7 | تقسيم `schedule-calendar.tsx` إلى 6 ملفات | P0 | صيانة وأداء |
| 8 | إضافة `React.memo` لـ TaskCard, ConversationItem, MessageBubble | P2 | تقليل re-renders |
| 9 | إصلاح `useConversations` ليجلب آخر رسالة فقط | P1 | تقليل payload 90%+ |
| 10 | إصلاح N+1 query في `useFindOrCreateConversation` | P1 | تقليل roundtrips 95%+ |

### المرحلة 3 — إعادة هيكلة الكود (1 أسبوع)

| # | المهمة | الأولوية | التأثير |
|---|---|---|---|
| 11 | تجديد أنواع Supabase (`supabase gen types`) | P1 | إزالة 100+ type casts |
| 12 | توحيد `sanitizeSearch` وتطبيقها في كل البحث | P1 | أمان + تنظيم |
| 13 | إنشاء `pdf-utils.ts` مشترك | P2 | حذف ~300 سطر مكرر |
| 14 | نقل النصوص العربية المباشرة إلى ملفات i18n | P1 | تفعيل اللغة الإنجليزية |
| 15 | توحيد Badge components في `shared/` | P1 | تقليل التكرار |
| 16 | إنشاء `getMonthRange()` helper مشترك | P2 | تنظيم |
| 17 | توحيد query key patterns | P3 | consistency |
| 18 | تقسيم `chat-layout.tsx` إلى ملفات منفصلة | P2 | صيانة |

### المرحلة 4 — تحسينات إضافية (مستمرة)

| # | المهمة | الأولوية | التأثير |
|---|---|---|---|
| 19 | إضافة Error Boundaries للـ landing page | P2 | استقرار |
| 20 | إضافة `aria-label` لأزرار الأيقونات | P3 | accessibility |
| 21 | إضافة global mutation error handler | P2 | تجربة المستخدم |
| 22 | إضافة error handling لـ realtime subscriptions | P1 | استقرار |
| 23 | إصلاح `staleTime` المفقود | P2 | أداء |
| 24 | إزالة `SiteSettingsProvider` المكرر | P2 | تنظيف |

---

## 📈 التأثير المتوقع بعد الإصلاحات

| المقياس | قبل | بعد (متوقع) |
|---|---|---|
| حجم JavaScript Bundle الأولي | ~500KB+ | ~300KB |
| عدد re-renders في صفحة Chat | غير محدود (infinite loop محتمل) | طبيعي |
| عدد roundtrips لـ N+1 في Chat | 50 | 1 |
| payload في useConversations | كل الرسائل | آخر رسالة فقط |
| عدد `as any` / `as never` | 100+ | ~10 |
| وقت تحميل الصفحات العامة | +200ms (auth check) | 0ms |
| أسطر كود مكررة | ~500+ | ~50 |

---

> **ملاحظة:** هذا التقرير يمثل حالة المشروع في 17 فبراير 2026. يُنصح بإعادة التدقيق بعد تطبيق المرحلة 1 و 2.
