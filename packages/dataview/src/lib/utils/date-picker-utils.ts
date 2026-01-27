import { parseDate as chronoParseDate } from "chrono-node";
import { formatISO, parseISO } from "date-fns";

/** Regex to detect date-only strings (YYYY-MM-DD) */
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Format Date instance for text inputs using Month Day, Year pattern.
 */
export function formatDateForDisplay(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format Date to date-only string (YYYY-MM-DD) for URL/filter usage.
 * Produces cleaner URLs and avoids timezone issues.
 */
export function toDateOnlyString(date: Date): string {
  return formatISO(date, { representation: "date" });
}

/**
 * Parse natural language date strings via chrono.
 */
export function parseDate(text: string): Date | null {
  if (!text) {
    return null;
  }
  return chronoParseDate(text);
}

/**
 * Normalize ISO string or timestamp values to Date instances.
 *
 * CRITICAL: Uses parseISO for date-only strings (YYYY-MM-DD) to interpret
 * them as LOCAL time. Using new Date("2025-11-05") would parse as UTC midnight,
 * which displays as Nov 4 in US timezones.
 */
export function parseValue(
  value: string | number | undefined
): Date | undefined {
  if (!value) {
    return undefined;
  }

  // Date-only strings: use parseISO to interpret as LOCAL time
  if (typeof value === "string" && DATE_ONLY_REGEX.test(value)) {
    const date = parseISO(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  // Full ISO strings or timestamps: use native Date parsing
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}
