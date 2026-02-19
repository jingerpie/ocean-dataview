import type { ParsedGroupConfig } from "@sparkyidea/shared/types";
import { count, type SQL, sql, type Table } from "drizzle-orm";
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

/**
 * Build SQL CASE expression for relative date grouping
 */
function buildRelativeDateCase(column: SQL): SQL {
  return sql`CASE
    WHEN DATE(${column}) = CURRENT_DATE THEN 'Today'
    WHEN DATE(${column}) = CURRENT_DATE - INTERVAL '1 day' THEN 'Yesterday'
    WHEN DATE(${column}) = CURRENT_DATE + INTERVAL '1 day' THEN 'Tomorrow'
    WHEN DATE(${column}) BETWEEN CURRENT_DATE - INTERVAL '7 days' AND CURRENT_DATE - INTERVAL '2 days' THEN 'Last 7 days'
    WHEN DATE(${column}) BETWEEN CURRENT_DATE + INTERVAL '2 days' AND CURRENT_DATE + INTERVAL '7 days' THEN 'Next 7 days'
    WHEN DATE(${column}) BETWEEN CURRENT_DATE - INTERVAL '30 days' AND CURRENT_DATE - INTERVAL '8 days' THEN 'Last 30 days'
    WHEN DATE(${column}) BETWEEN CURRENT_DATE + INTERVAL '8 days' AND CURRENT_DATE + INTERVAL '30 days' THEN 'Next 30 days'
    ELSE TO_CHAR(${column}, 'Mon YYYY')
  END`;
}

/**
 * Build SQL CASE expression for relative date sort order
 */
function buildRelativeDateOrder(column: SQL): SQL {
  return sql`CASE
    WHEN DATE(${column}) = CURRENT_DATE THEN 0
    WHEN DATE(${column}) = CURRENT_DATE - INTERVAL '1 day' THEN -1
    WHEN DATE(${column}) = CURRENT_DATE + INTERVAL '1 day' THEN 1
    WHEN DATE(${column}) BETWEEN CURRENT_DATE - INTERVAL '7 days' AND CURRENT_DATE - INTERVAL '2 days' THEN -2
    WHEN DATE(${column}) BETWEEN CURRENT_DATE + INTERVAL '2 days' AND CURRENT_DATE + INTERVAL '7 days' THEN 2
    WHEN DATE(${column}) BETWEEN CURRENT_DATE - INTERVAL '30 days' AND CURRENT_DATE - INTERVAL '8 days' THEN -3
    WHEN DATE(${column}) BETWEEN CURRENT_DATE + INTERVAL '8 days' AND CURRENT_DATE + INTERVAL '30 days' THEN 3
    ELSE EXTRACT(EPOCH FROM ${column})
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
      if (parsed.numberRange) {
        const { range, step } = parsed.numberRange;
        return {
          groupKey: buildNumberRangeCase(columnSql, range, step),
          orderBy: buildNumberRangeOrder(columnSql, range, step),
        };
      }
      // No range specified - group by exact value
      return {
        groupKey: sql`COALESCE(${column}::text, 'No ' || '${sql.raw(parsed.property)}')`,
        orderBy: sql`COALESCE(${column}, 0)`,
      };
    }

    case "checkbox":
      return {
        groupKey: sql`CASE WHEN ${column} = true THEN 'Checked' ELSE 'Unchecked' END`,
        orderBy: sql`CASE WHEN ${column} = true THEN 0 ELSE 1 END`,
      };

    // select, multiSelect, and any other types use simple grouping
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
      return sql`(${buildRelativeDateCase(columnSql)}) = ${groupKey}`;
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

    case "number":
      if (parsed.numberRange) {
        const numWhere = buildNumberRangeWhere(
          column,
          groupKey,
          parsed.numberRange.range
        );
        if (numWhere) {
          return numWhere;
        }
      }
      return sql`${column} = ${groupKey}`;

    case "checkbox":
      if (groupKey === "Checked") {
        return sql`${column} = true`;
      }
      return sql`(${column} IS NULL OR ${column} = false)`;

    default:
      return sql`${column} = ${groupKey}`;
  }
}

/**
 * Execute GROUP BY query and return counts with sort values.
 */
export async function executeGroupByQuery<T extends Table>(
  db: { execute: (query: SQL) => Promise<{ rows: unknown[] }> },
  table: T,
  tableName: string,
  parsed: ParsedGroupConfig,
  propertyConfig?: PropertyConfig
): Promise<{
  counts: Record<string, { count: number; hasMore: boolean }>;
  sortValues: Record<string, string | number>;
}> {
  const groupByResult = buildGroupBy(table, parsed, propertyConfig);

  if (!groupByResult) {
    return { counts: {}, sortValues: {} };
  }

  const { groupKey, orderBy } = groupByResult;

  const query = sql`
    SELECT
      ${groupKey} as group_key,
      ${orderBy} as sort_value,
      ${count()} as count
    FROM ${sql.raw(tableName)}
    GROUP BY ${groupKey}, ${orderBy}
    ORDER BY ${orderBy}
  `;

  const result = await db.execute(query);

  const counts: Record<string, { count: number; hasMore: boolean }> = {};
  const sortValues: Record<string, string | number> = {};

  for (const row of result.rows as Array<{
    group_key: string;
    sort_value: string | number;
    count: number;
  }>) {
    const key = String(row.group_key);
    counts[key] = {
      count: Math.min(Number(row.count), 100),
      hasMore: Number(row.count) > 100,
    };
    sortValues[key] = row.sort_value;
  }

  return { counts, sortValues };
}
