import type { FC, SVGProps } from "react";
import { z } from "zod";
import type { DataTableConfig } from "./config";

// ============================================================================
// UI Types
// ============================================================================

export interface Option {
  count?: number;
  icon?: FC<SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
}

// ============================================================================
// Condition Types (from config)
// ============================================================================

export type FilterCondition = DataTableConfig["conditionalOperators"][number];

// ============================================================================
// Array Quantifier (for display rollup filters)
// ============================================================================

/**
 * Quantifier for array-returning rollup filters (showOriginal / showUnique).
 * Controls how the inner condition is applied across related rows:
 * - "any"   → at least one row matches (EXISTS)
 * - "none"  → no row matches (NOT EXISTS)
 * - "every" → all rows match (NOT EXISTS ... AND NOT condition)
 */
export type Quantifier = "any" | "none" | "every";

export const quantifierValues = ["any", "none", "every"] as const;

// ============================================================================
// Sort
// ============================================================================

/**
 * Sort configuration for a property.
 *
 * Property is typed as `string` for runtime flexibility.
 * Use `satisfies` for type-safe property name validation at definition time.
 *
 * @example
 * // Type-safe definition with satisfies
 * const defaultSort = [
 *   { property: "name", direction: "asc" }
 * ] satisfies SortQuery[];
 *
 * // Or with explicit keyof constraint
 * const sort: { property: keyof Product; direction: "asc" | "desc" } = { property: "name", direction: "asc" };
 */
export interface SortQuery {
  /** Custom sort order for status/select properties - pre-computed by client */
  customOrder?: string[];
  direction: "asc" | "desc";
  property: string;
}

// ============================================================================
// Where Types - SQL-inspired naming
// ============================================================================

/**
 * Leaf node - single WHERE rule
 */
export interface WhereRule {
  condition: FilterCondition;
  property: string;
  /** Quantifier for array-returning rollup filters (showOriginal/showUnique) */
  quantifier?: Quantifier;
  value?: unknown;
}

/**
 * Branch node - AND/OR grouping
 */
export interface WhereExpression {
  and?: WhereNode[];
  or?: WhereNode[];
}

/**
 * Any node in the WHERE tree
 */
export type WhereNode = WhereRule | WhereExpression;

/**
 * Search parameter - always OR at root, flat (no nesting)
 */
export interface SearchWhereClause {
  or: WhereRule[];
}

// ============================================================================
// Zod Schemas
// ============================================================================

export const conditionValues = [
  "iLike",
  "notILike",
  "eq",
  "ne",
  "inArray",
  "notInArray",
  "isEmpty",
  "isNotEmpty",
  "lt",
  "lte",
  "gt",
  "gte",
  "isBetween",
  "isRelativeToToday",
  "startsWith",
  "endsWith",
  "startsWithNonAlpha",
] as const;

/**
 * Schema for WhereRule
 */
export const whereRuleSchema = z.object({
  quantifier: z.enum(quantifierValues).optional(),
  condition: z.enum(conditionValues),
  property: z.string(),
  value: z.unknown().optional(),
});

/**
 * Schema for WhereExpression (recursive)
 */
export const whereExpressionSchema: z.ZodType<WhereExpression> = z.lazy(() =>
  z
    .object({
      and: z.array(whereNodeSchema).optional(),
      or: z.array(whereNodeSchema).optional(),
    })
    .refine(
      (obj) => {
        const hasAnd = obj.and !== undefined;
        const hasOr = obj.or !== undefined;
        return (hasAnd && !hasOr) || (!hasAnd && hasOr);
      },
      { message: "Exactly one of 'and' or 'or' required" }
    )
);

/**
 * Schema for WhereNode
 */
export const whereNodeSchema: z.ZodType<WhereNode> = z.union([
  whereRuleSchema,
  whereExpressionSchema,
]);

/**
 * Schema for SearchWhereClause - always { or: WhereRule[] }
 */
export const searchWhereClauseSchema: z.ZodType<SearchWhereClause> = z.object({
  or: z.array(whereRuleSchema),
});

/**
 * Validated search output from `validateSearch()`.
 * Contains the trimmed search string and the searchable field IDs
 * derived from properties with `enableSearch`.
 */
export interface SearchQuery {
  search: string;
  searchFields: string[];
}

// ============================================================================
// Type Guards
// ============================================================================

export function isWhereExpression(node: WhereNode): node is WhereExpression {
  return "and" in node || "or" in node;
}

export function isWhereRule(node: WhereNode): node is WhereRule {
  return "property" in node && "condition" in node;
}

// ============================================================================
// Property Type
// ============================================================================

/**
 * Property types supported by the filter system.
 */
export type PropertyType =
  | "text"
  | "number"
  | "select"
  | "multiSelect"
  | "status"
  | "date"
  | "checkbox"
  | "url"
  | "email"
  | "phone"
  | "filesMedia"
  | "formula"
  | "button"
  | "rollup";
