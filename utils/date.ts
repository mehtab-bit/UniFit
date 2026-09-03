/**
 * Centralized Date Utilities for UniFit.
 * Provides a single source of truth for current/demo dates across the application.
 */

/**
 * Returns the active app date (today). The app is now wired to the live
 * engine and Supabase, so we use the real current date instead of a frozen
 * demo date — frozen dates silently mislabeled "today" in calendars.
 */
export function getAppToday(): Date {
  return new Date();
}

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const DAYS_OF_WEEK_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const DAYS_OF_WEEK_FULL = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

/**
 * Formats date into ISO string YYYY-MM-DD
 */
export function formatDateISO(date: Date = getAppToday()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Formats date for month and year header (e.g. "September 2026")
 */
export function formatMonthYear(year: number, monthIndex: number): string {
  return `${MONTH_NAMES[monthIndex]} ${year}`;
}

/**
 * Formats date for user-facing headers (e.g. "Saturday, Sep 26")
 */
export function formatDateReadable(date: Date = getAppToday()): string {
  const dayName = DAYS_OF_WEEK_FULL[date.getDay()];
  const monthName = MONTH_NAMES[date.getMonth()].slice(0, 3);
  const dayNum = date.getDate();
  return `${dayName}, ${monthName} ${dayNum}`;
}

/**
 * Adds days to a given Date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Adds months to a given Date
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Checks if two dates are on the same calendar day
 */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
