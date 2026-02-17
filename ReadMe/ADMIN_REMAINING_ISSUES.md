# Admin Components — Remaining Issues Report

> Generated after full re-audit of all 18 files in `src/components/admin/`
> Previous fixes applied: theme-editor sync, users-table roles, contact-settings parallel upsert, admin-stats fake percentages, recent-tasks/transactions/reports shared formatters, index.ts exports.
>
> **✅ ALL 18 ISSUES RESOLVED — Round 3 (Final)**

---

## 🔴 High Priority — ✅ ALL FIXED

### 1. ~~`admin-stats.tsx` — Unused Imports & Variable~~ ✅
- **Fixed in Round 2**: Removed unused `CheckCircle`, `CardDescription` imports and unused `activeTasks` variable.

### 2. ~~`recent-tasks.tsx` — Own `formatDate` Instead of Shared~~ ✅
- **Fixed in Round 2**: Replaced local `formatDate` with shared `getFormatters('ar').formatDate`.

### 3. ~~`recent-tasks.tsx` — Unused Type Import~~ ✅
- **Fixed in Round 2**: Removed unused `TaskStatus` import.

### 4. ~~`reports-overview.tsx` — Memory Leak in CSV Export~~ ✅
- **Fixed in Round 2**: Added `URL.revokeObjectURL(link.href)` after `link.click()`.

### 5. ~~`reports-overview.tsx` — Misleading Export Label~~ ✅
- **Fixed in Round 2**: Changed `"تصدير Excel"` → `"تصدير CSV"`.

### 6. ~~`users-table.tsx` — Unused Import~~ ✅
- **Fixed in Round 2**: Removed unused `UserPlus` import.

### 7. ~~`users-table.tsx` — Date Format Without Locale~~ ✅
- **Fixed in Round 2**: Added `'ar-EG'` locale to `toLocaleDateString()`.

---

## 🟡 Medium Priority — Performance — ✅ ALL FIXED

### 8. ~~`useTasks()` Fetches ALL Tasks Client-Side~~ ✅
- **Fixed in Round 3**: Modified `useTasks()` hook to accept optional `limit` parameter. `recent-tasks.tsx` now uses `useTasks({}, 5)`. Removed unused `useTasks` call entirely from `admin-stats.tsx`.

### 9. ~~`reports-overview.tsx` — `periodLabels` Recreated Every Render~~ ✅
- **Fixed in Round 2**: Moved to module-level `PERIOD_LABELS` constant.
- **Further improved in Round 3**: Removed `PERIOD_LABELS` entirely — now computed dynamically via `useTranslations('reportsOverview')` i18n keys.

### 10. ~~`admin-schedule.tsx` — `filteredTeamLeaders` Not Memoized~~ ✅
- **Fixed in Round 2**: Wrapped in `useMemo(() => ..., [selectedDepartment, teamLeaders])`.

### 11. ~~`contact-settings.tsx` — No Error Handling on Individual Upserts~~ ✅
- **Fixed in Round 2**: Added error checking on individual upsert results.
- **Further improved in Round 3**: Replaced all direct Supabase calls with `useUpdateMultipleSiteSettings()` hook (new hook added to `use-cms.ts`), which checks each result's `.error` property inside `Promise.all`.

---

## 🟡 Medium Priority — i18n / Consistency — ✅ ALL FIXED

### 12. ~~Hardcoded Arabic Without `useTranslations()` (9 files)~~ ✅
- **Fixed in Round 3**: Added `useTranslations()` to all 9 files with proper i18n namespaces:

| File | i18n Namespace | Keys Added |
|---|---|---|
| `admin-stats.tsx` | `adminStats` | 4 stat card titles |
| `recent-tasks.tsx` | `recentTasks` | title, emptyState |
| `recent-transactions.tsx` | `recentTransactions` | title, emptyState, income, expense, general |
| `reports-overview.tsx` | `reportsOverview` | ~15 keys (periods, stats, CSV headers, card titles) |
| `activity-log.tsx` | `activityLog` | title, description, unknownUser, 9 action labels |
| `contact-settings.tsx` | `contactSettings` | title, description, labels, toasts |
| `storage-settings.tsx` | `storageSettings` | all labels, warnings, slider markers, toasts |
| `theme-editor.tsx` | `themeEditor` | preview text, color labels, buttons, toasts |
| `pages-manager.tsx` | `pagesManager` | ~50 keys (dialogs, buttons, badges, toasts, labels) |

- All keys added to both `ar.json` and `en.json` translation files.

---

## 🟢 Low Priority — Code Quality — ✅ ALL FIXED

### 13. ~~`contact-settings.tsx` — Direct Supabase Client Calls~~ ✅
- **Fixed in Round 3**: Removed `createClient` import. Now uses `useSiteSettings()` for loading and new `useUpdateMultipleSiteSettings()` hook for saving. Consistent with `theme-editor.tsx` and `storage-settings.tsx` patterns. Provides automatic cache invalidation via React Query.

### 14. ~~`pages-manager.tsx` — 1041 Lines (Largest File)~~ ✅
- **Fixed in Round 3**: Split into 6 files in `pages-manager/` directory:
  - `types.ts` (42 lines) — ContentItem, EditFormData, CreateFormData, SchemaField, ItemFieldDef interfaces
  - `constants.ts` (73 lines) — PREDEFINED_PAGES, ITEMS_PAGES, ITEMS_FIELDS, PAGE_SCHEMAS, INITIAL_CREATE_DATA
  - `helpers.ts` (91 lines) — generateItemId, createEmptyItem, toJsonString, parseJsonSafe, etc.
  - `schema-field-editor.tsx` (49 lines) — SchemaFieldEditor component
  - `item-editor.tsx` (142 lines) — ItemEditor component
  - `pages-manager.tsx` (~530 lines) — Main PagesManager component
  - `index.ts` (1 line) — Barrel export
- No import changes needed — `components/admin/index.ts` resolves to directory `index.ts`.

### 15. ~~`activity-log.tsx` — Custom Relative Date Formatting~~ ✅
- **Fixed in Round 3**: Replaced custom relative date logic with `date-fns/formatDistanceToNow` using Arabic locale (`{ locale: ar, addSuffix: true }`).

### 16. ~~`admin-schedule.tsx` — Inline i18n Pattern~~ ✅
- **Fixed in Round 3**: Replaced all 11 `isAr ? '...' : '...'` ternary expressions with `useTranslations('adminSchedule')` calls. Removed `useLocale` import.

### 17. ~~`pages-manager.tsx` — `generateItemId()` Uses `Math.random()`~~ ✅
- **Fixed in Round 3**: Replaced `Math.random().toString(36).substring(2, 9)` with `crypto.randomUUID()` in `helpers.ts`.

### 18. ~~`contact-settings.tsx` — `setSettings` Spread in onChange~~ ✅
- **Fixed in Round 2**: Changed all 8 `onChange` handlers from `setSettings({...settings})` → `setSettings(prev => ({...prev}))`.

---

## Summary Table

| Severity | Count | Status |
|---|---|---|
| 🔴 High | 7 | ✅ All fixed (Round 2) |
| 🟡 Medium (Perf) | 4 | ✅ All fixed (Round 2 + 3) |
| 🟡 Medium (i18n) | 1 | ✅ All 9 files migrated (Round 3) |
| 🟢 Low | 6 | ✅ All fixed (Round 2 + 3) |
| **Total** | **18** | **✅ ALL RESOLVED** |

---

## Fix History

### Round 1 — Initial Fixes

| File | Fix Applied |
|---|---|
| `theme-editor.tsx` | Added `useEffect` to sync `colors` when settings load |
| `users-table.tsx` | Fixed `creator` → `"منشئ محتوى"` label; added 5 missing roles to dropdown |
| `contact-settings.tsx` | `Promise.all` for parallel upserts; removed double `JSON.stringify` |
| `admin-stats.tsx` | Removed fake `+20.1%` / `-4.5%` percentages; used shared `getFormatters` |
| `recent-tasks.tsx` | Replaced hardcoded `statusColors`/`statusLabels` with shared `STATUS_CONFIG` |
| `recent-transactions.tsx` | Replaced duplicate `formatCurrency`/`formatDate` with shared `getFormatters` |
| `reports-overview.tsx` | Replaced duplicate `formatCurrency` with shared `getFormatters` |
| `index.ts` | Added 4 missing exports: `TasksManager`, `AddUserDialog`, `ChangePasswordDialog`, `ContactSettings` |

### Round 2 — Re-audit Fixes

| File | Fix Applied |
|---|---|
| `admin-stats.tsx` | Removed unused imports (`CheckCircle`, `CardDescription`) and unused variable (`activeTasks`) |
| `recent-tasks.tsx` | Replaced local `formatDate` with shared `getFormatters('ar').formatDate`; removed unused `TaskStatus` import |
| `reports-overview.tsx` | Fixed memory leak (`URL.revokeObjectURL`); moved `periodLabels` to module-level `PERIOD_LABELS`; fixed misleading "تصدير Excel" → "تصدير CSV" |
| `users-table.tsx` | Removed unused `UserPlus` import; added `'ar-EG'` locale to `toLocaleDateString()` |
| `admin-schedule.tsx` | Wrapped `filteredTeamLeaders` in `useMemo` for memoization |
| `contact-settings.tsx` | Added error checking on individual upsert results; fixed stale closure bug in all 8 `onChange` handlers |

### Round 3 — Final Fixes (All Remaining 18 Issues)

| File(s) | Fix Applied |
|---|---|
| `use-tasks.ts` | Added optional `limit` parameter to `useTasks()` hook |
| `use-cms.ts` | Created `useUpdateMultipleSiteSettings()` hook for batch settings updates |
| `hooks/index.ts` | Exported new `useUpdateMultipleSiteSettings` hook |
| `admin-stats.tsx` | Removed unused `useTasks` call; added `useTranslations('adminStats')` |
| `recent-tasks.tsx` | Uses `useTasks({}, 5)` with limit; added `useTranslations('recentTasks')` |
| `recent-transactions.tsx` | Added `useTranslations('recentTransactions')` |
| `reports-overview.tsx` | Removed `PERIOD_LABELS`; added `useTranslations('reportsOverview')` for all 15+ strings |
| `activity-log.tsx` | Replaced custom date logic with `date-fns/formatDistanceToNow`; added `useTranslations('activityLog')` with action labels |
| `contact-settings.tsx` | Full refactor: replaced direct Supabase → `useSiteSettings()` + `useUpdateMultipleSiteSettings()`; added `useTranslations('contactSettings')` |
| `storage-settings.tsx` | Added `useTranslations('storageSettings')` |
| `theme-editor.tsx` | Added `useTranslations('themeEditor')` |
| `admin-schedule.tsx` | Replaced all `isAr ? ... : ...` ternaries with `useTranslations('adminSchedule')` |
| `pages-manager/` | Split 1041-line file into 6 sub-files; replaced `Math.random()` with `crypto.randomUUID()`; added `useTranslations('pagesManager')` for ~50 strings |
| `ar.json` + `en.json` | Added 10 new i18n namespaces with ~200+ translation keys |
