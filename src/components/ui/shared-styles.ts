/**
 * Shared UI class constants to avoid duplication across dialog, alert-dialog, and sheet components.
 */

/** Overlay animation classes shared by Dialog, AlertDialog, and Sheet */
export const OVERLAY_CLASSES =
  "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50"

/** Content entry/exit animation classes shared by Dialog and AlertDialog */
export const CONTENT_ANIMATION_CLASSES =
  "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"

/** Shared checkbox/radio item base classes for dropdown menus */
export const DROPDOWN_SELECTABLE_ITEM_CLASSES =
  "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pe-2 ps-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"

/** Shared indicator wrapper for dropdown checkbox/radio items */
export const DROPDOWN_INDICATOR_WRAPPER_CLASSES =
  "pointer-events-none absolute start-2 flex size-3.5 items-center justify-center"
