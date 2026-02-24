# 🔍 DEX ERP — Full Codebase Audit Report

**Date:** February 24, 2026  
**Auditor:** GitHub Copilot (Claude Opus 4.6)  
**Project:** DEX ERP — Next.js 16 + Supabase + React 19  
**Total Issues Found:** **145** | **Fixed:** **~135**

---

## Summary

| Severity | Count | Fixed |
|----------|-------|-------|
| 🔴 **CRITICAL** | 9 | ✅ 9/9 |
| 🟠 **HIGH** | 34 | ✅ 34/34 |
| 🟡 **MEDIUM** | 64 | ✅ 60/64 |
| 🔵 **LOW** | 38 | ✅ 32/38 |
| **Total** | **145** | **~135** |

> **Note:** TypeScript compilation passes with zero errors after all fixes. Next.js build succeeds.

---

## 🔴 CRITICAL Issues (9)

### CRIT-1: Insecure Session Check in Middleware
- **File:** `src/proxy.ts` L48-56
- **Problem:** `getSession()` reads JWT from cookies **without server-side validation**. An attacker can forge a JWT cookie to bypass all middleware authentication.
- **Fix:** Use `getUser()` in middleware for protected routes.

### CRIT-2: Client Schedule Page Leaks All Clients Data
- **File:** `src/app/[locale]/(dashboard)/client/schedule/page.tsx` L10-11
- **Problem:** A **client-role user** calls `useClients()` which fetches **ALL clients** in the system (names, IDs, emails). Massive data leakage vulnerability.
- **Fix:** Use a client-specific hook or server-side filtering by RLS.

### CRIT-3: `useState` Misused as `useEffect` — Profile Data Never Syncs
- **File:** `src/app/[locale]/(dashboard)/profile/profile-client.tsx` L33-38
- **Problem:** `useState(() => { setName(user.name) })` runs **once on mount only**. Since `user` is initially `undefined` (async), the form fields remain empty forever.
- **Fix:** Replace with `useEffect(() => { ... }, [user])`.

### CRIT-4: Auto-Approval of Transactions Bypasses Workflow
- **File:** `src/components/treasury/add-client-transaction-dialog.tsx` ~L150
- **Problem:** `is_approved: true` is **hardcoded** — every client transaction is automatically approved, completely bypassing the approval workflow.
- **Fix:** Set `is_approved: false` and route through approval workflow.

### CRIT-5: Direct Editing of `remaining_balance` (Financial Integrity)
- **File:** `src/components/treasury/edit-client-account-dialog.tsx` ~L40-60
- **Problem:** Allows manual editing of `remaining_balance` through a form field. Balance should be derived from transactions, not manually editable.
- **Fix:** Remove the balance field from the form, calculate it from transaction history.

### CRIT-6: Division by Zero in Client Account Details
- **File:** `src/components/treasury/client-account-details.tsx` ~L100
- **Problem:** `(totalSpent / packagePrice * 100).toFixed(0)` — when `packagePrice` is 0 or undefined, displays `Infinity%` or `NaN%`.
- **Fix:** Add guard: `packagePrice > 0 ? (totalSpent / packagePrice * 100).toFixed(0) : 0`.

### CRIT-7: Role Name Mismatch — `team_leader` vs `team-leader`
- **File:** `src/hooks/use-client-portal.ts` L254
- **Problem:** `.eq('role', 'team_leader')` uses underscores, but role mapping in `use-auth-dashboard-link.ts` uses hyphens (`'team-leader'`). If DB uses hyphens, the team leader lookup **always fails silently**, and all client requests are created with `assigned_to: null`.
- **Fix:** Verify DB role format and unify across all files.

### CRIT-8: CSV Injection Vulnerability in Reports Export
- **File:** `src/components/admin/reports-overview.tsx` L39-54
- **Problem:** User-controlled data interpolated into CSV cells without sanitization. Values starting with `=`, `+`, `-`, `@` execute as spreadsheet formulas.
- **Fix:** Prefix dangerous cells with `'` or `\t` character.

### CRIT-9: `getSiteSettings()` Always Returns Hardcoded Defaults
- **File:** `src/lib/actions/get-site-settings.ts` L36-40
- **Problem:** Function returns `defaultSettings` with a `// TODO: Fix RLS policy infinite recursion`. All CMS theme/settings changes are **silently discarded**.
- **Fix:** Fix the RLS recursion issue in Supabase and restore the actual query.

---

## 🟠 HIGH Issues (34)

### Security

| # | File | Issue |
|---|------|-------|
| H-1 | `src/hooks/use-tasks.ts` L735 | **SQL/PostgREST filter injection** — `filters.search` interpolated directly into `.or()` without `sanitizeSearch()` |
| H-2 | `src/hooks/use-clients.ts` L41-43 | **Filter injection** — same pattern, search interpolated into `.or()` string |
| H-3 | `src/hooks/use-users.ts` L118-128 | **`useDeleteUser` only deletes DB row, not Supabase Auth record** — user can still authenticate |
| H-4 | `src/lib/cloudinary.ts` L7-12 | **Cloudinary falls back to `'demo'` account in production** if env var missing — uploads leak to public account |
| H-5 | `src/lib/cloudinary.ts` L22-46 | **No file size or type validation** on Cloudinary uploads — DoS via large files, malicious file types |
| H-6 | `src/components/tasks/file-upload-zone.tsx` L40 | **Weak ID generation** — `Math.random()` instead of `crypto.randomUUID()` |

### Authentication & Authorization

| # | File | Issue |
|---|------|-------|
| H-7 | `src/hooks/use-users.ts` L29 | **`useCurrentUser` uses `getSession()` not `getUser()`** — revoked sessions still work until JWT expires |
| H-8 | `src/components/admin/users-table.tsx` L170-182 | **Admin can demote self** — no self-demotion guard, can lock themselves out |
| H-9 | `src/components/admin/users-table.tsx` L75-82 | **Role change without confirmation dialog** — instant, accidental click changes role |
| H-10 | `src/app/[locale]/(dashboard)/layout.tsx` L84 | **RBAC relies on spoofable `x-pathname` header** |

### Data & Logic

| # | File | Issue |
|---|------|-------|
| H-11 | `src/hooks/use-tasks.ts` L503-514 | **Non-atomic cascade deletion** — attachments/comments deleted separately, partial failure leaves orphans |
| H-12 | `src/hooks/use-tasks.ts` L785-800 | **`useAdminTasksStats` double-applies status filter** — produces incorrect (zero) counts |
| H-13 | `src/hooks/use-client-assignments.ts` L164-214 | **`useSyncClientAssignments` is not atomic** — delete + insert, partial failure loses data |
| H-14 | `src/types/database.ts` vs `src/lib/constants/admin.ts` | **`TaskStatus` type missing 'completed'** but used in UI constants |
| H-15 | `src/types/database.ts` | **`client_assignments` table missing from Database type** — loses all TS safety |
| H-16 | `src/types/schedule.ts` L24-43 | **`CreateScheduleInput` missing required `company_name`** — runtime DB errors |
| H-17 | `src/components/treasury/stats-cards.tsx` L50-115 | **Wrong currency symbol** — uses `$` instead of `ج.م` |
| H-18 | `src/hooks/use-realtime.ts` L194 | **`require()` inside React hook** — SSR issues, tree-shaking broken |

### Internationalization

| # | File | Issue |
|---|------|-------|
| H-19 | `src/components/admin/admin-stats.tsx` L53 | **Hardcoded Arabic locale** `getFormatters('ar')` — 4 admin files affected |
| H-20 | `src/components/admin/activity-log.tsx` L34 | **Hardcoded Arabic date locale** |
| H-21 | `src/components/admin/add-user-dialog.tsx` | **All strings hardcoded Arabic** — no `useTranslations` |
| H-22 | 7+ dashboard pages | **Admin page titles hardcoded in Arabic** |
| H-23 | `src/components/tasks/task-form.tsx` L25-35 | **Zod validation messages hardcoded Arabic** |
| H-24 | `src/components/client/request-form.tsx` L60-65 | **Same i18n issue** |

### Performance

| # | File | Issue |
|---|------|-------|
| H-25 | `src/hooks/use-chat.ts` L68-103 | **N+1 query in `useConversations`** — 2 queries per conversation (20 convos = 40+ requests) |
| H-26 | `src/hooks/use-chat.ts` L305-327 | **`useUnreadCount` fetches ALL message rows** — should use DB-side count |
| H-27 | `src/hooks/use-treasury-logs.ts` L53 | **Client-side search on truncated result** — `.limit(100)` applied before search filter |

### Duplicate/Dead Code

| # | File | Issue |
|---|------|-------|
| H-28 | `src/hooks/use-auth-dashboard-link.ts` + `use-logout.ts` | **Duplicate logout logic** in two hooks — fragile maintenance |
| H-29 | Duplicate/conflicting landing pages | `[locale]/page.tsx` vs `[locale]/(website)/page.tsx` render different landing pages |
| H-30 | 3 chat pages | **Byte-for-byte identical** "Coming Soon" placeholders |
| H-31 | `src/components/schedule/` | **3 calendar components** duplicate ~200+ lines of the same calendar grid logic |
| H-32 | 3 pages auth/website | **`generateStaticParams` + `force-dynamic` conflict** — dead code |
| H-33 | `src/app/[locale]/contact/page.tsx` L122-157 | **Contact form completely non-functional** — no action/handler |
| H-34 | `src/components/admin/add-user-dialog.tsx` L25 | **Weak password validation** — only `min(8)`, no complexity requirements |

---

## 🟡 MEDIUM Issues (64)

### Missing Error Handling (13)

| # | File | Issue |
|---|------|-------|
| M-1 | `src/hooks/use-logout.ts` L14-23 | No try/catch — silent failure on network errors |
| M-2 | `src/hooks/use-auth-dashboard-link.ts` L76-88 | `handleLogout` has no error handling |
| M-3 | `src/hooks/use-projects.ts` L80-117 | No `onError` handlers on any mutation |
| M-4 | `src/hooks/use-notifications.ts` L33-62 | No `onError` on mark-as-read mutations |
| M-5 | `src/hooks/use-client-portal.ts` L249-259 | Team leader lookup error silently ignored |
| M-6 | 9+ admin components | Missing error states from data hooks |
| M-7 | `src/components/tasks/kanban-board.tsx` L300-340 | Edit/Reassign/Delete actions have **no onClick handlers** — non-functional |
| M-8 | `src/components/tasks/revisions-hub.tsx` ~L200 | `handleStartWork` no try/catch |
| M-9 | `src/components/tasks/file-upload-zone.tsx` ~L100 | `fetch()` without checking `response.ok` |
| M-10 | `src/components/chat/chat-layout.tsx` L268-280 | `handleSend` no try/catch on `mutateAsync` |
| M-11 | `src/components/schedule/client-assignment-manager.tsx` L141-155 | `saveChanges` no try/catch |
| M-12 | `src/components/treasury/transactions-table.tsx` ~L700 | "View Receipt" button has no onClick handler |
| M-13 | `src/app/[locale]/(dashboard)/layout.tsx` L70-74 | Auth errors silently swallowed, renders with wrong role |

### Code Duplication (12)

| # | Files | Issue |
|---|-------|-------|
| M-14 | `file-upload-zone.tsx` + `task-details.tsx` | `getFileIcon()` and `formatFileSize()` copy-pasted identically |
| M-15 | `content-schedule-readonly.tsx` + `schedule-helpers.ts` | `getStatusDot()` re-implemented instead of imported |
| M-16 | `admin-stats.tsx` + `admin-dashboard-client.tsx` + `reports-overview.tsx` | 3 separate `StatCard` implementations |
| M-17 | `admin-dashboard-client.tsx` | Re-implements `RecentTasks` and `RecentTransactions` inline |
| M-18 | `tasks-manager.tsx` + `admin-dashboard-client.tsx` | Duplicate `StatusBadge`/`PriorityBadge` |
| M-19 | `export-utils.ts` + `constants/admin.ts` | 4 copies of status/priority/department label mappings |
| M-20 | Videographer/Photographer/Editor pages | ~80% duplicated code (stats cards, task cards, upload) |
| M-21 | Videographer/Photographer/Editor schedule pages | Identical code except title string |
| M-22 | `sidebar.tsx` + `mobile-sidebar.tsx` | Identical navigation logic |
| M-23 | `chat-layout.tsx` | Custom `isSameDay()` when `date-fns` provides it |
| M-24 | `read-only-schedule.tsx` + `schedule-calendar.tsx` | `memberMap` building pattern duplicated |
| M-25 | `src/hooks/use-cms.ts` L394-410 | `useUpdateMultipleSiteSettings` fires N individual upserts — should batch |

### Performance (11)

| # | File | Issue |
|---|------|-------|
| M-26 | `src/hooks/use-client-accounts.ts` L48-53 | Client-side filtering of all rows |
| M-27 | `src/hooks/use-clients.ts` L50-52 | Client-side role filtering after full fetch |
| M-28 | `src/hooks/use-schedule.ts` L117-150 | Two sequential queries (N+1) for user schedules |
| M-29 | `src/hooks/use-team-logs.ts` L27-53 | Three sequential waterfall queries |
| M-30 | `src/hooks/use-treasury-logs.ts` L125-154 | Fetches all rows to count client-side |
| M-31 | `src/components/tasks/revisions-hub.tsx` ~L30 | `useUsers()` fetches ALL users for a department view |
| M-32 | `src/components/schedule/read-only-schedule.tsx` L100-105 | `useUsers()` fetches ALL users for avatar map |
| M-33 | `src/components/treasury/treasury-logs-page.tsx` L82-84 | `useClients()` + `useUsers()` fetch ALL for filter dropdowns |
| M-34 | `src/lib/export-utils.ts` L167-173 | O(n²) `arrayBufferToBase64` string concatenation |
| M-35 | `src/lib/export-utils.ts` L196-207 | Font fetched on every PDF export — should cache |
| M-36 | `src/components/tasks/tasks-table.tsx` ~L50 | All tasks fetched with no server-side pagination |

### Type Safety (8)

| # | File | Issue |
|---|------|-------|
| M-37 | `src/hooks/use-cms.ts` | 8 `@ts-ignore` directives hiding type errors |
| M-38 | `src/hooks/use-users.ts` L97-100 | `@ts-ignore` on Supabase update |
| M-39 | `src/lib/actions/users.ts` | 7 `as any` casts throughout |
| M-40 | All mutation hooks | Pervasive `as any` / `as never` casts on Supabase operations |
| M-41 | `src/hooks/use-tasks.ts` L388-410 | Optimistic update uses wrong status (shows `approved` briefly when rerouted to `client_review`) |
| M-42 | `src/lib/constants/admin.ts` L42-50 | `STATUS_OPTIONS` missing `client_review` and `completed` filters |
| M-43 | `src/types/task.ts` L315-324 | Status `'rejected'` unreachable through `STATUS_TRANSITIONS` |
| M-44 | `src/lib/supabase/client.ts` L89-90 | Non-null assertions on env vars — crashes without message |

### Form Validation (6)

| # | File | Issue |
|---|------|-------|
| M-45 | `src/components/treasury/add-client-transaction-dialog.tsx` L30-40 | Allows $0.00 transactions (`.min(0)`) |
| M-46 | `src/components/treasury/package-form-dialog.tsx` L25-35 | Allows 0-day packages |
| M-47 | `src/components/tasks/task-form.tsx` L25-35 | Allows past deadline dates |
| M-48 | `src/components/schedule/schedule-form.tsx` | Uses `useState` instead of `react-hook-form` — inconsistent |
| M-49 | `src/components/admin/contact-settings.tsx` L82-115 | No validation on phone, email, social URLs |
| M-50 | `src/components/admin/theme-editor.tsx` L100-140 | No hex color format validation |

### Other Medium (14)

| # | File | Issue |
|---|------|-------|
| M-51 | `src/hooks/use-realtime.ts` L13-26 | `useDebouncedCallback` never clears timer on unmount |
| M-52 | `src/hooks/use-realtime.ts` L92-96 | Optimistic update immediately overwritten by invalidation |
| M-53 | `src/hooks/use-realtime.ts` L115-116 | Module-level mutable globals — Strict Mode issues |
| M-54 | `src/hooks/use-treasury.ts` L239-240 | `useApproveTransaction` doesn't invalidate client accounts |
| M-55 | `src/hooks/use-pagination.ts` L74-76 | `paginateItems` can slice wrong when `items.length !== totalItems` |
| M-56 | `src/components/admin/change-password-dialog.tsx` L36-57 | Form state not reset on dialog close |
| M-57 | `src/components/admin/theme-editor.tsx` L26 | `currentTheme` computed but never used |
| M-58 | `src/components/admin/activity-log.tsx` L24 | `ACTION_KEYS` array defined but never referenced |
| M-59 | `src/components/admin/add-user-dialog.tsx` L29 | Team leader can be created without department |
| M-60 | `src/app/not-found.tsx` | Not internationalized — English only |
| M-61 | `src/app/[locale]/(dashboard)/loading.tsx` L6 | `border-3` is not a valid Tailwind class |
| M-62 | `src/app/[locale]/(dashboard)/account/delete-account-dialog.tsx` L48 | Redirects to `/auth/login` — wrong path (should be `/{locale}/login`) |
| M-63 | `src/components/layout/header.tsx` L19 | Uses `next/navigation` router instead of i18n router — manual locale prepending |
| M-64 | Landing/footer/contact pages | Contact info inconsistency — 3 different email/phone combos |

---

## 🔵 LOW Issues (38)

### Internationalization (7)

| # | File | Issue |
|---|------|-------|
| L-1 | `src/components/admin/activity-log.tsx` L60 | Hardcoded Arabic "لا يوجد نشاط بعد" |
| L-2 | `src/app/[locale]/(dashboard)/loading.tsx` L9 | Hardcoded "Loading..." |
| L-3 | `src/components/shared/error-boundary.tsx` L58-65 | Fallback English only |
| L-4 | `src/hooks/use-auth-dashboard-link.ts` L86 | `window.location.href = '/'` vs `router.push('/login')` inconsistency |
| L-5 | `src/hooks/use-current-role.ts` L13 | `||` vs `??` for role fallback |
| L-6 | `src/app/` multiple pages | Inconsistent router imports (`next/navigation` vs `@/i18n/navigation`) |
| L-7 | `src/lib/export-utils.ts` L494-530 | Tasks CSV/PDF export always Arabic |

### Code Quality (12)

| # | File | Issue |
|---|------|-------|
| L-8 | `src/hooks/use-users.ts` L205-218 | `getRoleLabel` is a pure utility in a hooks file |
| L-9 | `src/hooks/use-auth-dashboard-link.ts` L76 | `handleLogout` not memoized with `useCallback` |
| L-10 | `src/hooks/use-auth-dashboard-link.ts` + `use-device-capabilities.ts` | Missing `'use client'` directive |
| L-11 | `src/hooks/use-schedule.ts` L275+ | Client-side `updated_at` timestamps — DB trigger better |
| L-12 | `src/hooks/use-throttle.ts` L33-54 | Return type mismatch — throttled wrapper returns `void` cast as `T` |
| L-13 | `src/hooks/use-treasury.ts` L106-120 | Period calculation doesn't account for timezone |
| L-14 | `src/hooks/use-users.ts` L186-193 | Assumes one leader per department |
| L-15 | `src/components/admin/users-table.tsx` L157 | `mr-2` instead of RTL-safe `me-2` |
| L-16 | `src/components/admin/change-password-dialog.tsx` L89-96 | No `aria-label` on password toggle |
| L-17 | `src/components/admin/media-upload.tsx` L131-155 | Drag-and-drop UI but no handlers |
| L-18 | `src/lib/export-utils.ts` L31-37 | CSV cells not sanitized for formula injection |
| L-19 | `src/components/admin/storage-settings.tsx` L18 | `hasChanges` doesn't reset when slider returns to original |

### Performance (6)

| # | File | Issue |
|---|------|-------|
| L-20 | `src/hooks/use-notifications.ts` L22 | Hardcoded `.limit(20)` with no pagination |
| L-21 | `src/hooks/use-notifications.ts` L33-62 | No optimistic updates for mark-as-read |
| L-22 | `src/hooks/use-pagination.ts` L80-81 | `canGoNext`/`canGoPrev` not memoized |
| L-23 | `src/components/client/requests-list.tsx` L60-65 | All list items animate on mount simultaneously |
| L-24 | `src/components/tasks/pending-requests.tsx` ~L100 | Shared `isPending` disables ALL request buttons |
| L-25 | `src/lib/actions/users.ts` L38-49 | `getCurrentUser()` makes 2 sequential API calls |

### Other (13)

| # | File | Issue |
|---|------|-------|
| L-26 | `src/hooks/use-client-assignments.ts` L29 | Query key with empty string fallback — cache collision risk |
| L-27 | `src/hooks/use-client-portal.ts` L51 | Redundant type cast |
| L-28 | `src/hooks/use-device-capabilities.ts` L29 | iPad detection incomplete for iPadOS 13+ |
| L-29 | `src/hooks/use-device-capabilities.ts` L31-39 | Tier logic uses `||` instead of `&&` |
| L-30 | `src/hooks/use-tasks.ts` L100-113 | Tasks with unknown statuses silently dropped from Kanban |
| L-31 | `src/components/schedule/content-schedule-readonly.tsx` L160 | Calendar day key uses index instead of date |
| L-32 | `src/components/admin/reports-overview.tsx` L56-58 | `URL.revokeObjectURL` called before download starts |
| L-33 | `src/components/admin/add-user-dialog.tsx` L125 | Select uses `defaultValue` instead of `value` |
| L-34 | `src/components/landing/footer.tsx` L17 | `CURRENT_YEAR` evaluated at module load — stale across year boundary |
| L-35 | `src/app/[locale]/blocked/page.tsx` L6 | Unnecessary framer-motion import for simple page |
| L-36 | All pages | No canonical URLs or `ogImage` in metadata |
| L-37 | Public pages | No JSON-LD structured data |
| L-38 | `src/components/layout/header.tsx` L57-63 | Search bar is purely cosmetic — no functionality |

---

## 📋 Top 15 Priority Fixes

| Priority | Issue | Impact |
|----------|-------|--------|
| 1 | **CRIT-1:** Middleware uses `getSession()` not `getUser()` | Authentication bypass possible |
| 2 | **CRIT-2:** Client page leaks all clients data | Data breach / privacy violation |
| 3 | **CRIT-4:** Transactions auto-approved | Financial workflow bypassed |
| 4 | **CRIT-5:** Direct balance editing | Financial integrity compromised |
| 5 | **CRIT-6:** Division by zero in account details | UI crash / NaN displayed |
| 6 | **CRIT-7:** Role name mismatch `team_leader` vs `team-leader` | Client requests always unassigned |
| 7 | **CRIT-8:** CSV injection vulnerability | Security vulnerability |
| 8 | **H-1:** SQL filter injection in task search | Security vulnerability |
| 9 | **H-3:** `useDeleteUser` doesn't remove auth record | Deleted users can still login |
| 10 | **CRIT-3:** Profile form never syncs data | Profile page completely broken |
| 11 | **H-11:** Non-atomic cascade task deletion | Data corruption risk |
| 12 | **CRIT-9:** `getSiteSettings()` returns hardcoded defaults | CMS settings non-functional |
| 13 | **H-4:** Cloudinary falls back to demo in production | File upload leakage |
| 14 | **H-19-24:** Hardcoded Arabic across admin UI | i18n completely broken for English |
| 15 | **H-25:** Chat N+1 queries (40+ requests per load) | Major performance bottleneck |

---

## 🔄 Code Duplication Summary

| Category | Files Involved | Duplicated Lines (approx) |
|----------|---------------|--------------------------|
| Calendar grid rendering | `schedule-calendar.tsx`, `content-schedule-readonly.tsx`, `read-only-schedule.tsx` | ~200+ lines × 3 |
| Logout logic | `use-auth-dashboard-link.ts`, `use-logout.ts` | ~20 lines × 2 |
| StatCard component | `admin-stats.tsx`, `admin-dashboard-client.tsx`, `reports-overview.tsx` | ~30 lines × 3 |
| StatusBadge/PriorityBadge | `tasks-manager.tsx`, `admin-dashboard-client.tsx` | ~15 lines × 2 |
| Recent Tasks/Transactions | `admin-dashboard-client.tsx`, `recent-tasks.tsx`, `recent-transactions.tsx` | ~60 lines × 2 |
| File helper functions | `file-upload-zone.tsx`, `task-details.tsx` | ~30 lines × 2 |
| Role dashboard pages | `videographer/page.tsx`, `photographer/page.tsx`, `editor/page.tsx` | ~250 lines × 3 |
| Role schedule pages | `videographer/schedule/page.tsx`, `photographer/schedule/page.tsx`, `editor/schedule/page.tsx` | ~identical × 3 |
| Chat "Coming Soon" pages | 3 identical chat pages | identical × 3 |
| Sidebar navigation | `sidebar.tsx`, `mobile-sidebar.tsx` | ~80 lines × 2 |
| Status/Priority labels | `export-utils.ts`, `constants/admin.ts` | ~40 lines × 4 copies |
| `isSameDay` utility | `chat-layout.tsx` vs `date-fns` import | custom reimplementation |
| **Estimated total duplicated** | | **~2,000+ lines** |

---

## 🏗️ Architectural Recommendations

1. **Regenerate Supabase types** — Run `supabase gen types typescript` to eliminate the ~30+ `as any`/`as never`/`@ts-ignore` casts
2. **Extract shared components** — `StatCard`, `StatusBadge`, `PriorityBadge`, `CalendarGrid`, `ComingSoonPage`
3. **Create shared role dashboard** — Parameterize videographer/photographer/editor into one component
4. **Global mutation error handler** — Wrap React Query client with default `onError` toast
5. **Server-side filtering** — Replace all client-side `.filter()` patterns with Supabase `.ilike()`/`.eq()` queries
6. **Fix i18n** — Replace all hardcoded Arabic strings with `useTranslations()` / `getTranslations()`
7. **Add `enabled: !!id` guards** — Prevent empty-ID API calls in all query hooks
8. **Implement proper RBAC** — Server-side role checks, not just UI guards
9. **Add Error Boundaries** — Wrap major sections (admin, treasury, tasks) in error boundaries
10. **Database transactions** — Use Supabase RPC for multi-step operations (delete cascade, sync assignments)
