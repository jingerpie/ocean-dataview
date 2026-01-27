import {
  isWhereExpression,
  type WhereNode,
  type WhereRule,
} from "@ocean-dataview/shared/types";
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";
import {
  type AnyColumn,
  and,
  eq,
  gt,
  gte,
  inArray,
  isNotNull,
  isNull,
  lt,
  lte,
  ne,
  notInArray,
  or,
  type SQL,
  sql,
  type Table,
} from "drizzle-orm";

// ============================================
// Date-only string helpers for midnight boundary logic
// ============================================

/** Regex to detect date-only strings (YYYY-MM-DD) */
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** Check if value is a date-only string (no time component) */
function isDateOnlyString(value: unknown): value is string {
  return typeof value === "string" && DATE_ONLY_REGEX.test(value);
}

/** Get midnight (00:00:00) of the date */
function toMidnight(dateStr: string): Date {
  return startOfDay(parseISO(dateStr));
}

/** Get midnight (00:00:00) of the next day */
function toNextMidnight(dateStr: string): Date {
  return addDays(startOfDay(parseISO(dateStr)), 1);
}

/**
 * Converts filter array to Drizzle SQL conditions.
 * Root is always AND (implicit). Handles nested AND/OR expressions.
 *
 * @param table - Drizzle table schema
 * @param filter - Array of WhereNode (WhereRule or WhereExpression)
 * @returns SQL condition or undefined if no valid filter
 *
 * @example
 * ```typescript
 * // Simple filter (array of rules)
 * const where = buildWhere(listing, [
 *   { property: "price", condition: "gt", value: 100 },
 *   { property: "status", condition: "eq", value: "active" }
 * ]);
 *
 * // With nested OR
 * const where = buildWhere(listing, [
 *   { property: "status", condition: "eq", value: "active" },
 *   { or: [
 *     { property: "type", condition: "eq", value: "A" },
 *     { property: "type", condition: "eq", value: "B" }
 *   ]}
 * ]);
 * ```
 */
export function buildWhere<T extends Table>(
  table: T,
  filter: WhereNode[] | null | undefined
): SQL | undefined {
  if (!filter || filter.length === 0) {
    return undefined;
  }

  const conditions = filter
    .map((node) => buildNode(table, node))
    .filter((c): c is SQL => c !== undefined);

  return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Recursively build SQL for any WhereNode (rule or expression)
 */
function buildNode<T extends Table>(
  table: T,
  node: WhereNode
): SQL | undefined {
  if (isWhereExpression(node)) {
    if (node.or) {
      const conditions = node.or
        .map((n) => buildNode(table, n))
        .filter((c): c is SQL => c !== undefined);
      return conditions.length > 0 ? or(...conditions) : undefined;
    }
    if (node.and) {
      const conditions = node.and
        .map((n) => buildNode(table, n))
        .filter((c): c is SQL => c !== undefined);
      return conditions.length > 0 ? and(...conditions) : undefined;
    }
    return undefined;
  }

  // WhereRule
  return buildCondition(table, node);
}

/**
 * Builds SQL condition for a single filter rule.
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex SQL condition building logic
function buildCondition<T extends Table>(
  table: T,
  filter: WhereRule
): SQL | undefined {
  const { property, condition, value } = filter;
  const column = getColumn(table, property as keyof T);

  if (!column) {
    return undefined;
  }

  switch (condition) {
    // ============================================
    // Text conditions (handle wildcards internally)
    // Uses CAST(column AS TEXT) for uniform search across all column types
    // ============================================
    case "iLike":
      return typeof value === "string"
        ? sql`CAST(${column} AS TEXT) ILIKE ${`%${value}%`}`
        : undefined;

    case "notILike":
      return typeof value === "string"
        ? sql`CAST(${column} AS TEXT) NOT ILIKE ${`%${value}%`}`
        : undefined;

    case "startsWith":
      return typeof value === "string"
        ? sql`CAST(${column} AS TEXT) ILIKE ${`${value}%`}`
        : undefined;

    case "endsWith":
      return typeof value === "string"
        ? sql`CAST(${column} AS TEXT) ILIKE ${`%${value}`}`
        : undefined;

    // ============================================
    // Equality conditions (with date-only midnight boundary support)
    // ============================================
    case "eq":
      // Date-only strings: match entire day (>= day 00:00 AND < nextDay 00:00)
      if (isDateOnlyString(value)) {
        return and(
          gte(column, toMidnight(value)),
          lt(column, toNextMidnight(value))
        );
      }
      return eq(column, value);

    case "ne":
      return ne(column, value);

    // ============================================
    // Comparison conditions (with date-only midnight boundary support)
    // ============================================
    case "lt":
      // Date-only: "before Nov 5" means < Nov 5 00:00
      if (isDateOnlyString(value)) {
        return lt(column, toMidnight(value));
      }
      return lt(column, value);

    case "lte":
      // Date-only: "on or before Nov 5" means < Nov 6 00:00
      if (isDateOnlyString(value)) {
        return lt(column, toNextMidnight(value));
      }
      return lte(column, value);

    case "gt":
      // Date-only: "after Nov 5" means >= Nov 6 00:00
      if (isDateOnlyString(value)) {
        return gte(column, toNextMidnight(value));
      }
      return gt(column, value);

    case "gte":
      // Date-only: "on or after Nov 5" means >= Nov 5 00:00
      if (isDateOnlyString(value)) {
        return gte(column, toMidnight(value));
      }
      return gte(column, value);

    // ============================================
    // Array conditions
    // ============================================
    case "inArray":
      return Array.isArray(value) ? inArray(column, value) : undefined;

    case "notInArray":
      return Array.isArray(value) ? notInArray(column, value) : undefined;

    // ============================================
    // Range condition (with date-only midnight boundary support)
    // ============================================
    case "isBetween":
      if (Array.isArray(value) && value.length === 2) {
        const [min, max] = value;
        const conditions: SQL[] = [];
        if (min != null) {
          // Date-only: use >= day 00:00
          conditions.push(
            isDateOnlyString(min)
              ? gte(column, toMidnight(min))
              : gte(column, min)
          );
        }
        if (max != null) {
          // Date-only: use < nextDay 00:00 (includes all of max day)
          conditions.push(
            isDateOnlyString(max)
              ? lt(column, toNextMidnight(max))
              : lte(column, max)
          );
        }
        return conditions.length > 0 ? and(...conditions) : undefined;
      }
      return undefined;

    // ============================================
    // Date relative condition
    // ============================================
    case "isRelativeToToday": {
      if (
        !value ||
        typeof value !== "object" ||
        !("direction" in value) ||
        !("unit" in value)
      ) {
        return undefined;
      }

      const {
        direction,
        count = 1,
        unit,
      } = value as {
        direction: "past" | "this" | "next";
        count?: number;
        unit: "day" | "week" | "month" | "year";
      };
      const now = new Date();
      const range = getRelativeDateRange(now, direction, count, unit);

      if (!range) {
        return undefined;
      }
      return and(gte(column, range.start), lte(column, range.end));
    }

    // ============================================
    // Empty conditions
    // ============================================
    case "isEmpty":
      // For text columns, empty string '' is also considered empty
      if (isTextColumn(table, property as keyof T)) {
        return or(isNull(column), eq(column, ""));
      }
      return isNull(column);

    case "isNotEmpty":
      // For text columns, empty string '' is also considered empty
      if (isTextColumn(table, property as keyof T)) {
        return and(isNotNull(column), ne(column, ""));
      }
      return isNotNull(column);

    default:
      // Unknown condition - skip silently
      return undefined;
  }
}

/**
 * Helper to get typed column from table
 */
export function getColumn<T extends Table>(
  table: T,
  columnKey: keyof T
): AnyColumn {
  return table[columnKey] as AnyColumn;
}

/**
 * Check if a column is a text/string type in the database.
 * Used for isEmpty/isNotEmpty to handle empty string '' as empty for text columns.
 *
 * Note: We check `columnType` (PostgreSQL type) not `dataType` (JS type)
 * because columns like timestamp can have `mode: "string"` which sets
 * dataType to "string" even though they're not text columns in the DB.
 */
function isTextColumn<T extends Table>(table: T, columnKey: keyof T): boolean {
  const column = table[columnKey] as AnyColumn;
  if (!column) {
    return false;
  }

  // Check the PostgreSQL column type (e.g., 'PgText', 'PgVarchar', 'PgChar')
  const columnType = (column as { columnType?: string }).columnType;
  return (
    columnType === "PgText" ||
    columnType === "PgVarchar" ||
    columnType === "PgChar"
  );
}

/**
 * Gets the date range for relative date filters.
 * Supports direction (past/this/next), count, and unit (day/week/month/year).
 */
function getRelativeDateRange(
  now: Date,
  direction: "past" | "this" | "next",
  count: number,
  unit: "day" | "week" | "month" | "year"
): { start: Date; end: Date } | undefined {
  // For "this" direction, count is always 1
  const n = direction === "this" ? 1 : count;

  switch (unit) {
    case "day":
      if (direction === "past") {
        return {
          start: startOfDay(subDays(now, n)),
          end: endOfDay(subDays(now, 1)),
        };
      }
      if (direction === "next") {
        return {
          start: startOfDay(addDays(now, 1)),
          end: endOfDay(addDays(now, n)),
        };
      }
      // this
      return { start: startOfDay(now), end: endOfDay(now) };

    case "week":
      if (direction === "past") {
        return {
          start: startOfWeek(subWeeks(now, n)),
          end: endOfWeek(subWeeks(now, 1)),
        };
      }
      if (direction === "next") {
        return {
          start: startOfWeek(addWeeks(now, 1)),
          end: endOfWeek(addWeeks(now, n)),
        };
      }
      // this
      return { start: startOfWeek(now), end: endOfWeek(now) };

    case "month":
      if (direction === "past") {
        return {
          start: startOfMonth(subMonths(now, n)),
          end: endOfMonth(subMonths(now, 1)),
        };
      }
      if (direction === "next") {
        return {
          start: startOfMonth(addMonths(now, 1)),
          end: endOfMonth(addMonths(now, n)),
        };
      }
      // this
      return { start: startOfMonth(now), end: endOfMonth(now) };

    case "year":
      if (direction === "past") {
        return {
          start: startOfYear(subYears(now, n)),
          end: endOfYear(subYears(now, 1)),
        };
      }
      if (direction === "next") {
        return {
          start: startOfYear(addYears(now, 1)),
          end: endOfYear(addYears(now, n)),
        };
      }
      // this
      return { start: startOfYear(now), end: endOfYear(now) };

    default:
      return undefined;
  }
}
