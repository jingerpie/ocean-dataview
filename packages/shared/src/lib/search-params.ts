import {
	createParser,
	createSearchParamsCache,
	parseAsInteger,
	parseAsJson,
} from "nuqs/server";
import { z } from "zod";
import { dataTableConfig } from "../config/data-table";
import type { PropertyFilter, PropertySort } from "../types/data-table.type";
import {
	type Cursors,
	type CursorValue,
	cursorsSchema,
	cursorValueSchema,
} from "../types/pagination.type";
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

const cursorValidator = (value: unknown): CursorValue | null => {
	if (typeof value !== "object" || value === null || Array.isArray(value))
		return null;
	const result = cursorValueSchema.safeParse(value);
	return result.success ? result.data : null;
};

const cursorsValidator = (value: unknown): Cursors | null => {
	if (typeof value !== "object" || value === null || Array.isArray(value))
		return null;
	const result = cursorsSchema.safeParse(value);
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
		// Cursor: CursorValue object (page-based) or string (infinite queries)
		// Using nullish() to accept null from NUQS parsers
		cursor: z.union([cursorValueSchema, z.string()]).nullish(),
		limit: z.number().int().min(1).max(200).default(DEFAULT_LIMIT),
		filters: z.array(filterSchema).default([]),
		sort: z.array(sortSchema).default([]),
		joinOperator: z.enum(["and", "or"]).default("and"),
	});
};

// ============================================================================
// 2. Server-side NUQS Parsers (for URL params in RSC)
// ============================================================================

// Shared parsers used by both flat and grouped pagination
const sharedParsers = {
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
};

/**
 * Flat pagination params for server-side URL parsing.
 * Uses single `cursor` param.
 *
 * @example
 * ```ts
 * const { cursor, limit, filters, sort } = paginationParams.parse(searchParams);
 * ```
 */
export const paginationParams = createSearchParamsCache({
	cursor: parseAsJson(cursorValidator),
	...sharedParsers,
});

/**
 * Grouped pagination params for server-side URL parsing.
 * Uses `cursors` object map and `expanded` array.
 *
 * @example
 * ```ts
 * const { cursors, expanded, limit, filters, sort } = groupPaginationParams.parse(searchParams);
 * ```
 */
export const groupPaginationParams = createSearchParamsCache({
	cursors: parseAsJson(cursorsValidator).withDefault({}),
	expanded: parseAsJson(expandedValidator),
	...sharedParsers,
});

// ============================================================================
// 3. Client-side Parsers (for hooks with useQueryState)
// ============================================================================

/** Client-side parser for cursor (flat pagination) */
export const parseAsCursor = createParser({
	parse: (value: string): CursorValue | null => {
		try {
			const parsed = JSON.parse(value);
			return cursorValidator(parsed);
		} catch {
			return null;
		}
	},
	serialize: (value: CursorValue) => JSON.stringify(value),
});

/** Client-side parser for cursors object (grouped pagination) */
export const parseAsCursors = createParser({
	parse: (value: string): Cursors | null => {
		try {
			const parsed = JSON.parse(value);
			return cursorsValidator(parsed);
		} catch {
			return null;
		}
	},
	serialize: (value: Cursors) => JSON.stringify(value),
});

/** Client-side parser for expanded groups array */
export const parseAsExpanded = createParser({
	parse: (value: string): string[] | null => {
		try {
			const parsed = JSON.parse(value);
			return expandedValidator(parsed);
		} catch {
			return null;
		}
	},
	serialize: (value: string[]) => JSON.stringify(value),
});

/** Client-side parser for filters array */
export const parseAsFilters = createParser({
	parse: (value: string): PropertyFilter<unknown>[] | null => {
		try {
			const parsed = JSON.parse(value);
			return filtersValidator(parsed);
		} catch {
			return null;
		}
	},
	serialize: (value: PropertyFilter<unknown>[]) => JSON.stringify(value),
});

/** Client-side parser for sort array */
export const parseAsSort = createParser({
	parse: (value: string): PropertySort<unknown>[] | null => {
		try {
			const parsed = JSON.parse(value);
			return sortValidator(parsed);
		} catch {
			return null;
		}
	},
	serialize: (value: PropertySort<unknown>[]) => JSON.stringify(value),
});
