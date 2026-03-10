import type { ParsedGroupConfig } from "@sparkyidea/shared/types";
import { asc, desc, gt, lt, type SQL, sql, type Table } from "drizzle-orm";
import { getColumn } from "./filter-columns";

// Regex for parsing number range groups (e.g., "100-200")
const NUMBER_RANGE_REGEX = /^(\d+)-(\d+)$/;

// Status config structure for group mapping
interface StatusConfig {
  groups?: Array<{ label: string; color: string; options: string[] }>;
}

interface PropertyConfig {
  config?: StatusConfig;
  type:
    | "checkbox"
    | "date"
    | "multiSelect"
    | "number"
    | "select"
    | "status"
    | "text";
}

interface GroupByResult {
  groupKey: SQL;
  orderBy: SQL;
}

interface GroupCursorResult {
  cursorFilter: SQL | undefined;
  orderByClause: SQL;
}

/**
 * Builds orderBy clause and cursor filter for group pagination.
 *
 * Unlike row-level buildCursor which uses ID-based subquery lookup,
 * group cursors use the sort value directly since groups don't have IDs.
 *
 * @param options.orderBy - The SQL expression used for ordering groups
 * @param options.cursor - The cursor value (sort value from previous page)
 * @param options.sort - Sort direction ("asc" or "desc", defaults to "asc")
 * @returns orderByClause with direction applied, and cursorFilter for pagination
 *
 * @example
 * const { orderByClause, cursorFilter } = buildGroupCursor({
 *   orderBy: groupByResult.orderBy,
 *   cursor: input.cursor,
 *   sort: "desc",
 * });
 * // Use in query: .having(cursorFilter).orderBy(orderByClause)
 */
export function buildGroupCursor(options: {
  orderBy: SQL;
  cursor?: string | null;
  sort?: "asc" | "desc";
}): GroupCursorResult {
  const { orderBy, cursor, sort = "asc" } = options;
  const isDesc = sort === "desc";

  // Build orderBy with direction
  const orderByClause = isDesc ? desc(orderBy) : asc(orderBy);

  // If no cursor, no filter needed
  if (!cursor) {
    return { orderByClause, cursorFilter: undefined };
  }

  // For desc: use lt() since we want values "less than" the cursor
  // For asc: use gt() since we want values "greater than" the cursor
  const cursorFilter = isDesc ? lt(orderBy, cursor) : gt(orderBy, cursor);

  return { orderByClause, cursorFilter };
}

/**
 * Build SQL CASE expression for relative date grouping.
 *
 * Returns the START DATE of each bucket as ISO timestamp for type-safe client handling.
 * Client uses this date + showAs="relative" to format the display label.
 *
 * Buckets (in chronological order):
 * - Past months → first of that month
 * - Last 30 days (8-30 days ago) → CURRENT_DATE - 30
 * - Last 7 days (2-7 days ago) → CURRENT_DATE - 7
 * - Yesterday → CURRENT_DATE - 1
 * - Today → CURRENT_DATE
 * - Tomorrow → CURRENT_DATE + 1
 * - Next 7 days (2-7 days ahead) → CURRENT_DATE + 2
 * - Next 30 days (8-30 days ahead) → CURRENT_DATE + 8
 * - Future months → first of that month
 */
function buildRelativeDateCase(column: SQL): SQL {
  return sql`CASE
    WHEN ${column} IS NULL THEN NULL
    WHEN ${column}::date = CURRENT_DATE THEN CURRENT_DATE::timestamp
    WHEN ${column}::date = CURRENT_DATE - 1 THEN (CURRENT_DATE - 1)::timestamp
    WHEN ${column}::date = CURRENT_DATE + 1 THEN (CURRENT_DATE + 1)::timestamp
    WHEN ${column}::date BETWEEN CURRENT_DATE - 7 AND CURRENT_DATE - 2 THEN (CURRENT_DATE - 7)::timestamp
    WHEN ${column}::date BETWEEN CURRENT_DATE + 2 AND CURRENT_DATE + 7 THEN (CURRENT_DATE + 2)::timestamp
    WHEN ${column}::date BETWEEN CURRENT_DATE - 30 AND CURRENT_DATE - 8 THEN (CURRENT_DATE - 30)::timestamp
    WHEN ${column}::date BETWEEN CURRENT_DATE + 8 AND CURRENT_DATE + 30 THEN (CURRENT_DATE + 8)::timestamp
    ELSE DATE_TRUNC('month', ${column})::timestamp
  END`;
}

/**
 * Build SQL CASE expression for relative date sort order.
 *
 * Orders chronologically from past to future:
 * - Past months: large negative number + epoch (oldest first)
 * - Last 30 days: -4
 * - Last 7 days: -3
 * - Yesterday: -2
 * - Today: -1
 * - Tomorrow: 0
 * - Next 7 days: 1
 * - Next 30 days: 2
 * - Future months: large positive number + epoch (earliest first)
 */
function buildRelativeDateOrder(column: SQL): SQL {
  return sql`CASE
    WHEN ${column} IS NULL THEN 999999999
    WHEN ${column}::date = CURRENT_DATE THEN -1
    WHEN ${column}::date = CURRENT_DATE - 1 THEN -2
    WHEN ${column}::date = CURRENT_DATE + 1 THEN 0
    WHEN ${column}::date BETWEEN CURRENT_DATE - 7 AND CURRENT_DATE - 2 THEN -3
    WHEN ${column}::date BETWEEN CURRENT_DATE + 2 AND CURRENT_DATE + 7 THEN 1
    WHEN ${column}::date BETWEEN CURRENT_DATE - 30 AND CURRENT_DATE - 8 THEN -4
    WHEN ${column}::date BETWEEN CURRENT_DATE + 8 AND CURRENT_DATE + 30 THEN 2
    WHEN ${column}::date < CURRENT_DATE - 30 THEN -1000000000 + EXTRACT(EPOCH FROM ${column})
    ELSE 1000000000 + EXTRACT(EPOCH FROM ${column})
  END`;
}

/**
 * Build SQL expression for status group mapping
 */
function buildStatusGroupCase(column: SQL, config?: StatusConfig): SQL {
  if (!config?.groups) {
    return column;
  }

  const cases = config.groups.map((group) => {
    const optionsList = group.options.map((opt) => `'${opt}'`).join(", ");
    return sql`WHEN ${column} IN (${sql.raw(optionsList)}) THEN '${sql.raw(group.label)}'`;
  });

  return sql`CASE ${sql.join(cases, sql` `)} ELSE ${column} END`;
}

/**
 * Build SQL expression for status group sort order
 */
function buildStatusGroupOrder(column: SQL, config?: StatusConfig): SQL {
  if (!config?.groups) {
    return column;
  }

  const cases = config.groups.map((group, index) => {
    const optionsList = group.options.map((opt) => `'${opt}'`).join(", ");
    return sql`WHEN ${column} IN (${sql.raw(optionsList)}) THEN ${sql.raw(String(index))}`;
  });

  return sql`CASE ${sql.join(cases, sql` `)} ELSE ${sql.raw("999")} END`;
}

/**
 * Build SQL expression for number range bucketing
 */
function buildNumberRangeCase(
  column: SQL,
  range: [number, number],
  step: number
): SQL {
  const [min, max] = range;
  const minStr = sql.raw(String(min));
  const maxStr = sql.raw(String(max));
  const stepStr = sql.raw(String(step));

  return sql`CASE
    WHEN ${column} IS NULL THEN 'Unknown'
    WHEN ${column} < ${minStr} THEN '< ' || ${minStr}
    WHEN ${column} >= ${maxStr} THEN ${maxStr} || '+'
    ELSE (FLOOR((${column} - ${minStr}) / ${stepStr}) * ${stepStr} + ${minStr})::text || '-' || (FLOOR((${column} - ${minStr}) / ${stepStr}) * ${stepStr} + ${minStr} + ${stepStr})::text
  END`;
}

/**
 * Build SQL expression for number range sort order
 */
function buildNumberRangeOrder(
  column: SQL,
  range: [number, number],
  step: number
): SQL {
  const [min, max] = range;
  const minStr = sql.raw(String(min));
  const maxStr = sql.raw(String(max));
  const stepStr = sql.raw(String(step));
  const minMinusOne = sql.raw(String(min - 1));

  return sql`CASE
    WHEN ${column} IS NULL THEN ${sql.raw("999999999")}
    WHEN ${column} < ${minStr} THEN ${minMinusOne}
    WHEN ${column} >= ${maxStr} THEN ${maxStr}
    ELSE FLOOR((${column} - ${minStr}) / ${stepStr}) * ${stepStr} + ${minStr}
  END`;
}

/**
 * Converts GroupByConfig to SQL GROUP BY expression.
 * Returns both the groupKey expression and orderBy expression.
 */
export function buildGroupBy<T extends Table>(
  table: T,
  parsed: ParsedGroupConfig,
  propertyConfig?: PropertyConfig
): GroupByResult | null {
  const column = getColumn(table, parsed.property as keyof T);
  if (!column) {
    return null;
  }

  const columnSql = sql`${column}`;

  switch (parsed.propertyType) {
    case "date": {
      const showAs = parsed.showAs as
        | "day"
        | "week"
        | "month"
        | "year"
        | "relative";

      switch (showAs) {
        case "relative":
          return {
            groupKey: buildRelativeDateCase(columnSql),
            orderBy: buildRelativeDateOrder(columnSql),
          };
        case "day":
          return {
            groupKey: sql`TO_CHAR(${column}, 'Mon DD, YYYY')`,
            orderBy: sql`DATE(${column})`,
          };
        case "week":
          // TODO: Support startWeekOn (currently uses ISO week starting Monday)
          return {
            groupKey: sql`TO_CHAR(DATE_TRUNC('week', ${column}), 'Mon DD') || '-' || TO_CHAR(DATE_TRUNC('week', ${column}) + INTERVAL '6 days', 'Mon DD, YYYY')`,
            orderBy: sql`DATE_TRUNC('week', ${column})`,
          };
        case "month":
          return {
            groupKey: sql`TO_CHAR(${column}, 'Mon YYYY')`,
            orderBy: sql`DATE_TRUNC('month', ${column})`,
          };
        case "year":
          return {
            groupKey: sql`TO_CHAR(${column}, 'YYYY')`,
            orderBy: sql`DATE_TRUNC('year', ${column})`,
          };
        default:
          return {
            groupKey: columnSql,
            orderBy: columnSql,
          };
      }
    }

    case "status": {
      if (parsed.showAs === "group") {
        return {
          groupKey: buildStatusGroupCase(columnSql, propertyConfig?.config),
          orderBy: buildStatusGroupOrder(columnSql, propertyConfig?.config),
        };
      }
      // showAs: "option" - group by individual status value
      return {
        groupKey: sql`COALESCE(${column}::text, 'No ' || '${sql.raw(parsed.property)}')`,
        orderBy: buildStatusGroupOrder(columnSql, propertyConfig?.config),
      };
    }

    case "text": {
      if (parsed.textShowAs === "alphabetical") {
        return {
          groupKey: sql`CASE
            WHEN ${column} IS NULL OR ${column} = '' THEN '#'
            WHEN UPPER(SUBSTR(${column}, 1, 1)) ~ '[A-Z]' THEN UPPER(SUBSTR(${column}, 1, 1))
            ELSE '#'
          END`,
          orderBy: sql`CASE
            WHEN ${column} IS NULL OR ${column} = '' THEN 'ZZZ'
            WHEN UPPER(SUBSTR(${column}, 1, 1)) ~ '[A-Z]' THEN UPPER(SUBSTR(${column}, 1, 1))
            ELSE 'ZZZ'
          END`,
        };
      }
      // exact - group by value
      return {
        groupKey: sql`COALESCE(${column}::text, 'No ' || '${sql.raw(parsed.property)}')`,
        orderBy: sql`COALESCE(${column}, '')`,
      };
    }

    case "number": {
      // Use provided range or default to 0-1000 with step 100
      const { range, step } = parsed.numberRange ?? {
        range: [0, 1000] as [number, number],
        step: 100,
      };
      return {
        groupKey: buildNumberRangeCase(columnSql, range, step),
        orderBy: buildNumberRangeOrder(columnSql, range, step),
      };
    }

    case "checkbox":
      // Return "true"/"false" strings (object keys must be strings)
      // "Checked"/"Unchecked" are display labels only (handled by client)
      return {
        groupKey: sql`CASE WHEN ${column} = true THEN 'true' ELSE 'false' END`,
        orderBy: sql`CASE WHEN ${column} = true THEN 0 ELSE 1 END`,
      };

    // multiSelect arrays - use UNNEST to expand and group by individual values
    // Items with multiple values will appear in multiple groups
    // Handle NULL/empty arrays by replacing with single-element array containing "No property"
    case "multiSelect":
      return {
        groupKey: sql`UNNEST(CASE WHEN ${column} IS NULL OR CARDINALITY(${column}) = 0 THEN ARRAY['No ${sql.raw(parsed.property)}'] ELSE ${column} END)`,
        orderBy: sql`UNNEST(CASE WHEN ${column} IS NULL OR CARDINALITY(${column}) = 0 THEN ARRAY['No ${sql.raw(parsed.property)}'] ELSE ${column} END)`,
      };

    // select and any other types use simple grouping
    default:
      return {
        groupKey: sql`COALESCE(${column}::text, 'No ' || '${sql.raw(parsed.property)}')`,
        orderBy: sql`COALESCE(${column}, '')`,
      };
  }
}

/**
 * Build WHERE clause for date group filtering
 */
function buildDateGroupWhere(
  column: unknown,
  columnSql: SQL,
  groupKey: string,
  showAs: string
): SQL {
  switch (showAs) {
    case "relative":
      // groupKey is now a timestamp string - compare using the same CASE expression
      return sql`(${buildRelativeDateCase(columnSql)}) = ${groupKey}::timestamp`;
    case "day":
      return sql`TO_CHAR(${column}, 'Mon DD, YYYY') = ${groupKey}`;
    case "week":
      return sql`(TO_CHAR(DATE_TRUNC('week', ${column}), 'Mon DD') || '-' || TO_CHAR(DATE_TRUNC('week', ${column}) + INTERVAL '6 days', 'Mon DD, YYYY')) = ${groupKey}`;
    case "month":
      return sql`TO_CHAR(${column}, 'Mon YYYY') = ${groupKey}`;
    case "year":
      return sql`TO_CHAR(${column}, 'YYYY') = ${groupKey}`;
    default:
      return sql`${column} = ${groupKey}`;
  }
}

/**
 * Build WHERE clause for status group filtering
 */
function buildStatusGroupWhere(
  column: unknown,
  groupKey: string,
  showAs: string | undefined,
  config?: StatusConfig
): SQL {
  if (showAs === "group" && config?.groups) {
    const matchingGroup = config.groups.find((g) => g.label === groupKey);
    if (matchingGroup) {
      const optionsList = matchingGroup.options
        .map((opt) => `'${opt}'`)
        .join(", ");
      return sql`${column} IN (${sql.raw(optionsList)})`;
    }
  }
  return sql`${column} = ${groupKey}`;
}

/**
 * Build WHERE clause for number range group filtering
 */
function buildNumberRangeWhere(
  column: unknown,
  groupKey: string,
  range: [number, number]
): SQL | null {
  const [min, max] = range;

  if (groupKey === "Unknown") {
    return sql`${column} IS NULL`;
  }
  if (groupKey === `< ${min}`) {
    return sql`${column} < ${sql.raw(String(min))}`;
  }
  if (groupKey === `${max}+`) {
    return sql`${column} >= ${sql.raw(String(max))}`;
  }

  const rangeMatch = groupKey.match(NUMBER_RANGE_REGEX);
  if (rangeMatch) {
    const rangeMin = Number(rangeMatch[1]);
    const rangeMax = Number(rangeMatch[2]);
    return sql`${column} >= ${sql.raw(String(rangeMin))} AND ${column} < ${sql.raw(String(rangeMax))}`;
  }

  return null;
}

/**
 * Build SQL WHERE expression to filter items belonging to a specific group.
 * Used when fetching items for a particular group key.
 */
export function buildGroupWhere<T extends Table>(
  table: T,
  parsed: ParsedGroupConfig,
  groupKey: string,
  propertyConfig?: PropertyConfig
): SQL | null {
  const column = getColumn(table, parsed.property as keyof T);
  if (!column) {
    return null;
  }

  const columnSql = sql`${column}`;

  // Handle null group
  if (groupKey === `No ${parsed.property}` || groupKey === "null") {
    return sql`${column} IS NULL`;
  }

  switch (parsed.propertyType) {
    case "date":
      return buildDateGroupWhere(
        column,
        columnSql,
        groupKey,
        parsed.showAs ?? "day"
      );

    case "status":
      return buildStatusGroupWhere(
        column,
        groupKey,
        parsed.showAs,
        propertyConfig?.config
      );

    case "text":
      if (parsed.textShowAs === "alphabetical") {
        if (groupKey === "#") {
          return sql`(${column} IS NULL OR ${column} = '' OR NOT (UPPER(SUBSTR(${column}, 1, 1)) ~ '[A-Z]'))`;
        }
        return sql`UPPER(SUBSTR(${column}, 1, 1)) = ${groupKey}`;
      }
      return sql`${column} = ${groupKey}`;

    case "number": {
      // Use provided range or default to 0-1000 (must match buildGroupBy default)
      const { range } = parsed.numberRange ?? {
        range: [0, 1000] as [number, number],
      };
      const numWhere = buildNumberRangeWhere(column, groupKey, range);
      if (numWhere) {
        return numWhere;
      }
      return sql`${column} = ${groupKey}`;
    }

    case "checkbox":
      // groupKey is "true" or "false" string
      if (groupKey === "true") {
        return sql`${column} = true`;
      }
      return sql`(${column} IS NULL OR ${column} = false)`;

    case "multiSelect":
      // For multiSelect, check if the groupKey is contained in the array column
      // Handle "No property" case for NULL/empty arrays
      if (groupKey === `No ${parsed.property}`) {
        return sql`(${column} IS NULL OR CARDINALITY(${column}) = 0)`;
      }
      return sql`${groupKey} = ANY(${column})`;

    default:
      return sql`${column} = ${groupKey}`;
  }
}
