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
// Filter - New Simplified Structure
// ============================================================================

/**
 * Single filter condition.
 * Property type is inferred from schema, not stored in filter.
 */
export interface FilterCondition {
	property: string;
	operator: FilterOperator;
	value?: unknown; // Optional for isEmpty/isNotEmpty
}

/**
 * Compound filter with AND/OR logic.
 * Supports nesting up to 2 levels.
 */
export interface CompoundFilter {
	and?: Filter[];
	or?: Filter[];
}

/**
 * Filter can be a single condition or compound (AND/OR).
 */
export type Filter = FilterCondition | CompoundFilter;

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

/**
 * Valid operators from config
 */
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
] as const;

/**
 * Schema for single filter condition.
 */
export const filterConditionSchema = z.object({
	property: z.string(),
	operator: z.enum(operatorValues),
	value: z.unknown().optional(),
});

/**
 * Schema for compound filter (recursive).
 */
export const compoundFilterSchema: z.ZodType<CompoundFilter> = z.lazy(() =>
	z
		.object({
			and: z.array(filterSchema).optional(),
			or: z.array(filterSchema).optional(),
		})
		.refine(
			(obj) => {
				const hasAnd = obj.and !== undefined;
				const hasOr = obj.or !== undefined;
				// Must have exactly one of 'and' or 'or'
				return (hasAnd && !hasOr) || (!hasAnd && hasOr);
			},
			{ message: "Exactly one of 'and' or 'or' required" },
		),
);

/**
 * Schema for filter (condition or compound).
 */
export const filterSchema: z.ZodType<Filter> = z.union([
	filterConditionSchema,
	compoundFilterSchema,
]);

// ============================================================================
// Type Guards
// ============================================================================

export function isCompoundFilter(filter: Filter): filter is CompoundFilter {
	return "and" in filter || "or" in filter;
}

export function isFilterCondition(filter: Filter): filter is FilterCondition {
	return "property" in filter && "operator" in filter;
}

// ============================================================================
// Filter Variant - Maps property types to UI input types
// ============================================================================

/**
 * Filter variant type for determining which operators and inputs to use.
 * Used by filter-rule.tsx to map property types to appropriate filter UI.
 */
export type FilterVariant =
	| "text"
	| "number"
	| "range"
	| "date"
	| "dateRange"
	| "boolean"
	| "select"
	| "multiSelect";
