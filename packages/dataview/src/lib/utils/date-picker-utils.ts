import { parseDate as chronoParseDate } from "chrono-node";

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
 */
export function parseValue(
  value: string | number | undefined
): Date | undefined {
  if (!value) {
    return undefined;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}
