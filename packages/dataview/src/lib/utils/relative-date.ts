import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";

export type RelativeDirection = "past" | "this" | "next";
export type RelativeUnit = "day" | "week" | "month" | "year";

/**
 * Relative date value as positional array: [direction, count, unit]
 * Used in filter values and URL params for compact representation.
 */
export type RelativeToTodayValue = [RelativeDirection, number, RelativeUnit];

/**
 * Calculate date range for relative date filter.
 * Returns start and end dates for the given direction, count, and unit.
 *
 * Behavior:
 * - "this": Calendar boundaries (this month = Jan 1-31, this year = Jan 1 - Dec 31)
 * - "past N": N units ago to today (includes today)
 * - "next N": Today to N units in the future (includes today)
 *
 * Example (today = Jan 28, 2026):
 * - Past 1 month: Dec 28, 2025 - Jan 28, 2026
 * - Next 1 month: Jan 28, 2026 - Feb 28, 2026
 * - This month: Jan 1, 2026 - Jan 31, 2026
 */
export function getRelativeDateRange(
  now: Date,
  direction: RelativeDirection,
  count: number,
  unit: RelativeUnit
): { start: Date; end: Date } | undefined {
  // "this" uses calendar boundaries
  if (direction === "this") {
    switch (unit) {
      case "day":
        return { start: startOfDay(now), end: endOfDay(now) };
      case "week":
        return { start: startOfWeek(now), end: endOfWeek(now) };
      case "month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "year":
        return { start: startOfYear(now), end: endOfYear(now) };
      default:
        return undefined;
    }
  }

  // "past" and "next" use relative offsets from today (includes today)
  const subUnit = (date: Date, n: number): Date => {
    switch (unit) {
      case "day":
        return subDays(date, n);
      case "week":
        return subWeeks(date, n);
      case "month":
        return subMonths(date, n);
      case "year":
        return subYears(date, n);
      default:
        return date;
    }
  };

  const addUnit = (date: Date, n: number): Date => {
    switch (unit) {
      case "day":
        return addDays(date, n);
      case "week":
        return addWeeks(date, n);
      case "month":
        return addMonths(date, n);
      case "year":
        return addYears(date, n);
      default:
        return date;
    }
  };

  if (direction === "past") {
    return {
      start: startOfDay(subUnit(now, count)),
      end: endOfDay(now),
    };
  }

  if (direction === "next") {
    return {
      start: startOfDay(now),
      end: endOfDay(addUnit(now, count)),
    };
  }

  return undefined;
}
