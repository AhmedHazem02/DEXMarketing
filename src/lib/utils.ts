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
 * Converts a "HH:mm" or "HH:mm:ss" time string to 12-hour format (e.g. "3:30 PM").
 */
export function formatTime12h(time: string): string {
  const [hourStr, minuteStr] = time.split(':')
  const hour = parseInt(hourStr, 10)
  const minute = minuteStr || '00'
  const period = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  return `${hour12}:${minute} ${period}`
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
