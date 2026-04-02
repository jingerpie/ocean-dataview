import { z } from "zod";
import type { DataTableConfig } from "./config";

// ============================================================================
// Condition Types (from config)
// ============================================================================

export type FilterCondition = DataTableConfig["conditionalOperators"][number];

// ============================================================================
// Where Types - SQL-inspired naming
// ============================================================================

/**
 * Leaf node - single WHERE rule
 */
export interface WhereRule {
  condition: FilterCondition;
  property: string;
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

// ============================================================================
// Type Guards
// ============================================================================

export function isWhereExpression(node: WhereNode): node is WhereExpression {
  return "and" in node || "or" in node;
}

export function isWhereRule(node: WhereNode): node is WhereRule {
  return "property" in node && "condition" in node;
}
