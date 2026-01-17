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
// Operators (from config)
// ============================================================================

export type FilterOperator = DataTableConfig["operators"][number];

// ============================================================================
// Sort
// ============================================================================

export interface PropertySort<TData> {
	propertyId: Extract<keyof TData, string>;
	desc: boolean;
}

// ============================================================================
// Where Types - SQL-inspired naming
// ============================================================================

/**
 * Leaf node - single WHERE condition
 */
export interface WhereCondition {
	property: string;
	operator: FilterOperator;
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
export type WhereNode = WhereCondition | WhereExpression;

/**
 * Search parameter - always OR at root, flat (no nesting)
 */
export interface SearchQuery {
	or: WhereCondition[];
}

/**
 * Filter parameter - always AND at root, can nest
 */
export interface FilterQuery {
	and: WhereNode[];
}

// ============================================================================
// Zod Schemas
// ============================================================================

const operatorValues = [
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
 * Schema for WhereCondition
 */
export const whereConditionSchema = z.object({
	property: z.string(),
	operator: z.enum(operatorValues),
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
	whereConditionSchema,
	whereExpressionSchema,
]);

/**
 * Schema for SearchQuery - always { or: WhereCondition[] }
 */
export const searchQuerySchema: z.ZodType<SearchQuery> = z.object({
	or: z.array(whereConditionSchema),
});

/**
 * Schema for FilterQuery - always { and: WhereNode[] }
 */
export const filterQuerySchema: z.ZodType<FilterQuery> = z.object({
	and: z.array(whereNodeSchema),
});

// ============================================================================
// Type Guards
// ============================================================================

export function isWhereExpression(node: WhereNode): node is WhereExpression {
	return "and" in node || "or" in node;
}

export function isWhereCondition(node: WhereNode): node is WhereCondition {
	return "property" in node && "operator" in node;
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
