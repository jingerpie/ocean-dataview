import {
	createParser,
	createSearchParamsCache,
	parseAsInteger,
	parseAsJson,
} from "nuqs/server";
import { z } from "zod";
import { dataTableConfig } from "../config/data-table";
import type { PropertyFilter, PropertySort } from "../types/data-table.type";
import { type CursorState, cursorStateSchema } from "../types/pagination.type";
import { isValidOperatorForVariant } from "../utils/filter";

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_LIMIT = 25;

// ============================================================================
// Validators (for NUQS JSON parsing)
// ============================================================================

const filtersValidator = (value: unknown): PropertyFilter<unknown>[] | null => {
	if (!Array.isArray(value)) return null;
	const operators = dataTableConfig.operators as readonly string[];
	const variants = dataTableConfig.filterVariants as readonly string[];

	const isValid = value.every(
		(item) =>
			typeof item === "object" &&
			item !== null &&
			"propertyId" in item &&
			"value" in item &&
			"variant" in item &&
			"operator" in item &&
			"filterId" in item &&
			typeof item.propertyId === "string" &&
			typeof item.filterId === "string" &&
			operators.includes(item.operator as string) &&
			variants.includes(item.variant as string),
	);
	return isValid ? (value as PropertyFilter<unknown>[]) : null;
};

const sortValidator = (value: unknown): PropertySort<unknown>[] | null => {
	if (!Array.isArray(value)) return null;

	const isValid = value.every(
		(item) =>
			typeof item === "object" &&
			item !== null &&
			"propertyId" in item &&
			"desc" in item &&
			typeof item.propertyId === "string" &&
			typeof item.desc === "boolean",
	);
	return isValid ? (value as PropertySort<unknown>[]) : null;
};

const cursorsValidator = (value: unknown): CursorState[] | null => {
	if (!Array.isArray(value)) return null;
	const result = z.array(cursorStateSchema).safeParse(value);
	return result.success ? result.data : null;
};

const expandedValidator = (value: unknown): string[] | null => {
	if (!Array.isArray(value)) return null;
	return value.every((v) => typeof v === "string") ? (value as string[]) : null;
};

// ============================================================================
// 1. TRPC Zod Schema (for input validation)
// ============================================================================

/**
 * Creates a Zod schema for TRPC input validation.
 * Schema-bound: validates propertyId against entity keys.
 *
 * @example
 * ```ts
 * const productSearchParamsSchema = createSearchParamsSchema(selectProductSchema);
 * // Use with TRPC: .input(productSearchParamsSchema)
 * ```
 */
export const createSearchParamsSchema = <T extends z.ZodRawShape>(
	schema: z.ZodObject<T>,
) => {
	const keys = Object.keys(schema.shape) as Array<Extract<keyof T, string>>;

	const filterSchema = z
		.object({
			propertyId: z.enum(
				keys as [Extract<keyof T, string>, ...Extract<keyof T, string>[]],
			),
			value: z.union([z.string(), z.array(z.string())]),
			variant: z.enum(dataTableConfig.filterVariants),
			operator: z.enum(dataTableConfig.operators),
			filterId: z.string(),
		})
		.refine(
			(filter) => isValidOperatorForVariant(filter.operator, filter.variant),
			{ message: "Invalid operator for filter variant" },
		);

	const sortSchema = z.object({
		propertyId: z.enum(
			keys as [Extract<keyof T, string>, ...Extract<keyof T, string>[]],
		),
		desc: z.boolean(),
	});

	return z.object({
		// Cursor: CursorState object (page-based) or string (infinite queries)
		cursor: z.union([cursorStateSchema, z.string()]).optional(),
		limit: z.number().int().min(1).max(200).default(DEFAULT_LIMIT),
		filters: z.array(filterSchema).default([]),
		sort: z.array(sortSchema).default([]),
		joinOperator: z.enum(["and", "or"]).default("and"),
	});
};

// ============================================================================
// 2. Server-side NUQS Parser (for URL params in RSC)
// ============================================================================

/**
 * Unified DataView params for server-side URL parsing.
 * Use in Server Components to parse searchParams.
 *
 * @example
 * ```ts
 * const { cursors, limit, filters, sort, expanded } = await dataViewParams.parse(searchParams);
 * ```
 */
export const dataViewParams = createSearchParamsCache({
	cursors: parseAsJson(cursorsValidator).withDefault([]),
	expanded: parseAsJson(expandedValidator),
	limit: parseAsInteger.withDefault(DEFAULT_LIMIT),
	filters: parseAsJson(filtersValidator).withDefault([]),
	sort: parseAsJson(sortValidator).withDefault([]),
	joinOperator: createParser({
		parse: (v) => (v === "and" || v === "or" ? v : "and") as "and" | "or",
		serialize: (v) => v,
	}).withDefault("and" as const),
	search: createParser({
		parse: (v) => (typeof v === "string" ? v : ""),
		serialize: (v) => v,
	}).withDefault(""),
});

// ============================================================================
// 3. Client-side Parsers (for hooks with useQueryState)
// ============================================================================

const parseAsJsonArray = <T>() =>
	createParser({
		parse: (value: string) => {
			try {
				const parsed = JSON.parse(value);
				return Array.isArray(parsed) ? (parsed as T[]) : null;
			} catch {
				return null;
			}
		},
		serialize: (value: T[]) => JSON.stringify(value),
	});

/** Client-side parser for cursors array */
export const parseAsCursors = parseAsJsonArray<CursorState>();

/** Client-side parser for expanded groups array */
export const parseAsExpanded = parseAsJsonArray<string>();

/** Client-side parser for filters array */
export const parseAsFilters = parseAsJsonArray<PropertyFilter<unknown>>();

/** Client-side parser for sort array */
export const parseAsSort = parseAsJsonArray<PropertySort<unknown>>();
