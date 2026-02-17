import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sanitize search input to prevent PostgREST filter injection.
 * Strips characters that have special meaning in PostgREST filters.
 */
export function sanitizeSearch(input: string): string {
  return input.replace(/[(),.*%\\]/g, '').trim()
}

/**
 * Get the start and end date strings for a given year/month range.
 * Useful for calendar/schedule queries.
 */
export function getMonthRange(year: number, month: number): { startDate: string; endDate: string } {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = month === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(month + 1).padStart(2, '0')}-01`
  return { startDate, endDate }
}
