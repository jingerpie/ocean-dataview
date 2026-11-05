import type { SortQuery } from "@sparkyidea/dataview/types";
import { type AnyColumn, type SQL, sql, type Table } from "drizzle-orm";
import { getColumn } from "./build-filter";

/**
 * Converts sort array to Drizzle orderBy.
 * Silently skips invalid columns (consistent with buildWhere).
 *
 * NULL handling (matches Notion behavior): empty/NULL values are always
 * placed at the bottom of the user-facing order, regardless of direction.
 *
 *   user ASC  → `col ASC  NULLS LAST`
 *   user DESC → `col DESC NULLS LAST`
 *
 * For backward pagination we flip the direction so we can use LIMIT and then
 * reverse the page client-side; the NULL position must flip too so that the
 * effective order is exactly the reverse of the user-facing order:
 *
 *   user ASC  reversed → `col DESC NULLS FIRST` (user-facing NULLs-at-bottom
 *                                                appear at the top of the
 *                                                reversed page, then descend)
 *   user DESC reversed → `col ASC  NULLS FIRST`
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
      const userIsDesc = s.direction === "desc";
      const effectiveDesc = userIsDesc !== reverse;
      // Forward: NULLs always at the bottom of user-facing order.
      // Backward: NULLs flip to the top of the effective (reversed) order.
      const directionClause = effectiveDesc ? sql.raw("DESC") : sql.raw("ASC");
      const nullsClause = reverse
        ? sql.raw("NULLS FIRST")
        : sql.raw("NULLS LAST");
      return sql`${column} ${directionClause} ${nullsClause}`;
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
  const validSort: { entry: SortQuery; column: AnyColumn }[] = [];
  for (const entry of sort) {
    const column = getColumn(table, entry.property as keyof T);
    if (column !== undefined) {
      validSort.push({ entry, column });
    }
  }

  if (validSort.length === 0) {
    return { orderBy };
  }

  // Build cursor WHERE that matches the orderBy NULL semantics produced by
  // buildSort above. User-facing order is always NULLS LAST; backward
  // pagination flips both direction and NULL position to NULLS FIRST.
  //
  // For each level the predicate must keep rows that come strictly AFTER the
  // cursor in the *effective* order:
  //
  //   nullsLast  + ASC  → larger non-NULL values, then NULLs
  //   nullsLast  + DESC → smaller non-NULL values, then NULLs
  //   nullsFirst + ASC  → non-NULL values larger than cursor (NULLs are already past)
  //   nullsFirst + DESC → non-NULL values smaller than cursor (NULLs are already past)
  //
  // The naive row-constructor comparison `(a,b) < (c,d)` evaluates to NULL
  // whenever any operand is NULL, which silently drops valid rows (and returns
  // nothing when the cursor's own value is NULL). Expand the predicate
  // explicitly with NULL-aware branches per level instead.
  //
  // Stale-cursor guard: a scalar `(SELECT col FROM t WHERE id = cursor)`
  // returns NULL both when the row exists with a NULL column AND when the row
  // is missing entirely. The two cases are indistinguishable inside the
  // predicate, so backward (NULLS FIRST) pagination against a deleted cursor
  // would degrade to "every non-NULL row" instead of an empty page. Gating
  // the whole predicate on EXISTS short-circuits to false when the cursor row
  // is gone, returning an empty page rather than unrelated rows.
  function buildLevel(i: number): SQL {
    const level = validSort[i];
    if (!level) {
      throw new Error("buildLevel called past end of validSort");
    }
    const { entry, column } = level;
    const userIsDesc = entry.direction === "desc";
    const effectiveDesc = userIsDesc !== reverse;
    const nullsLast = !reverse;
    const cursorVal = sql`(SELECT ${sql.identifier(column.name)} FROM ${table} WHERE "id" = ${cursor})`;

    const nonNullAfter = effectiveDesc
      ? sql`(${column} IS NOT NULL AND ${cursorVal} IS NOT NULL AND ${column} < ${cursorVal})`
      : sql`(${column} IS NOT NULL AND ${cursorVal} IS NOT NULL AND ${column} > ${cursorVal})`;

    // NULL boundary: with NULLS LAST a NULL row sits AFTER a non-NULL cursor;
    // with NULLS FIRST a non-NULL row sits AFTER a NULL cursor.
    const nullBoundary = nullsLast
      ? sql`(${column} IS NULL AND ${cursorVal} IS NOT NULL)`
      : sql`(${column} IS NOT NULL AND ${cursorVal} IS NULL)`;

    const after = sql`(${nonNullAfter} OR ${nullBoundary})`;

    if (i === validSort.length - 1) {
      return after;
    }

    // "equal on this level": both NULL, or both non-NULL and equal.
    const equal = sql`((${column} IS NULL AND ${cursorVal} IS NULL) OR (${column} IS NOT NULL AND ${cursorVal} IS NOT NULL AND ${column} = ${cursorVal}))`;
    return sql`(${after} OR (${equal} AND ${buildLevel(i + 1)}))`;
  }

  return {
    orderBy,
    cursorWhere: sql`EXISTS (SELECT 1 FROM ${table} WHERE "id" = ${cursor}) AND ${buildLevel(0)}`,
  };
}
