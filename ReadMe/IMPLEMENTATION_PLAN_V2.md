# خطة التطوير V2 — إعادة هيكلة الأدوار و الجدولة

> **التاريخ:** 2026-02-15
> **الحالة:** مخطط - لم يبدأ التنفيذ بعد

---

## 📋 ملخص التغييرات المطلوبة

| # | البند | الأولوية |
|---|-------|----------|
| 1 | إعادة تسمية الأدوار وهيكلة الفِرق | 🔴 عالية |
| 2 | داشبورد التيم ليدر - عرض جدولين | 🔴 عالية |
| 3 | تدفق جدولة الـ Content Creator | 🔴 عالية |
| 4 | تعديلات فورم الجدولة | 🟡 متوسطة |
| 5 | صفحة Activity Logs لكل تيم ليدر | 🟡 متوسطة |

---

## 1. إعادة تسمية الأدوار وهيكلة الفِرق

### الحالة الحالية
```
user_role ENUM: admin | accountant | team_leader | creator | client | videographer | editor | photographer
department ENUM: photography | content
```
- `team_leader` دور واحد + حقل `department` لتحديد القسم

### المطلوب
```
                        ┌─────────────────────┐
                        │       Admin         │
                        └────────┬────────────┘
               ┌─────────────────┼──────────────────┐
               ▼                 ▼                  ▼
     ┌─────────────────┐ ┌──────────────┐  ┌──────────────┐
     │ Account Manager │ │ Team Leader  │  │  Accountant  │
     │ (dept: content) │ │(dept: photo) │  │              │
     └────────┬────────┘ └──────┬───────┘  └──────────────┘
              │                 │
     ┌────────┴────────┐ ┌─────┴──────────────────────┐
     │                 │ │                             │
     ▼                 ▼ ▼           ▼           ▼
  Content Creator  Designer  Montage(Editor)  Photographer  Videographer
```

### خطوات التنفيذ

#### 1.1 — Database Migration (SQL)
**ملف:** `supabase/migration_v7_role_restructure.sql`

```sql
-- إضافة دور account_manager للـ ENUM
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'account_manager';

-- إضافة دور designer للـ ENUM
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'designer';
```
> ملاحظة: لن نحذف `team_leader` — سيظل كما هو لكن يخص فريق التصوير فقط.

#### 1.2 — تحديث Types (TypeScript)
**ملف:** `src/types/database.ts`

```diff
- export type UserRole = 'admin' | 'accountant' | 'team_leader' | 'creator' | 'client' | 'videographer' | 'editor' | 'photographer'
+ export type UserRole = 'admin' | 'accountant' | 'team_leader' | 'account_manager' | 'creator' | 'designer' | 'client' | 'videographer' | 'editor' | 'photographer'
```

#### 1.3 — تحديث DEPARTMENT_ROLES mapping
**ملف:** `src/hooks/use-users.ts`

```diff
  const DEPARTMENT_ROLES: Record<Department, UserRole[]> = {
-     photography: ['videographer', 'photographer', 'editor'],
-     content: ['creator'],
+     photography: ['videographer', 'photographer', 'editor'],
+     content: ['creator', 'designer'],
  }
```

#### 1.4 — تحديث getRoleLabel
**ملف:** `src/hooks/use-users.ts`

```diff
  const labels: Record<string, { en: string; ar: string }> = {
+     account_manager: { en: 'Account Manager', ar: 'مدير حسابات' },
+     designer: { en: 'Designer', ar: 'مصمم' },
      // ... باقي الأدوار
  }
```

#### 1.5 — تحديث Dashboard Layout routing
**ملف:** `src/app/[locale]/(dashboard)/layout.tsx`

```diff
  const ROLE_PATH_MAP: Record<string, string[]> = {
+     account_manager: ['/account-manager'],
      // ...
  }
  const ROLE_HOME: Record<string, string> = {
+     account_manager: '/account-manager',
      // ...
  }
```

#### 1.6 — إنشاء صفحات Account Manager
```
src/app/[locale]/(dashboard)/account-manager/
├── page.tsx                    ← الداشبورد الرئيسية (مثل team-leader/page.tsx مع تعديلات)
├── schedule/
│   └── page.tsx                ← صفحة الجدولة الخاصة
├── chat/
│   └── page.tsx                ← الشات
└── logs/
    └── page.tsx                ← صفحة الـ Activity Logs
```

#### 1.7 — تحديث Sidebar navigation
**ملف:** `src/components/layout/sidebar.tsx`
- إضافة links خاصة بـ `account_manager`
- نفس بنية `team_leader` مع تعديل المسارات

#### 1.8 — تحديث Task creation permissions
- `account_manager` يقدر يضيف tasks لـ `creator` و `designer` فقط
- `team_leader` يقدر يضيف tasks لـ `editor`, `photographer`, `videographer` فقط
- Hook `useTeamMembers` يعمل بالفعل بناءً على `department` — يحتاج فقط التأكد إنه يشتغل مع `account_manager`

#### 1.9 — الملفات المتأثرة (تحديث references)
| ملف | التغيير |
|-----|---------|
| `src/lib/routes.tsx` | إضافة routes الـ account_manager |
| `src/components/layout/sidebar.tsx` | إضافة navigation links |
| `src/components/admin/add-user-dialog.tsx` | إضافة الأدوار الجديدة في dropdown |
| `src/hooks/use-tasks.ts` | التأكد من فلترة المهام حسب الدور |
| `src/middleware.ts` | إضافة route protection |

---

## 2. داشبورد التيم ليدر — عرض جدولين

### المطلوب
التيم ليدر (photography) يشوف **2 جدول** في صفحة الـ schedule:
1. **جدوله الخاص** → يقدر يشوف + يعدل + يوافق + يحذف
2. **جدول الـ Content Creator** → يقدر يشوف فقط (Read-Only)

### خطوات التنفيذ

#### 2.1 — تعديل صفحة schedule الخاصة بالتيم ليدر
**ملف:** `src/app/[locale]/(dashboard)/team-leader/schedule/page.tsx`

```tsx
// عرض Tabs بين الجدولين
<Tabs defaultValue="my-schedule">
    <TabsList>
        <TabsTrigger value="my-schedule">جدولي</TabsTrigger>
        <TabsTrigger value="content-schedule">جدول المحتوى</TabsTrigger>
    </TabsList>
    <TabsContent value="my-schedule">
        <ScheduleCalendar teamLeaderId={currentUser.id} />
    </TabsContent>
    <TabsContent value="content-schedule">
        <ContentScheduleReadOnly />   {/* Read-Only view */}
    </TabsContent>
</Tabs>
```

#### 2.2 — إنشاء hook لجلب جدولات Content
**ملف:** `src/hooks/use-schedule.ts`

```ts
// جلب كل الجدولات الخاصة بقسم المحتوى
export function useContentSchedules(year: number, month: number) {
    // SELECT * FROM schedules WHERE department = 'content'
    // + joins مع users, clients, projects
}
```

#### 2.3 — إنشاء مكون ContentScheduleReadOnly
**ملف:** `src/components/schedule/content-schedule-readonly.tsx`
- يستخدم نفس UI الكاليندر
- بدون أزرار تعديل/حذف/إنشاء
- يعرض فقط البيانات

---

## 3. تدفق جدولة الـ Content Creator

### المطلوب
```
Content Creator يضيف جدولة
        │
        ▼
تظهر عند Account Manager ← يقدر يعدل / يوافق / يبعت ملاحظة
        │
        ▼
تظهر عند Team Leader (photography) ← يقدر يشوف فقط (Read-Only)
```

### إضافة حقل "النواقص" و "نوع الجدولة"

#### 3.1 — Database Migration
**ملف:** `supabase/migration_v7_role_restructure.sql` (نفس ملف الـ migration)

```sql
-- إضافة حقل النواقص
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS missing_items TEXT;

-- إضافة حالة النواقص
CREATE TYPE missing_items_status AS ENUM ('pending', 'resolved', 'not_applicable');
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS missing_items_status missing_items_status DEFAULT 'not_applicable';

-- إضافة نوع الجدولة (reels أو post)
CREATE TYPE schedule_type AS ENUM ('reels', 'post');
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS schedule_type schedule_type DEFAULT 'post';

-- إضافة حقل created_by لمعرفة مين اللي أنشأ الجدولة
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id);

-- إضافة حقل approval_status
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS approval_status approval_status DEFAULT 'pending';

-- إضافة حقل ملاحظات المدير (Account Manager notes)
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS manager_notes TEXT;

-- إضافة حقل الروابط مع التعليقات (JSONB array)
-- البنية: [{"url": "https://...", "comment": "تعليق"}]
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS links JSONB DEFAULT '[]';

-- إضافة حقل الصور (JSONB array of URLs — حد أقصى 10)
-- البنية: ["https://cloudinary.../img1.jpg", "https://cloudinary.../img2.jpg"]
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';
```

#### 3.2 — تحديث TypeScript Types
**ملف:** `src/types/database.ts`

```diff
+ export type MissingItemsStatus = 'pending' | 'resolved' | 'not_applicable'
+ export type ScheduleType = 'reels' | 'post'
+ export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

+ export interface ScheduleLink {
+     url: string
+     comment: string
+ }

  export interface Schedule {
      // ... existing fields
+     missing_items: string | null
+     missing_items_status: MissingItemsStatus
+     schedule_type: ScheduleType
+     created_by: string | null
+     approval_status: ApprovalStatus
+     manager_notes: string | null
+     links: ScheduleLink[]          // روابط مع تعليقات
+     images: string[]               // URLs صور (حد أقصى 10)
  }
```

#### 3.3 — إنشاء صفحة الـ Content Creator للجدولة
**ملف:** `src/app/[locale]/(dashboard)/creator/schedule/page.tsx`
- فورم إنشاء جدولة (الفورم المبسطة — بدون company name, التاريخ auto)
- عرض الجدولات الخاصة بيه
- يقدر يشوف حالة الموافقة وملاحظات المدير

#### 3.4 — تحديث صفحة الـ Account Manager للجدولة
**ملف:** `src/app/[locale]/(dashboard)/account-manager/schedule/page.tsx`
- يشوف جدولات الـ Content Creators
- يقدر يعدل / يوافق / يرفض
- يقدر يبعت ملاحظة (manager_notes)
- يشوف النواقص بلون مختلف

#### 3.5 — عرض النواقص بلون مختلف
**ملف:** `src/types/schedule.ts`

```ts
export const MISSING_ITEMS_STATUS_CONFIG = [
    { id: 'pending', label: 'Pending', labelAr: 'معلق', color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
    { id: 'resolved', label: 'Resolved', labelAr: 'تم الحل', color: 'text-green-500', bgColor: 'bg-green-500/10' },
    { id: 'not_applicable', label: 'N/A', labelAr: 'لا يوجد', color: 'text-gray-400', bgColor: 'bg-gray-400/10' },
]

export const APPROVAL_STATUS_CONFIG = [
    { id: 'pending', label: 'Pending', labelAr: 'في الانتظار', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
    { id: 'approved', label: 'Approved', labelAr: 'موافق عليه', color: 'text-green-500', bgColor: 'bg-green-500/10' },
    { id: 'rejected', label: 'Rejected', labelAr: 'مرفوض', color: 'text-red-500', bgColor: 'bg-red-500/10' },
]
```

---

## 4. تعديلات فورم الجدولة

### المطلوب
| التغيير | التفاصيل |
|---------|----------|
| ❌ إلغاء تعديل التاريخ | التاريخ يتعيّن تلقائي من اليوم المختار في الكاليندر — يتعرض read-only |
| ✅ إبقاء "من" و "إلى" | حقول الوقت تبقى كما هي |
| 🔄 العميل تلقائي من الفلتر | لو فيه فلتر عميل مفعّل فوق، العميل يتحدد تلقائي في الفورم |
| ❌ إلغاء اسم الشركة | حذف حقل `company_name` بالكامل |
| ➕ إضافة نوع الجدولة | اختيار بين `Reels` أو `Post` |
| 🎨 Emoji في الملاحظات | إضافة emoji picker في حقل الملاحظات (Facebook-style) |
| 🔗 إضافة روابط مع تعليقات | زر "+ إضافة لينك" — كل لينك فيه URL + تعليق — عدد غير محدود (optional) |
| 🖼️ رفع صور | رفع لحد 10 صور (Cloudinary) — معاينة + حذف فردي (optional) |

### خطوات التنفيذ

#### 4.1 — تعديل ScheduleForm
**ملف:** `src/components/schedule/schedule-calendar.tsx` (ScheduleForm component — سطر 1057)

**التغييرات:**
1. **التاريخ read-only:**
```tsx
// بدلاً من input type="date" مع onChange
<div className="px-3 py-2 rounded-xl border bg-muted/30 text-sm">
    {format(new Date(date), 'EEEE, d MMMM yyyy', { locale: dateLocale })}
</div>
```

2. **حذف company_name:**
```diff
- const [companyName, setCompanyName] = useState(schedule?.company_name || '')
// وحذف كل الـ JSX الخاص بيه
```

3. **إضافة schedule_type:**
```tsx
<Select value={scheduleType} onValueChange={setScheduleType}>
    <SelectTrigger>
        <SelectValue placeholder="نوع المحتوى" />
    </SelectTrigger>
    <SelectContent>
        <SelectItem value="reels">📹 Reels</SelectItem>
        <SelectItem value="post">📝 Post</SelectItem>
    </SelectContent>
</Select>
```

4. **العميل من الفلتر:**
```tsx
// ScheduleForm يقبل prop جديد: defaultClientId
interface ScheduleFormProps {
    // ... existing
    defaultClientId?: string  // من الفلتر
}
// داخل useState:
const [clientId, setClientId] = useState(
    schedule?.client_id || defaultClientId || 'no-client'
)
```

5. **Emoji picker:**
- تثبيت مكتبة: `@emoji-mart/react` + `@emoji-mart/data`
- إضافة زر emoji بجانب حقل الملاحظات

6. **روابط مع تعليقات (Links with Comments):**
```tsx
// State:
const [links, setLinks] = useState<{url: string; comment: string}[]>(schedule?.links || [])

// UI: زر "+ إضافة لينك" يضيف صف جديد
// كل صف فيه:
//   - Input type="url" للرابط
//   - Input type="text" للتعليق
//   - زر حذف (X)
<div className="space-y-2">
    {links.map((link, i) => (
        <div key={i} className="flex gap-2 items-start">
            <Input placeholder="https://..." value={link.url} onChange={...} />
            <Input placeholder="تعليق..." value={link.comment} onChange={...} />
            <Button variant="ghost" size="icon" onClick={() => removeLink(i)}>
                <X className="h-4 w-4" />
            </Button>
        </div>
    ))}
    <Button type="button" variant="outline" size="sm" onClick={addLink}>
        <Plus className="h-3.5 w-3.5 me-1.5" /> إضافة لينك
    </Button>
</div>
```

7. **رفع صور (Image Uploads — حد أقصى 10):**
```tsx
// State:
const [images, setImages] = useState<string[]>(schedule?.images || [])
const [uploading, setUploading] = useState(false)

// UI:
// - منطقة drag & drop أو زر "رفع صور"
// - Grid معاينة الصور المرفوعة مع زر حذف لكل صورة
// - عداد: "3/10 صور"
// - الرفع يتم عبر Cloudinary (نفس الآلية الموجودة في المشروع)
// - لو وصل 10 يتعطل زر الرفع
<div>
    <Label>الصور ({images.length}/10)</Label>
    <div className="grid grid-cols-5 gap-2">
        {images.map((url, i) => (
            <div key={i} className="relative group">
                <img src={url} className="rounded-lg object-cover aspect-square" />
                <button onClick={() => removeImage(i)} 
                    className="absolute top-1 right-1 bg-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100">
                    <X className="h-3 w-3 text-white" />
                </button>
            </div>
        ))}
        {images.length < 10 && (
            <label className="border-2 border-dashed rounded-lg aspect-square flex items-center justify-center cursor-pointer hover:bg-muted/30">
                <input type="file" accept="image/*" multiple hidden onChange={handleImageUpload} />
                <Plus className="h-6 w-6 text-muted-foreground" />
            </label>
        )}
    </div>
</div>
```

#### 4.2 — تثبيت dependencies
```bash
npm install @emoji-mart/react @emoji-mart/data
```

#### 4.3 — إنشاء EmojiTextarea component
**ملف:** `src/components/ui/emoji-textarea.tsx`
- Textarea مع زر emoji
- شكل مشابه لـ Facebook (rounded, emoji button على اليسار/اليمين)
- يدعم RTL

#### 4.4 — إنشاء LinksInput component
**ملف:** `src/components/ui/links-input.tsx`
- مكون قابل لإعادة الاستخدام لإدارة قائمة روابط مع تعليقات
- يقبل `value` و `onChange` (controlled component)
- Validation: يتأكد إن الـ URL صالح قبل الإضافة

#### 4.5 — إنشاء ImageUploader component
**ملف:** `src/components/ui/image-uploader.tsx`
- مكون لرفع صور متعددة إلى Cloudinary
- يقبل `maxImages={10}`, `value`, `onChange`
- يعرض grid معاينة + drag & drop
- يستخدم `src/lib/cloudinary.ts` الموجود بالفعل

---

## 5. صفحة Activity Logs لكل تيم ليدر

### المطلوب
كل تيم ليدر (و account manager) يشوف صفحة logs فيها كل الأنشطة الخاصة بأفراد فريقه فقط.

### خطوات التنفيذ

#### 5.1 — إنشاء hook لجلب الـ logs
**ملف:** `src/hooks/use-team-logs.ts`

```ts
export function useTeamLogs(teamLeaderId: string, limit = 50) {
    // 1. نجيب أعضاء الفريق الأول
    // 2. نجيب الـ activity_log where user_id IN (team_member_ids)
    // 3. نعمل join مع users لعرض الاسم والصورة
}
```

#### 5.2 — إنشاء مكون TeamActivityLog
**ملف:** `src/components/shared/team-activity-log.tsx`
- مبني على `src/components/admin/activity-log.tsx` الموجود حالياً
- يقبل prop: `teamLeaderId` لتحديد الفريق
- يعرض: الاسم + الفعل + التفاصيل + الوقت
- فلترة حسب التاريخ + نوع الفعل

#### 5.3 — إنشاء صفحات الـ Logs
**ملفات:**
```
src/app/[locale]/(dashboard)/team-leader/logs/page.tsx
src/app/[locale]/(dashboard)/account-manager/logs/page.tsx
```
- كل صفحة تستخدم `<TeamActivityLog teamLeaderId={currentUser.id} />`

#### 5.4 — تحديث Sidebar
- إضافة link "سجل النشاط" في sidebar الخاص بالتيم ليدر و الـ account manager

#### 5.5 — تسجيل الأنشطة (Activity Logging)
- التأكد من إن كل عملية CRUD على tasks و schedules تُسجل في `activity_log`
- إضافة triggers أو middleware لتسجيل:
  - إنشاء/تعديل/حذف مهمة
  - إنشاء/تعديل/حذف جدولة
  - تغيير حالة مهمة
  - موافقة/رفض على جدولة

---

## 📁 ملخص الملفات (إنشاء / تعديل / حذف)

### ملفات جديدة (إنشاء)
| الملف | الوصف |
|-------|-------|
| `supabase/migration_v7_role_restructure.sql` | Migration الأساسي |
| `src/app/[locale]/(dashboard)/account-manager/page.tsx` | داشبورد Account Manager |
| `src/app/[locale]/(dashboard)/account-manager/schedule/page.tsx` | جدولة Account Manager |
| `src/app/[locale]/(dashboard)/account-manager/chat/page.tsx` | شات Account Manager |
| `src/app/[locale]/(dashboard)/account-manager/logs/page.tsx` | سجل نشاط Account Manager |
| `src/app/[locale]/(dashboard)/creator/schedule/page.tsx` | جدولة Content Creator |
| `src/app/[locale]/(dashboard)/team-leader/logs/page.tsx` | سجل نشاط Team Leader |
| `src/components/schedule/content-schedule-readonly.tsx` | جدول محتوى Read-Only |
| `src/components/shared/team-activity-log.tsx` | مكون سجل نشاط الفريق |
| `src/components/ui/emoji-textarea.tsx` | Textarea مع Emoji Picker |
| `src/components/ui/links-input.tsx` | مكون إدارة الروابط مع التعليقات |
| `src/components/ui/image-uploader.tsx` | مكون رفع الصور (Cloudinary) |
| `src/hooks/use-team-logs.ts` | Hook لجلب logs الفريق |

### ملفات تعديل
| الملف | التغيير |
|-------|---------|
| `src/types/database.ts` | إضافة الأنواع الجديدة (roles, schedule fields) |
| `src/types/schedule.ts` | إضافة configs للنواقص + الموافقة + نوع الجدولة |
| `src/hooks/use-users.ts` | تحديث DEPARTMENT_ROLES + getRoleLabel |
| `src/hooks/use-schedule.ts` | إضافة hooks جديدة (content schedules, approval) |
| `src/components/schedule/schedule-calendar.tsx` | تعديل الفورم (حذف company, إضافة schedule_type, emoji, read-only date) |
| `src/app/[locale]/(dashboard)/layout.tsx` | إضافة routing الـ account_manager |
| `src/app/[locale]/(dashboard)/team-leader/schedule/page.tsx` | إضافة Tabs (جدولي + جدول المحتوى) |
| `src/components/layout/sidebar.tsx` | إضافة navigation الـ account_manager + logs links |
| `src/components/admin/add-user-dialog.tsx` | إضافة الأدوار الجديدة |
| `src/middleware.ts` | إضافة route protection |
| `src/lib/routes.tsx` | إضافة routes جديدة |

### حقول تُحذف من الاستخدام
| الحقل | ملاحظة |
|-------|--------|
| `company_name` (في الفورم فقط) | يُحذف من الفورم — يبقى في DB للبيانات القديمة |

### حقول جديدة في DB
| الحقل | النوع | ملاحظة |
|-------|-------|--------|
| `links` | `JSONB` | `[{url, comment}]` — روابط مع تعليقات |
| `images` | `JSONB` | `["url1", "url2", ...]` — حد أقصى 10 صور |
| `missing_items` | `TEXT` | نص النواقص |
| `missing_items_status` | `ENUM` | `pending / resolved / not_applicable` |
| `schedule_type` | `ENUM` | `reels / post` |
| `created_by` | `UUID` | مرجع لمن أنشأ الجدولة |
| `approval_status` | `ENUM` | `pending / approved / rejected` |
| `manager_notes` | `TEXT` | ملاحظات الـ Account Manager |

---

## 🔄 ترتيب التنفيذ (Execution Order)

```
المرحلة 1: Database & Types       ← الأساس
├── 1.1  SQL Migration
├── 1.2  TypeScript Types
└── 1.3  Hooks updates (use-users.ts roles/labels)

المرحلة 2: Routing & Layout       ← البنية
├── 2.1  Dashboard layout routing
├── 2.2  Sidebar navigation
├── 2.3  Middleware route protection
└── 2.4  إنشاء صفحات Account Manager (هياكل أساسية)

المرحلة 3: Schedule System        ← الوظائف
├── 3.1  تعديل Schedule Form (حذف company, إضافة type, emoji, read-only date, links, images)
├── 3.2  Hook: useContentSchedules
├── 3.3  Content Creator schedule page
├── 3.4  Account Manager schedule page (with approval)
├── 3.5  Team Leader: Tabs + Content Read-Only view
└── 3.6  إضافة النواقص (missing_items) في UI

المرحلة 4: Activity Logs          ← المتابعة
├── 4.1  Hook: useTeamLogs
├── 4.2  TeamActivityLog component
├── 4.3  Team Leader logs page
└── 4.4  Account Manager logs page

المرحلة 5: Testing & Cleanup      ← التأكيد
├── 5.1  اختبار كل الأدوار
├── 5.2  حذف أي كود قديم مش مستخدم
└── 5.3  مراجعة RLS policies
```

---

## 🏗️ مبادئ التطوير (Clean Code & Performance)

1. **Single Responsibility**: كل component يعمل حاجة واحدة
2. **DRY**: إعادة استخدام المكونات المشتركة (calendar grid, status badges)
3. **Lazy Loading**: الصفحات الجديدة تستخدم `dynamic imports` لو كبيرة
4. **Query Caching**: استخدام `staleTime` مناسب في React Query
5. **Memoization**: `useMemo` و `useCallback` للحسابات المكلفة
6. **Type Safety**: TypeScript strict mode على كل الملفات
7. **حذف الكود القديم**: أي كود تم استبداله يُحذف فوراً

---

## ⚠️ ملاحظات مهمة

- **لا نحذف `team_leader` من الـ ENUM** — نضيف `account_manager` كدور جديد
- **لا نحذف `company_name` من DB** — نحذفه من الفورم فقط (البيانات القديمة تبقى)
- **الـ Content Creator يقدر ينشئ جدولات بس مش مهام** — المهام يضيفها الـ Account Manager
- **RLS Policies** لازم تتحدث عشان الـ `account_manager` يقدر يشوف/يعدل جدولات فريقه
