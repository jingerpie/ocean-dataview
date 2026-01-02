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
import { isValidOperatorForVariant } from "../utils/data-table";

const DEFAULT_LIMIT = 10;

// Validator for filter arrays
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

// Validator for sort arrays
const createSortValidator =
	<T>(keys: string[]) =>
	(value: unknown): PropertySort<T>[] | null => {
		if (!Array.isArray(value)) return null;
		const validKeys = new Set(keys);

		const isValid = value.every(
			(item) =>
				typeof item === "object" &&
				item !== null &&
				"propertyId" in item &&
				"desc" in item &&
				typeof item.propertyId === "string" &&
				typeof item.desc === "boolean" &&
				validKeys.has(item.propertyId),
		);
		return isValid ? (value as PropertySort<T>[]) : null;
	};

// Validator for cursors array (unified pagination state)
const cursorsValidator = (value: unknown): CursorState[] | null => {
	if (!Array.isArray(value)) return null;
	const result = z.array(cursorStateSchema).safeParse(value);
	return result.success ? result.data : null;
};

// Validator for expanded array (group expansion state)
const expandedValidator = (value: unknown): string[] | null => {
	if (!Array.isArray(value)) return null;
	return value.every((v) => typeof v === "string") ? (value as string[]) : null;
};

/**
 * Creates a Zod schema for search params validation (for TRPC input).
 * Uses cursor-based pagination with after/before cursors.
 *
 * @example
 * ```ts
 * const listingSearchParamsSchema = createSearchParamsSchema(selectListingSchema);
 * // Use with TRPC: .input(listingSearchParamsSchema)
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

	const baseSchema = z.object({
		after: z.coerce.string().nullish(), // Forward cursor (coerce number to string)
		before: z.coerce.string().nullish(), // Backward cursor (coerce number to string)
		limit: z.number().int().min(1).max(200).default(DEFAULT_LIMIT),
		filters: z.array(filterSchema).default([]),
		sort: z.array(sortSchema).default([]),
		joinOperator: z.enum(["and", "or"]).default("and"),
	});

	// Return an object that IS the schema but also has an extend method
	const schemaWithExtends = Object.assign(baseSchema, {
		extend<E extends z.ZodRawShape>(extension: E) {
			return baseSchema.merge(z.object(extension));
		},
	});

	return schemaWithExtends;
};

/**
 * Creates a NUQS search params cache for cursor-based pagination.
 * Use this for parsing URL search params in Server Components.
 *
 * @example
 * ```ts
 * // Create cache
 * const listingSearchParamsCache = createSearchParamsParsers(selectListingSchema);
 *
 * // In Server Component
 * const params = await listingSearchParamsCache.parse(searchParams);
 * ```
 */
export const createSearchParamsParsers = <T extends z.ZodRawShape>(
	schema: z.ZodObject<T>,
) => {
	const keys = Object.keys(schema.shape) as Array<Extract<keyof T, string>>;
	type Schema = z.infer<typeof schema>;

	const baseType = {
		// Unified pagination (replaces after/before AND cursor/dir/start)
		cursors: parseAsJson(cursorsValidator).withDefault([]),
		limit: parseAsInteger.withDefault(DEFAULT_LIMIT),

		// Expansion state (null = use default, [] = explicit empty)
		expanded: parseAsJson(expandedValidator),

		// Filters & Sort
		filters: parseAsJson(filtersValidator).withDefault([]),
		sort: parseAsJson(createSortValidator<Schema>(keys)).withDefault([]),
		joinOperator: createParser({
			parse: (v) => (v === "and" || v === "or" ? v : "and") as "and" | "or",
			serialize: (v) => v,
		}).withDefault("and" as const),
	};

	return createSearchParamsCache(baseType);
};

// ============================================================================
// Client-side parsers for nuqs updates
// ============================================================================

/**
 * Generic JSON array parser for client-side nuqs state
 */
export const parseAsJsonArray = <T>() =>
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

/**
 * Client-side parser for cursors array
 */
export const parseAsCursors = parseAsJsonArray<CursorState>();

/**
 * Client-side parser for expanded array
 */
export const parseAsExpanded = parseAsJsonArray<string>();
