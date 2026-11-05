import type { FilterCondition, WhereRule } from "@sparkyidea/dataview/types";
import {
  type AnyColumn,
  getTableName,
  type SQL,
  sql,
  type Table,
} from "drizzle-orm";
import {
  getColumn,
  isDraftFilter,
  type RelationConfig,
  type RelationMap,
  type RollupMeta,
  rawCol,
} from "./build-filter";

// ============================================
// Types
// ============================================

/**
 * Input for building a scalar rollup extra.
 * Derived from property definitions — key is dot-notation, calculation from config.
 */
export interface RollupExtra {
  /** Rollup calculation (e.g., "countAll", "sum", "average") */
  calculation: string;
  /** Unique extras alias for the SQL result (e.g., "productVariants.price_minPrice") */
  extrasKey: string;
  /** Dot-notation property key (e.g., "productVariants.price") — used to resolve relation + field */
  key: string;
}

// ============================================
// SQL aggregate helpers
// ============================================

/**
 * Maps a rollup calculation name to its SQL aggregate expression.
 */
function buildAggregate(calculation: string, fieldRef: SQL): SQL {
  switch (calculation) {
    case "countAll":
      return sql`COUNT(*)`;
    case "countValues":
      return sql`COUNT(${fieldRef})`;
    case "countUnique":
      return sql`COUNT(DISTINCT ${fieldRef})`;
    case "countEmpty":
      return sql`COUNT(*) - COUNT(${fieldRef})`;
    case "countNotEmpty":
      return sql`COUNT(${fieldRef})`;
    case "percentEmpty":
      return sql`CASE WHEN COUNT(*) = 0 THEN 0 ELSE (COUNT(*) - COUNT(${fieldRef}))::float * 100 / COUNT(*) END`;
    case "percentNotEmpty":
      return sql`CASE WHEN COUNT(*) = 0 THEN 0 ELSE COUNT(${fieldRef})::float * 100 / COUNT(*) END`;
    case "sum":
      return sql`COALESCE(SUM(${fieldRef}), 0)`;
    case "average":
      return sql`AVG(${fieldRef})`;
    case "median":
      return sql`PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ${fieldRef})`;
    case "min":
      return sql`MIN(${fieldRef})`;
    case "max":
      return sql`MAX(${fieldRef})`;
    case "range":
      return sql`COALESCE(MAX(${fieldRef}) - MIN(${fieldRef}), 0)`;
    default:
      return sql`COUNT(*)`;
  }
}

// ============================================
// Subquery builder (used by both filter and extras)
// ============================================

/**
 * Builds a correlated scalar subquery for a rollup calculation.
 * Returns SQL like: (SELECT COUNT(*) FROM "product_variant" WHERE "product_id" = "product"."id")
 *
 * Uses the Drizzle column object for the parent PK reference so that
 * Drizzle's relational query aliasing is respected (e.g., "productVariant"."id"
 * instead of raw "product_variant"."id"). FK and field refs use raw SQL
 * since they reference the subquery's own FROM table.
 */
export function buildRollupSubquery<T extends Table>(
  parentTable: T,
  relation: RelationConfig,
  rollup: RollupMeta
): SQL {
  const relTableName = getTableName(relation.table);
  const parentKey = relation.parentKey ?? "id";
  const parentColumn = getColumn(parentTable, parentKey as keyof T);
  // Resolve FK JS property name to actual DB column name
  const fkColumn = getColumn(
    relation.table,
    relation.foreignKey as keyof typeof relation.table
  );
  const fkRef = rawCol(relTableName, fkColumn.name);
  // Use Drizzle column directly — it carries the correct table alias
  // in relational query mode (e.g., "productVariant"."id" not "product_variant"."id")
  const joinCond = sql`${fkRef} = ${parentColumn}`;
  // Resolve field JS property name to actual DB column name
  const fieldColumn = getColumn(
    relation.table,
    rollup.field as keyof typeof relation.table
  );
  const fieldRef = rawCol(relTableName, fieldColumn.name);

  const aggregate = buildAggregate(rollup.calculation, fieldRef);
  return sql`(SELECT ${aggregate} FROM ${sql.identifier(relTableName)} WHERE ${joinCond})`;
}

// ============================================
// Filter: scalar rollup WHERE conditions
// ============================================

/**
 * Builds a WHERE condition comparing a scalar rollup subquery result
 * against a filter value using number comparison operators.
 */
export function buildScalarRollupCondition<T extends Table>(
  table: T,
  filter: WhereRule,
  relation: RelationConfig,
  rollup: RollupMeta
): SQL | undefined {
  const { condition, value } = filter;
  if (isDraftFilter(condition as FilterCondition, value)) {
    return undefined;
  }

  const subquery = buildRollupSubquery(table, relation, rollup);

  switch (condition) {
    case "eq":
      return sql`${subquery} = ${value}`;
    case "ne":
      return sql`${subquery} != ${value}`;
    case "lt":
      return sql`${subquery} < ${value}`;
    case "lte":
      return sql`${subquery} <= ${value}`;
    case "gt":
      return sql`${subquery} > ${value}`;
    case "gte":
      return sql`${subquery} >= ${value}`;
    case "isEmpty":
      return sql`${subquery} IS NULL`;
    case "isNotEmpty":
      return sql`${subquery} IS NOT NULL`;
    default:
      return undefined;
  }
}

// ============================================
// Extras: scalar rollup SELECT columns
// ============================================

/**
 * Builds a Drizzle `extras` function for scalar rollup calculations.
 * Each rollup becomes a correlated subquery in the SELECT clause.
 *
 * Uses the function form of extras so that Drizzle provides properly aliased
 * column references for the parent table.
 *
 * @param relations - Relation map for resolving table/FK references
 * @param rollups - Scalar rollup definitions (from property configs)
 * @returns Function suitable for passing to `db.query.*.findMany({ extras })`.
 */
export function buildRollupExtras(
  relations: RelationMap,
  rollups: RollupExtra[]
): (
  fields: Record<string, AnyColumn>,
  operators: { sql: typeof sql }
) => Record<string, SQL.Aliased> {
  // Parse rollup definitions at build time
  const parsed = rollups
    .map((r) => {
      const dotIndex = r.key.indexOf(".");
      if (dotIndex === -1) {
        return null;
      }
      const relationName = r.key.slice(0, dotIndex);
      const fieldName = r.key.slice(dotIndex + 1);
      const relation = relations[relationName];
      if (!relation) {
        return null;
      }
      return {
        extrasKey: r.extrasKey,
        calculation: r.calculation,
        fieldName,
        relation,
      };
    })
    .filter((d) => d !== null);

  return (fields, operators) => {
    const extras: Record<string, SQL.Aliased> = {};

    for (const def of parsed) {
      const relTableName = getTableName(def.relation.table);
      const parentKey = def.relation.parentKey ?? "id";
      const pkColumn = fields[parentKey]; // properly aliased by Drizzle
      // Resolve JS property names to actual DB column names
      const fkColumn = getColumn(
        def.relation.table,
        def.relation.foreignKey as keyof typeof def.relation.table
      );
      const fkRef = rawCol(relTableName, fkColumn.name);
      const fieldColumn = getColumn(
        def.relation.table,
        def.fieldName as keyof typeof def.relation.table
      );
      const fieldRef = rawCol(relTableName, fieldColumn.name);
      const aggregate = buildAggregate(def.calculation, fieldRef);

      extras[def.extrasKey] =
        operators.sql`(SELECT ${aggregate} FROM ${sql.identifier(relTableName)} WHERE ${fkRef} = ${pkColumn})`.as(
          def.extrasKey
        );
    }

    return extras;
  };
}

// ============================================
// Display rollup: flatten relation arrays
// ============================================

/**
 * Replaces nested relation values with object-of-arrays.
 *
 * Many relation: `{ productVariants: [{ sku: "A", price: 10 }, { sku: "B", price: 20 }] }`
 * → `{ productVariants: { sku: ["A", "B"], price: [10, 20] } }`.
 *
 * One relation: `{ category: { id: "x", fullName: "Tools" } }`
 * → `{ category: { id: ["x"], fullName: ["Tools"] } }`.
 *
 * This allows natural dot access (`item.productVariants.sku`, `item.category.fullName`)
 * in formulas and works with dot-notation property keys in transformData.
 *
 * Call this after a Drizzle query with `with: { relation: true }` to make
 * display rollup values (showOriginal/showUnique) directly accessible.
 *
 * @param items - Query result items with nested relations
 * @param relationKeys - Relation names to flatten (e.g., ["productVariants", "category"])
 * @returns The same items array, mutated with object-of-arrays replacing the original values
 */
function flattenManyRelation(
  rows: Record<string, unknown>[]
): Record<string, unknown[]> | null {
  const first = rows[0];
  if (!first) {
    return null;
  }
  // Preserve per-row alignment across fields — consumers that need
  // null/empty filtering (e.g. rollup display) must filter at the call site.
  const flattened: Record<string, unknown[]> = {};
  for (const field of Object.keys(first)) {
    flattened[field] = rows.map((r) => r[field]);
  }
  return flattened;
}

function flattenOneRelation(
  obj: Record<string, unknown>
): Record<string, unknown[]> {
  const flattened: Record<string, unknown[]> = {};
  for (const field of Object.keys(obj)) {
    const v = obj[field];
    flattened[field] = v == null || v === "" ? [] : [v];
  }
  return flattened;
}

function flattenRelation(related: unknown): Record<string, unknown[]> | null {
  if (Array.isArray(related)) {
    return flattenManyRelation(related as Record<string, unknown>[]);
  }
  if (related && typeof related === "object") {
    return flattenOneRelation(related as Record<string, unknown>);
  }
  return null;
}

export function flattenRelationArrays<T>(
  items: T[],
  relationKeys: string[]
): T[] {
  for (const item of items) {
    const raw = item as Record<string, unknown>;
    for (const relationKey of relationKeys) {
      const flattened = flattenRelation(raw[relationKey]);
      if (flattened) {
        raw[relationKey] = flattened;
      }
    }
  }
  return items;
}
