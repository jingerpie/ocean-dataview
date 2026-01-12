import {
	createParser,
	createSearchParamsCache,
	parseAsInteger,
	parseAsJson,
} from "nuqs/server";
import { z } from "zod";
import {
	type Filter,
	filterSchema,
	type PropertySort,
} from "../types/data-table.type";
import {
	type Cursors,
	type CursorValue,
	cursorsSchema,
	cursorValueSchema,
} from "../types/pagination.type";
import { validateFilter } from "../utils/filter-validation";

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_LIMIT = 25;

// ============================================================================
// Validators (for NUQS JSON parsing)
// ============================================================================

const filterValidator = (value: unknown): Filter | null => {
	const result = filterSchema.safeParse(value);
	return result.success ? result.data : null;
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
		// New filter structure: single object with recursive AND/OR
		// Transform validates filter, removing empty conditions before tRPC processing
		filter: filterSchema
			.nullish()
			.transform((f) => (f ? validateFilter(f) : null)),
		sort: z.array(sortSchema).default([]),
	});
};

// ============================================================================
// 2. Server-side NUQS Parsers (for URL params in RSC)
// ============================================================================

// Shared parsers used by both flat and grouped pagination
const sharedParsers = {
	limit: parseAsInteger.withDefault(DEFAULT_LIMIT),
	filter: parseAsJson(filterValidator), // Single filter object (recursive AND/OR)
	sort: parseAsJson(sortValidator).withDefault([]),
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
 * const { cursor, limit, filter, sort } = paginationParams.parse(searchParams);
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
 * const { cursors, expanded, limit, filter, sort } = groupPaginationParams.parse(searchParams);
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

/** Client-side parser for filter (recursive AND/OR structure) */
export const parseAsFilter = createParser({
	parse: (value: string): Filter | null => {
		try {
			const parsed = JSON.parse(value);
			return filterValidator(parsed);
		} catch {
			return null;
		}
	},
	serialize: (value: Filter) => JSON.stringify(value),
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
