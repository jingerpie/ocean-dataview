import type { SortQuery } from "@sparkyidea/dataview/types";
import { type SQL, sql, type Table } from "drizzle-orm";
import { getColumn } from "./build-filter";

/**
 * Converts sort array to Drizzle orderBy.
 * Silently skips invalid columns (consistent with buildWhere).
 *
 * NULL handling (matches Notion behavior):
 * - ASC: NULLS FIRST (empty values first, then sorted ascending)
 * - DESC: NULLS LAST (sorted descending, then empty values at end)
 *
 * @param table - Drizzle table schema
 * @param sort - Array of sort entries
 * @param options.reverse - Reverse sort direction (for backward pagination)
 */
export function buildSort<T extends Table>(
  table: T,
  sort: SortQuery[],
  options?: { reverse?: boolean }
): SQL[] {
  const reverse = options?.reverse ?? false;

  return sort
    .map((s) => {
      const column = getColumn(table, s.property as keyof T);
      if (!column) {
        return null;
      }
      const isDesc = s.direction === "desc";
      const effectiveDesc = reverse ? !isDesc : isDesc;
      // ASC: NULLS FIRST (empty first), DESC: NULLS LAST (empty last)
      // Use raw SQL for NULLS handling since drizzle doesn't support it natively on SQL type
      return effectiveDesc
        ? sql`${column} DESC NULLS LAST`
        : sql`${column} ASC NULLS FIRST`;
    })
    .filter((col): col is SQL => col !== null);
}

/**
 * Builds orderBy and cursor WHERE for pagination.
 * Uses buildSort internally for orderBy.
 *
 * cursorWhere filters out rows before the cursor position (already-seen pages).
 *
 * @param table - Drizzle table schema
 * @param options.sort - Array of sort entries (should include tiebreaker)
 * @param options.cursor - Cursor ID string
 * @param options.direction - Pagination direction
 */
export function buildCursor<T extends Table>(
  table: T,
  options: {
    sort: SortQuery[];
    cursor?: string | null;
    direction?: "forward" | "backward";
  }
): {
  orderBy: SQL[];
  cursorWhere?: SQL;
} {
  const { sort, cursor, direction = "forward" } = options;
  const reverse = direction === "backward";

  // Build orderBy using buildSort
  const orderBy = buildSort(table, sort, { reverse });

  // If no cursor, just return orderBy
  if (!cursor) {
    return { orderBy };
  }

  // Filter to valid columns only (for cursor building)
  const validSort = sort.filter((s) => {
    const column = getColumn(table, s.property as keyof T);
    return column !== undefined;
  });

  if (validSort.length === 0) {
    return { orderBy };
  }

  // Build cursor WHERE condition
  const rowValues = validSort.map((s) =>
    getColumn(table, s.property as keyof T)
  );

  const cursorValues = validSort.map((s) => {
    const column = getColumn(table, s.property as keyof T);
    return sql`(SELECT ${sql.identifier(column.name)} FROM ${table} WHERE "id" = ${cursor})`;
  });

  // Use last sort field's direction for comparison operator
  const lastDirection = validSort.at(-1)?.direction ?? "desc";
  const isDesc = lastDirection === "desc";
  const op = reverse === isDesc ? sql.raw(">") : sql.raw("<");
  const cursorWhere = sql`(${sql.join(rowValues, sql`, `)}) ${op} (${sql.join(cursorValues, sql`, `)})`;

  return { orderBy, cursorWhere };
}
