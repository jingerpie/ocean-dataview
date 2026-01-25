import {
	createParser,
	createSearchParamsCache,
	parseAsInteger,
	parseAsJson,
} from "nuqs/server";
import { z } from "zod";
import {
	type FilterQuery,
	filterQuerySchema,
	isWhereExpression,
	isWhereRule,
	type PropertySort,
	searchQuerySchema,
	type WhereNode,
} from "../types/data-table.type";
import {
	type Cursors,
	type CursorValue,
	cursorsSchema,
	cursorValueSchema,
} from "../types/pagination.type";
import { validateFilter } from "../utils/filter-validation";
import { validateSort } from "../utils/sort-validation";

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_LIMIT = 25;

// ============================================================================
// Filter URL Transformation Helpers
// ============================================================================

/**
 * Transform URL node to code node.
 *
 * URL format uses compact positional arrays for rules:
 *   [property, condition, value?]
 *
 * Code format uses objects:
 *   { property, condition, value? }
 */
const transformUrlToCode = (node: unknown): WhereNode | null => {
	// Rule: positional array [property, condition, value?]
	if (Array.isArray(node)) {
		const [property, condition, value] = node;
		if (typeof property === "string" && typeof condition === "string") {
			return { property, condition, value } as WhereNode;
		}
		return null;
	}

	if (typeof node !== "object" || node === null) {
		return null;
	}

	// Expression: { and: [...] } or { or: [...] }
	if ("and" in node || "or" in node) {
		const expr = node as { and?: unknown[]; or?: unknown[] };
		if (expr.and) {
			const transformedAnd = expr.and
				.map(transformUrlToCode)
				.filter((n): n is WhereNode => n !== null);
			return { and: transformedAnd };
		}
		if (expr.or) {
			const transformedOr = expr.or
				.map(transformUrlToCode)
				.filter((n): n is WhereNode => n !== null);
			return { or: transformedOr };
		}
	}

	return null;
};

/**
 * Transform code node to URL node.
 *
 * Code format uses objects:
 *   { property, condition, value? }
 *
 * URL format uses compact positional arrays for rules:
 *   [property, condition, value?]
 */
const transformCodeToUrl = (node: WhereNode): unknown => {
	if (isWhereRule(node)) {
		// Compact array format: [property, condition, value?]
		// Omit value if null/undefined for shorter URLs
		if (node.value == null) {
			return [node.property, node.condition];
		}
		return [node.property, node.condition, node.value];
	}

	if (isWhereExpression(node)) {
		if (node.and) {
			return { and: node.and.map(transformCodeToUrl) };
		}
		if (node.or) {
			return { or: node.or.map(transformCodeToUrl) };
		}
	}

	return node;
};

// ============================================================================
// Validators (for NUQS JSON parsing)
// ============================================================================

const filterQueryValidator = (value: unknown): FilterQuery | null => {
	// URL format is just an array (root AND is implicit)
	if (!Array.isArray(value)) {
		return null;
	}

	// Transform URL format to code format
	const transformedAnd = value
		.map(transformUrlToCode)
		.filter((n): n is WhereNode => n !== null);

	const transformed: FilterQuery = { and: transformedAnd };
	const result = filterQuerySchema.safeParse(transformed);
	return result.success ? result.data : null;
};

/**
 * Transform URL sort format to code format.
 *
 * URL format: ["property", "asc"|"desc"]
 * Code format: { property, desc: boolean }
 */
const sortValidator = (value: unknown): PropertySort[] | null => {
	if (!Array.isArray(value)) {
		return null;
	}

	const result: Array<{ property: string; desc: boolean }> = [];

	for (const item of value) {
		// Expect positional array: [property, direction]
		if (!Array.isArray(item) || item.length !== 2) {
			return null;
		}

		const [property, direction] = item;
		if (
			typeof property !== "string" ||
			(direction !== "asc" && direction !== "desc")
		) {
			return null;
		}

		result.push({ property, desc: direction === "desc" });
	}

	return result as PropertySort[];
};

const cursorValidator = (value: unknown): CursorValue | null => {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return null;
	}
	const result = cursorValueSchema.safeParse(value);
	return result.success ? result.data : null;
};

const cursorsValidator = (value: unknown): Cursors | null => {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return null;
	}
	const result = cursorsSchema.safeParse(value);
	return result.success ? result.data : null;
};

const expandedValidator = (value: unknown): string[] | null => {
	if (!Array.isArray(value)) {
		return null;
	}
	return value.every((v) => typeof v === "string") ? (value as string[]) : null;
};

// ============================================================================
// 1. TRPC Zod Schema (for input validation)
// ============================================================================

/**
 * Schema for sort entries - property is a string, not typed to entity keys.
 * Validation of property names happens at runtime when building queries.
 */
const sortEntrySchema = z.object({
	property: z.string(),
	desc: z.boolean(),
});

/**
 * Creates a Zod schema for TRPC input validation.
 * Sort property validation is runtime-based, not schema-bound.
 */
export const createSearchParamsSchema = <T extends z.ZodRawShape>(
	_schema: z.ZodObject<T>
) => {
	return z.object({
		cursor: z.union([cursorValueSchema, z.string()]).nullish(),
		limit: z.number().int().min(1).max(200).default(DEFAULT_LIMIT),
		search: searchQuerySchema.nullish(),
		filter: filterQuerySchema
			.nullish()
			.transform((f) => (f ? validateFilter(f) : null)),
		sort: z.array(sortEntrySchema).default([]).transform(validateSort),
	});
};

// ============================================================================
// 2. Server-side NUQS Parsers (for URL params in RSC)
// ============================================================================

const sharedParsers = {
	limit: parseAsInteger.withDefault(DEFAULT_LIMIT),
	filter: parseAsJson(filterQueryValidator),
	sort: parseAsJson(sortValidator).withDefault([]),
	search: createParser({
		parse: (v) => (typeof v === "string" ? v : ""),
		serialize: (v) => v,
	}).withDefault(""),
};

/**
 * Flat pagination params for server-side URL parsing.
 */
export const paginationParams = createSearchParamsCache({
	cursor: parseAsJson(cursorValidator),
	...sharedParsers,
});

/**
 * Grouped pagination params for server-side URL parsing.
 */
export const groupPaginationParams = createSearchParamsCache({
	cursors: parseAsJson(cursorsValidator).withDefault({}),
	expanded: parseAsJson(expandedValidator),
	...sharedParsers,
});

// ============================================================================
// 3. Client-side Parsers (for hooks with useQueryState)
// ============================================================================

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

export const parseAsFilter = createParser({
	parse: (value: string): FilterQuery | null => {
		try {
			const parsed = JSON.parse(value);
			return filterQueryValidator(parsed);
		} catch {
			return null;
		}
	},
	// Serialize without root {"and":} wrapper - just the array
	serialize: (value: FilterQuery) =>
		JSON.stringify(value.and.map(transformCodeToUrl)),
});

export const parseAsSort = createParser({
	parse: (value: string): PropertySort[] | null => {
		try {
			const parsed = JSON.parse(value);
			return sortValidator(parsed);
		} catch {
			return null;
		}
	},
	// Transform to compact positional array format: ["property", "asc"|"desc"]
	serialize: (value: PropertySort[]) =>
		JSON.stringify(value.map((s) => [s.property, s.desc ? "desc" : "asc"])),
});
