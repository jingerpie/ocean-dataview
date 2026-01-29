import type { FC, SVGProps } from "react";
import { z } from "zod";
import type { DataTableConfig } from "../config/data-table";

// ============================================================================
// UI Types
// ============================================================================

export interface Option {
  label: string;
  value: string;
  count?: number;
  icon?: FC<SVGProps<SVGSVGElement>>;
}

// ============================================================================
// Condition Types (from config)
// ============================================================================

export type FilterCondition = DataTableConfig["conditionalOperators"][number];

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
  property: string;
  direction: "asc" | "desc";
}

// ============================================================================
// Where Types - SQL-inspired naming
// ============================================================================

/**
 * Leaf node - single WHERE rule
 */
export interface WhereRule {
  property: string;
  condition: FilterCondition;
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
export interface SearchQuery {
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
] as const;

/**
 * Schema for WhereRule
 */
export const whereRuleSchema = z.object({
  property: z.string(),
  condition: z.enum(conditionValues),
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
 * Schema for SearchQuery - always { or: WhereRule[] }
 */
export const searchQuerySchema: z.ZodType<SearchQuery> = z.object({
  or: z.array(whereRuleSchema),
});

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
// Filter Variant - Maps property types to UI input types
// ============================================================================

export type FilterVariant =
  | "text"
  | "number"
  | "range"
  | "date"
  | "dateRange"
  | "boolean"
  | "select"
  | "multiSelect"
  | "files";
