# UI Components Audit Report

**Date:** March 2, 2026  
**Scope:** `src/components/ui/` — 38 files  
**Categories:** Performance | Clean Code | Duplicate Code

---

## 🔴 Critical Issues

### 1. `image-uploader.tsx` is 100% duplicate of `media-uploader.tsx`
- **Type:** Duplicate Code  
- `ImageUploader` is a strict subset of `MediaUploader`. Both:
  - Upload files to Cloudinary with identical logic
  - Show grid thumbnails with remove buttons
  - Show label with counter badge (`{value.length}/{max}`)
  - Use the same state management (`uploading`, `value`, `onChange`)
- **Fix:** Delete `image-uploader.tsx` entirely and replace all usages with `<MediaUploader accept="image/*" />` (add an `accept` prop to `MediaUploader`).

### 2. `custom-cursor.tsx` — `getComputedStyle()` on every mouse move
- **Type:** Performance (Critical)  
- **Line 27:** `window.getComputedStyle(target)` is called on **every** `mousemove` event. This forces a style recalculation and is extremely expensive (~1ms per call at 60fps = constant jank).
- `setIsPointer()` is also called on every move even when the value hasn't changed, causing unnecessary re-renders.
- **Fix:** Throttle/debounce the mousemove handler (e.g., `requestAnimationFrame`), and only call `setIsPointer` when the value actually changes.

### 3. `emoji-textarea.tsx` — Imports entire emoji dataset eagerly
- **Type:** Performance (Bundle Size)  
- **Line 11-12:** `import data from '@emoji-mart/data'` and `import Picker from '@emoji-mart/react'` are imported eagerly. The emoji-mart data alone is **~1.4MB**. This is loaded even if the emoji picker is never opened.
- **Fix:** Use `React.lazy()` or `next/dynamic` to lazy-load the Picker component. Load `data` on demand.

---

## 🟡 Performance Issues

### 4. `calendar.tsx` — `getDefaultClassNames()` called redundantly
- **File:** `calendar.tsx`
- **Lines 31, 177:** `getDefaultClassNames()` is called both in the `Calendar` component body and again inside `CalendarDayButton`. For a calendar with 42 day cells, this function runs 43 times per render (1 + 42).
- **Fix:** Call it once in `Calendar` and pass the result via props or context to `CalendarDayButton`.

### 5. `custom-cursor.tsx` — Animation uses `left/top` instead of `transform`
- **Line 50-51:** `willChange: 'transform'` is set, but the animation actually animates `left` and `top` CSS properties. Animating `left/top` triggers layout recalculation. Using `transform: translate()` would be GPU-accelerated and much smoother.
- **Fix:** Switch from `left/top` to `transform: translate(x, y)` for the cursor elements.

### 6. `GlareHover.tsx` — Hex-to-RGBA conversion runs on every render
- **Lines 37-47:** The hex color parsing and RGBA conversion runs on every render without memoization.
- **Fix:** Wrap the conversion in `useMemo` keyed on `glareColor` and `glareOpacity`.

### 7. `tooltip.tsx` — Each Tooltip creates its own Provider
- **Lines 25-29:** Every `<Tooltip>` wraps itself in a new `<TooltipProvider>`. With many tooltips on a page, this creates unnecessary context providers.
- **Fix:** Have a single `<TooltipProvider>` at the app root and remove it from individual `<Tooltip>` components.

### 8. `media-uploader.tsx` — No file size validation
- **Lines 127-128:** The hint text mentions "up to 200MB for video, 10MB for images" but there is **no actual validation** before uploading. Large files will start uploading and only fail at the server or timeout.
- **Fix:** Add client-side file size validation before calling `uploadToCloudinary()`.

### 9. `image-uploader.tsx` — `Promise.all` for simultaneous uploads
- **Line 47-49:** All selected files upload simultaneously via `Promise.all`. With 10 images, this creates 10 concurrent network requests that can overwhelm the connection.
- **Fix:** Use a concurrency limiter (e.g., upload 3 at a time) or sequential uploads like `media-uploader.tsx` does.

### 10. `split-text.tsx` — IntersectionObserver re-created on prop change
- **Lines 43-54:** The observer is created inside `useEffect` with `[threshold, rootMargin]` dependencies. If these props change, a new observer is created without properly cleaning up the old one (cleanup runs, but triggers re-observation).
- Minor: No guard against setting state after unmount (though React 18+ handles this).

---

## 🟡 Clean Code Issues

### 11. `command.tsx` — Uses outdated `React.forwardRef` pattern
- **Entire file:** Uses `React.forwardRef` for all components (`Command`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandSeparator`, `CommandItem`).
- Every other file in the folder uses the modern `function Component()` pattern with `React.ComponentProps`.
- Also requires `.displayName` assignments on every component.
- **Fix:** Migrate to the same `function Component({ className, ...props }: React.ComponentProps<...>)` pattern used everywhere else.

### 12. `pagination.tsx` — Uses outdated `React.forwardRef` pattern
- **Same issue as #11.** Uses `React.forwardRef` for `PaginationContent`, `PaginationItem` while rest of the codebase uses modern pattern.

### 13. `command.tsx` — Empty interface
- **Line 28:** `interface CommandDialogProps extends DialogProps {}` adds nothing. It should just use `DialogProps` directly.

### 14. `split-text.tsx` — Uses `any` type
- **Lines 14-15:** `animationFrom` and `animationTo` are typed as `any`. Should use Framer Motion's `TargetAndTransition` or `Variant` type.

### 15. `split-text.tsx` — Conflicting CSS classes
- **Line 79:** `className="block w-full flex flex-wrap gap-[0.25em]"` — `block` and `flex` are conflicting display values. `flex` wins but `block` is dead code.

### 16. `split-text.tsx` — Dual exports (named + default)
- **Lines 101-102:** Both `export const SplitText` and `export default SplitText` exist. Pick one pattern and stick with it. The rest of the codebase uses named exports exclusively.

### 17. `skeleton.tsx` — Missing React import
- **Line 1:** Uses `React.ComponentProps<"div">` without importing React. This works in Next.js JSX transform but is inconsistent with every other file that has `import * as React from "react"`.

### 18. `popover.tsx` — Mismatched element type
- **Line 73:** `PopoverTitle` renders a `<div>` but types its props as `React.ComponentProps<"h2">`. The element and type should match.

### 19. `pagination.tsx` — Hardcoded English text
- **Lines 69, 82:** "Previous", "Next", and "More pages" are hardcoded in English. Other custom components (`emoji-textarea.tsx`, `image-uploader.tsx`, `media-uploader.tsx`, `links-input.tsx`) support Arabic/English i18n. This is inconsistent.

### 20. `sonner.tsx` — Inconsistent component declaration style
- Uses `const Toaster = () => {}` arrow function while 95% of the codebase uses `function Toaster() {}` declaration.

### 21. Using array index as `key` in dynamic lists
- **`image-uploader.tsx` line 73:** `key={i}` for images that can be reordered/removed
- **`media-uploader.tsx` line 143:** `key={i}` for media items that can be reordered/removed
- **`links-input.tsx` line 57:** `key={i}` for link items that can be reordered/removed
- **Fix:** Use the URL or a unique ID as the key instead of array index.

### 22. Inconsistent icon sizing convention
- **`command.tsx`:** Uses `h-4 w-4`, `h-5 w-5` (Tailwind v3 style)
- **Other files (dialog, dropdown-menu, etc.):** Use `size-4`, `size-3.5` (Tailwind v4 style)
- **Fix:** Standardize to `size-*` throughout.

---

## 🔵 Duplicate Code Issues

### 23. `dialog.tsx` ↔ `alert-dialog.tsx` — Near-identical overlay/animation
- Both `DialogOverlay` and `AlertDialogOverlay` have the **exact same** className:
  ```
  "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50"
  ```
- Both `DialogDescription` and `AlertDialogDescription` share: `"text-muted-foreground text-sm"`
- Content animation classes are also nearly identical.
- **Fix:** Extract shared overlay/animation classNames into constants or a shared utility.

### 24. `dialog.tsx` ↔ `sheet.tsx` — Same Radix primitive, duplicate overlay
- Both import `@radix-ui/react-dialog` and create identical overlay styling.
- Both implement a close button with `XIcon` and identical patterns.
- **Fix:** Extract a shared `Overlay` component and shared close-button component.

### 25. `dropdown-menu.tsx` — Internal item duplication
- `DropdownMenuCheckboxItem` (line 93) and `DropdownMenuRadioItem` (line 116) share ~90% identical className:
  ```
  "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pe-2 ps-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
  ```
- Both have the same indicator wrapper: `<span className="pointer-events-none absolute start-2 flex size-3.5 items-center justify-center">`
- **Fix:** Extract shared classes into a constant.

### 26. Repeated `"text-muted-foreground text-sm"` pattern
- Used identically in: `card.tsx` (CardDescription), `dialog.tsx` (DialogDescription), `alert-dialog.tsx` (AlertDialogDescription), `form.tsx` (FormDescription, FormMessage), `popover.tsx` (PopoverDescription)
- Not a major issue since these are Radix/shadcn conventions, but could be a shared constant.

### 27. `image-uploader.tsx` ↔ `media-uploader.tsx` — Duplicate upload button UI
- Both have identical "dashed border upload area" patterns:
  ```tsx
  <label className={cn(
    'border-2 border-dashed rounded-xl aspect-square flex flex-col items-center justify-center cursor-pointer transition-colors',
    uploading ? '...' : '...'
  )}>
  ```
- Both have identical remove button:
  ```tsx
  <button className="absolute top-1 end-1 bg-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
    <X className="h-3 w-3 text-white" />
  </button>
  ```

---

## 📊 Summary

| Category | Critical | Medium | Low | Total |
|----------|----------|--------|-----|-------|
| Performance | 3 | 4 | 3 | **10** |
| Clean Code | 0 | 6 | 6 | **12** |
| Duplicate Code | 1 | 3 | 2 | **6** |
| **Total** | **4** | **13** | **11** | **28** |

### Priority Fixes (by impact):
1. ⛔ Delete `image-uploader.tsx` — replace with `media-uploader.tsx` (duplicate elimination)
2. ⛔ Fix `custom-cursor.tsx` `getComputedStyle` on every mousemove (perf)
3. ⛔ Lazy-load emoji-mart in `emoji-textarea.tsx` (bundle size ~1.4MB saved)
4. 🟡 Migrate `command.tsx` and `pagination.tsx` to modern function pattern (consistency)
5. 🟡 Add file size validation in `media-uploader.tsx` (UX + perf)
6. 🟡 Fix `split-text.tsx` type safety and conflicting classes (code quality)
7. 🟡 Extract shared overlay classes from dialog/alert-dialog/sheet (DRY)
8. 🔵 Standardize icon sizing to `size-*` (consistency)
9. 🔵 Use proper keys instead of array index (React best practice)
10. 🔵 Add i18n to pagination component (consistency)
