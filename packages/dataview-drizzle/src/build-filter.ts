import {
  type FilterCondition,
  getRelativeDateRange,
  isWhereExpression,
  type Quantifier,
  type WhereNode,
  type WhereRule,
} from "@jingerpie/dataview-core";
import { addDays, parseISO, startOfDay } from "date-fns";
import {
  type AnyColumn,
  and,
  eq,
  getTableName,
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
import { buildScalarRollupCondition } from "./build-rollup";

// ============================================
// Relation Types
// ============================================

/**
 * Metadata for a scalar rollup calculation on a related table.
 * Used to build SQL aggregate subqueries (e.g., COUNT, SUM, AVG).
 */
export interface RollupMeta {
  /** Aggregation type (matches RollupCalculation from dataview types) */
  calculation: string;
  /** Column name on the related table to aggregate (use "*" for countAll) */
  field: string;
}

/**
 * Configuration for a related table that can be queried via EXISTS subqueries.
 * Used with dot-notation property keys (e.g., "productVariants.sku").
 */
export interface RelationConfig {
  /** FK column name on the related table pointing to the parent table */
  foreignKey: string;
  /** PK column name on the parent table (default: "id") */
  parentKey?: string;
  /** Drizzle table for the related entity */
  table: Table;
}

/**
 * Maps relation names to their config.
 * Keys match the prefix in dot-notation property keys.
 *
 * @example
 * ```typescript
 * const relations: RelationMap = {
 *   productVariants: {
 *     table: productVariant,
 *     foreignKey: "productId",
 *   },
 * };
 * // Enables filtering on "productVariants.sku", "productVariants.model", etc.
 * ```
 */
export type RelationMap = Record<string, RelationConfig>;

// ============================================
// Negative operator inversion for relation filters
// ============================================

/**
 * Maps negative operators to their positive counterparts.
 * Used by relation filters to generate NOT EXISTS with the inverted condition.
 *
 * Why: EXISTS with a negative condition (e.g., sku NOT ILIKE '%ABC%') is wrong
 * for one-to-many relations. It matches if ANY related row doesn't match,
 * even if another row does. NOT EXISTS with the positive condition correctly
 * checks that NO related row matches.
 */
const NEGATIVE_TO_POSITIVE: Partial<Record<FilterCondition, FilterCondition>> =
  {
    notILike: "iLike",
    ne: "eq",
    notInArray: "inArray",
    isEmpty: "isNotEmpty",
  };

// ============================================
// Draft filter detection
// ============================================

/** Checks if a filter rule is a draft (incomplete) that should be skipped. */
export function isDraftFilter(
  condition: FilterCondition,
  value: unknown
): boolean {
  return !(
    condition === "isEmpty" ||
    condition === "isNotEmpty" ||
    condition === "startsWithNonAlpha" ||
    (Array.isArray(value)
      ? value.length > 0
      : value !== "" && value !== null && value !== undefined)
  );
}

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

// ============================================
// Column type detection (operates on AnyColumn directly)
// ============================================

/** Check if a column is a text/string type in PostgreSQL. */
function isTextCol(column: AnyColumn): boolean {
  const ct = (column as { columnType?: string }).columnType;
  return ct === "PgText" || ct === "PgVarchar" || ct === "PgChar";
}

/** Check if a column is a PostgreSQL array type. */
function isArrayCol(column: AnyColumn): boolean {
  const ct = (column as { columnType?: string }).columnType;
  return ct === "PgArray";
}

/** Check if a column is a PostgreSQL boolean type. */
function isBoolCol(column: AnyColumn): boolean {
  const ct = (column as { columnType?: string }).columnType;
  return ct === "PgBoolean";
}

// ============================================
// Public API
// ============================================

/**
 * Converts filter array to Drizzle SQL conditions.
 * Root is always AND (implicit). Handles nested AND/OR expressions.
 * Supports relation filters via dot-notation property keys.
 *
 * @param table - Drizzle table schema
 * @param filter - Array of WhereNode (WhereRule or WhereExpression)
 * @param relations - Optional relation map for cross-table filtering
 * @returns SQL condition or undefined if no valid filter
 *
 * @example
 * ```typescript
 * // Primary table filter
 * const where = buildWhere(product, [
 *   { property: "status", condition: "eq", value: "active" }
 * ]);
 *
 * // Relation filter (requires relations map)
 * const where = buildWhere(product, [
 *   { property: "productVariants.sku", condition: "iLike", value: "ABC" }
 * ], { productVariants: { table: productVariant, foreignKey: "productId" } });
 * ```
 */
export function buildWhere<T extends Table>(
  table: T,
  filter: WhereNode[] | null | undefined,
  relations?: RelationMap,
  rollups?: { extrasKey: string; key: string; calculation: string }[]
): SQL | undefined {
  if (!filter || filter.length === 0) {
    return undefined;
  }

  const conditions = filter
    .map((node) => buildNode(table, node, relations, rollups))
    .filter((c): c is SQL => c !== undefined);

  return conditions.length > 0 ? and(...conditions) : undefined;
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

// ============================================
// Internal: Node & condition building
// ============================================

/**
 * Recursively build SQL for any WhereNode (rule or expression)
 */
function buildNode<T extends Table>(
  table: T,
  node: WhereNode,
  relations?: RelationMap,
  rollups?: { extrasKey: string; key: string; calculation: string }[]
): SQL | undefined {
  if (isWhereExpression(node)) {
    if (node.or) {
      const conditions = node.or
        .map((n) => buildNode(table, n, relations, rollups))
        .filter((c): c is SQL => c !== undefined);
      return conditions.length > 0 ? or(...conditions) : undefined;
    }
    if (node.and) {
      const conditions = node.and
        .map((n) => buildNode(table, n, relations, rollups))
        .filter((c): c is SQL => c !== undefined);
      return conditions.length > 0 ? and(...conditions) : undefined;
    }
    return undefined;
  }

  // WhereRule
  return buildCondition(table, node, relations, rollups);
}

/**
 * Builds SQL condition for a single filter rule.
 * First tries the primary table column, then falls back to relation lookup.
 * Draft rules (incomplete value) are skipped and return undefined.
 */
function buildCondition<T extends Table>(
  table: T,
  filter: WhereRule,
  relations?: RelationMap,
  rollups?: { extrasKey: string; key: string; calculation: string }[]
): SQL | undefined {
  const { property, condition, value } = filter;
  const column = getColumn(table, property as keyof T);

  // Column not found on primary table — try relation
  if (!column) {
    if (relations && property.includes(".")) {
      // Scalar rollup (from client rollups input). Match the unique extrasKey
      // first so multiple calculations on one relation field stay distinct;
      // fall back to the plain key for clients that send the field key.
      const rollup =
        rollups?.find((r) => r.extrasKey === property) ??
        rollups?.find((r) => r.key === property);
      if (rollup) {
        const dotIndex = rollup.key.indexOf(".");
        const relation = relations[rollup.key.slice(0, dotIndex)];
        if (dotIndex > 0 && relation) {
          return buildScalarRollupCondition(table, filter, relation, {
            field: rollup.key.slice(dotIndex + 1),
            calculation: rollup.calculation,
          });
        }
      }

      return buildRelationCondition(table, filter, relations);
    }
    return undefined;
  }

  // Skip draft rules - they remain visible in UI but don't affect query results
  if (isDraftFilter(condition, value)) {
    return undefined;
  }

  return buildColumnCondition(column, condition, value);
}

// ============================================
// Column condition builder (shared by primary and relation filters)
// ============================================

/**
 * Builds a SQL condition for a single column.
 * Pure function that operates on an AnyColumn without table context.
 * Used by both primary table conditions and relation subquery conditions.
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex SQL condition building logic
export function buildColumnCondition(
  column: AnyColumn,
  condition: FilterCondition,
  value: unknown
): SQL | undefined {
  switch (condition) {
    // ============================================
    // Text conditions (handle wildcards internally)
    // Uses CAST(column AS TEXT) for uniform search across all column types
    // ============================================
    case "iLike":
      return value == null
        ? undefined
        : sql`CAST(${column} AS TEXT) ILIKE ${`%${String(value)}%`}`;

    case "notILike":
      return value == null
        ? undefined
        : sql`CAST(${column} AS TEXT) NOT ILIKE ${`%${String(value)}%`}`;

    case "startsWith":
      return value == null
        ? undefined
        : sql`CAST(${column} AS TEXT) ILIKE ${`${String(value)}%`}`;

    case "endsWith":
      return value == null
        ? undefined
        : sql`CAST(${column} AS TEXT) ILIKE ${`%${String(value)}`}`;

    case "startsWithNonAlpha":
      // Matches NULL, empty string, or values starting with non-alphabetic character
      // Used for alphabetical text grouping "#" bucket
      return sql`(${column} IS NULL OR ${column} = '' OR NOT (UPPER(SUBSTR(CAST(${column} AS TEXT), 1, 1)) ~ '[A-Z]'))`;

    // ============================================
    // Equality conditions (with date-only midnight boundary support)
    // ============================================
    case "eq": {
      // Date-only strings: match entire day (>= day 00:00 AND < nextDay 00:00)
      if (isDateOnlyString(value)) {
        return and(
          gte(column, toMidnight(value)),
          lt(column, toNextMidnight(value))
        );
      }
      // Boolean columns: normalize "Checked"/"Unchecked" group keys to booleans
      if (isBoolCol(column)) {
        return eq(column, normalizeBooleanValue(value));
      }
      return eq(column, value);
    }

    case "ne":
      // Boolean columns: normalize "Checked"/"Unchecked" group keys to booleans
      if (isBoolCol(column)) {
        return ne(column, normalizeBooleanValue(value));
      }
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
    // For scalar columns: SQL IN / NOT IN
    // For array columns: PostgreSQL && (overlap) operator
    // ============================================
    case "inArray":
      if (!Array.isArray(value) || value.length === 0) {
        return undefined;
      }
      // PostgreSQL array columns need overlap operator (&&)
      if (isArrayCol(column)) {
        const arrayLiteral = sql.join(
          value.map((v) => sql`${v}`),
          sql`, `
        );
        return sql`${column} && ARRAY[${arrayLiteral}]`;
      }
      return inArray(column, value);

    case "notInArray":
      if (!Array.isArray(value) || value.length === 0) {
        return undefined;
      }
      // PostgreSQL array columns need NOT overlap
      if (isArrayCol(column)) {
        const arrayLiteral = sql.join(
          value.map((v) => sql`${v}`),
          sql`, `
        );
        return sql`NOT (${column} && ARRAY[${arrayLiteral}])`;
      }
      return notInArray(column, value);

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
      // Value is array: [direction, count, unit]
      if (!Array.isArray(value) || value.length !== 3) {
        return undefined;
      }

      const [direction, count, unit] = value as [
        "past" | "this" | "next",
        number,
        "day" | "week" | "month" | "year",
      ];
      const now = new Date();
      const range = getRelativeDateRange(now, direction, count ?? 1, unit);

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
      if (isTextCol(column)) {
        return or(isNull(column), eq(column, ""));
      }
      // For array columns, empty array '{}' is also considered empty
      if (isArrayCol(column)) {
        return or(isNull(column), sql`${column} = '{}'`);
      }
      return isNull(column);

    case "isNotEmpty":
      // For text columns, empty string '' is also considered empty
      if (isTextCol(column)) {
        return and(isNotNull(column), ne(column, ""));
      }
      // For array columns, empty array '{}' is also considered empty
      if (isArrayCol(column)) {
        return and(isNotNull(column), sql`${column} != '{}'`);
      }
      return isNotNull(column);

    default:
      // Unknown condition - skip silently
      return undefined;
  }
}

// ============================================
// Raw SQL helpers
// ============================================

/**
 * Creates a table-qualified column reference using raw SQL identifiers.
 * These are immune to Drizzle's relational query column remapping.
 */
export function rawCol(tableName: string, columnName: string): SQL {
  return sql`${sql.identifier(tableName)}.${sql.identifier(columnName)}`;
}

// ============================================
// Relation filter: EXISTS / NOT EXISTS subqueries
// ============================================

/**
 * Builds a SQL condition using raw SQL column references (not Drizzle column objects).
 * Used inside EXISTS subqueries where Drizzle's relational query mode would
 * otherwise remap column table references to the wrong table.
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: mirrors buildColumnCondition for raw SQL
function buildRawColumnCondition(
  colRef: SQL,
  column: AnyColumn,
  condition: FilterCondition,
  value: unknown
): SQL | undefined {
  switch (condition) {
    case "iLike":
      return value == null
        ? undefined
        : sql`CAST(${colRef} AS TEXT) ILIKE ${`%${String(value)}%`}`;
    case "notILike":
      return value == null
        ? undefined
        : sql`CAST(${colRef} AS TEXT) NOT ILIKE ${`%${String(value)}%`}`;
    case "startsWith":
      return value == null
        ? undefined
        : sql`CAST(${colRef} AS TEXT) ILIKE ${`${String(value)}%`}`;
    case "endsWith":
      return value == null
        ? undefined
        : sql`CAST(${colRef} AS TEXT) ILIKE ${`%${String(value)}`}`;
    case "startsWithNonAlpha":
      return sql`(${colRef} IS NULL OR ${colRef} = '' OR NOT (UPPER(SUBSTR(CAST(${colRef} AS TEXT), 1, 1)) ~ '[A-Z]'))`;
    case "eq":
      if (isDateOnlyString(value)) {
        return sql`${colRef} >= ${toMidnight(value)} AND ${colRef} < ${toNextMidnight(value)}`;
      }
      if (isBoolCol(column)) {
        return sql`${colRef} = ${normalizeBooleanValue(value)}`;
      }
      return sql`${colRef} = ${value}`;
    case "ne":
      if (isBoolCol(column)) {
        return sql`${colRef} != ${normalizeBooleanValue(value)}`;
      }
      return sql`${colRef} != ${value}`;
    case "lt":
      if (isDateOnlyString(value)) {
        return sql`${colRef} < ${toMidnight(value)}`;
      }
      return sql`${colRef} < ${value}`;
    case "lte":
      if (isDateOnlyString(value)) {
        return sql`${colRef} < ${toNextMidnight(value)}`;
      }
      return sql`${colRef} <= ${value}`;
    case "gt":
      if (isDateOnlyString(value)) {
        return sql`${colRef} >= ${toNextMidnight(value)}`;
      }
      return sql`${colRef} > ${value}`;
    case "gte":
      if (isDateOnlyString(value)) {
        return sql`${colRef} >= ${toMidnight(value)}`;
      }
      return sql`${colRef} >= ${value}`;
    case "inArray":
      if (!Array.isArray(value) || value.length === 0) {
        return undefined;
      }
      if (isArrayCol(column)) {
        const arrayLiteral = sql.join(
          value.map((v) => sql`${v}`),
          sql`, `
        );
        return sql`${colRef} && ARRAY[${arrayLiteral}]`;
      }
      return sql`${colRef} IN (${sql.join(
        value.map((v) => sql`${v}`),
        sql`, `
      )})`;
    case "notInArray":
      if (!Array.isArray(value) || value.length === 0) {
        return undefined;
      }
      if (isArrayCol(column)) {
        const arrayLiteral = sql.join(
          value.map((v) => sql`${v}`),
          sql`, `
        );
        return sql`NOT (${colRef} && ARRAY[${arrayLiteral}])`;
      }
      return sql`${colRef} NOT IN (${sql.join(
        value.map((v) => sql`${v}`),
        sql`, `
      )})`;
    case "isEmpty":
      if (isTextCol(column)) {
        return sql`(${colRef} IS NULL OR ${colRef} = '')`;
      }
      if (isArrayCol(column)) {
        return sql`(${colRef} IS NULL OR ${colRef} = '{}')`;
      }
      return sql`${colRef} IS NULL`;
    case "isNotEmpty":
      if (isTextCol(column)) {
        return sql`(${colRef} IS NOT NULL AND ${colRef} != '')`;
      }
      if (isArrayCol(column)) {
        return sql`(${colRef} IS NOT NULL AND ${colRef} != '{}')`;
      }
      return sql`${colRef} IS NOT NULL`;
    default:
      return undefined;
  }
}

/**
 * Builds an EXISTS or NOT EXISTS subquery for a relation filter.
 * Parses dot-notation property key (e.g., "productVariants.sku") to resolve
 * the related table and field, then generates the appropriate subquery.
 *
 * Uses raw SQL identifiers (sql.identifier) instead of Drizzle column objects
 * to prevent Drizzle's relational query mode from remapping table references.
 *
 * Positive operators → EXISTS (SELECT 1 FROM related WHERE fk = pk AND condition)
 * Negative operators → NOT EXISTS (SELECT 1 FROM related WHERE fk = pk AND positiveCondition)
 */
function buildRelationCondition<T extends Table>(
  table: T,
  filter: WhereRule,
  relations: RelationMap
): SQL | undefined {
  const { property, condition, value } = filter;

  // Skip draft rules
  if (isDraftFilter(condition, value)) {
    return undefined;
  }

  // Split "productVariants.sku" → ["productVariants", "sku"]
  const dotIndex = property.indexOf(".");
  const relationName = property.slice(0, dotIndex);
  const fieldName = property.slice(dotIndex + 1);

  const relation = relations[relationName];
  if (!relation) {
    return undefined;
  }

  // Resolve columns (for type detection only)
  const relatedColumn = getColumn(
    relation.table,
    fieldName as keyof typeof relation.table
  );
  if (!relatedColumn) {
    return undefined;
  }

  const parentKey = relation.parentKey ?? "id";
  const parentColumn = getColumn(table, parentKey as keyof T);
  const fkColumn = getColumn(
    relation.table,
    relation.foreignKey as keyof typeof relation.table
  );

  if (!(parentColumn && fkColumn)) {
    return undefined;
  }

  // Build raw SQL references for the related table (immune to Drizzle's column remapping)
  // Use Drizzle column directly for parent PK — it carries the correct table alias
  // in relational query mode (e.g., "productVariant"."id" not "product_variant"."id")
  const relTableName = getTableName(relation.table);
  const fkRef = rawCol(relTableName, fkColumn.name);
  const fieldRef = rawCol(relTableName, relatedColumn.name);
  const joinCond = sql`${fkRef} = ${parentColumn}`;

  // Array quantifier path (for display rollups: showOriginal/showUnique)
  if (filter.quantifier) {
    return buildQuantifiedRelationCondition(
      joinCond,
      relTableName,
      fieldRef,
      relatedColumn,
      condition,
      value,
      filter.quantifier
    );
  }

  // Legacy path: negative operator inversion for non-quantified relation filters
  const positiveCondition = NEGATIVE_TO_POSITIVE[condition];

  if (positiveCondition) {
    const innerCondition = buildRawColumnCondition(
      fieldRef,
      relatedColumn,
      positiveCondition,
      value
    );
    if (!innerCondition) {
      return undefined;
    }
    return sql`NOT EXISTS (SELECT 1 FROM ${sql.identifier(relTableName)} WHERE ${joinCond} AND ${innerCondition})`;
  }

  const innerCondition = buildRawColumnCondition(
    fieldRef,
    relatedColumn,
    condition,
    value
  );
  if (!innerCondition) {
    return undefined;
  }
  return sql`EXISTS (SELECT 1 FROM ${sql.identifier(relTableName)} WHERE ${joinCond} AND ${innerCondition})`;
}

// ============================================
// Quantified relation filter: ANY / NONE / EVERY
// ============================================

/**
 * Builds a quantified EXISTS/NOT EXISTS subquery for array-returning rollup filters.
 * - "any"   → EXISTS (SELECT 1 WHERE fk=pk AND condition)
 * - "none"  → NOT EXISTS (SELECT 1 WHERE fk=pk AND condition)
 * - "every" → EXISTS (SELECT 1 WHERE fk=pk)
 *             AND NOT EXISTS (SELECT 1 WHERE fk=pk AND (condition) IS NOT TRUE)
 *
 * "every" needs at least one related row (empty relations do not match).
 * `IS NOT TRUE` counts NULL results (e.g. NULL field values) as violations;
 * plain `NOT (condition)` would yield NULL and let those rows slip through.
 */
function buildQuantifiedRelationCondition(
  joinCond: SQL,
  relTableName: string,
  fieldRef: SQL,
  relatedColumn: AnyColumn,
  condition: FilterCondition,
  value: unknown,
  quantifier: Quantifier
): SQL | undefined {
  const innerCondition = buildRawColumnCondition(
    fieldRef,
    relatedColumn,
    condition,
    value
  );
  if (!innerCondition) {
    return undefined;
  }

  switch (quantifier) {
    case "any":
      return sql`EXISTS (SELECT 1 FROM ${sql.identifier(relTableName)} WHERE ${joinCond} AND ${innerCondition})`;
    case "none":
      return sql`NOT EXISTS (SELECT 1 FROM ${sql.identifier(relTableName)} WHERE ${joinCond} AND ${innerCondition})`;
    case "every":
      return sql`(EXISTS (SELECT 1 FROM ${sql.identifier(relTableName)} WHERE ${joinCond}) AND NOT EXISTS (SELECT 1 FROM ${sql.identifier(relTableName)} WHERE ${joinCond} AND (${innerCondition}) IS NOT TRUE))`;
    default: {
      const exhaustiveCheck: never = quantifier;
      throw new Error(`Unknown quantifier: ${exhaustiveCheck}`);
    }
  }
}

// ============================================
// Helpers (kept for backward compatibility with build-group.ts imports)
// ============================================

/**
 * Normalize a filter value for boolean columns.
 * Filter values are already boolean (from checkbox-filter.tsx or combineGroupFilter).
 */
function normalizeBooleanValue(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  throw new Error(`Expected boolean value, got ${typeof value}: ${value}`);
}
