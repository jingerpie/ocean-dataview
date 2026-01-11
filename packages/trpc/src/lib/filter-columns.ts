import {
	type Filter,
	type FilterCondition,
	isCompoundFilter,
} from "@ocean-dataview/shared/types";
import {
	type AnyColumn,
	and,
	eq,
	gt,
	gte,
	ilike,
	inArray,
	isNotNull,
	isNull,
	lt,
	lte,
	ne,
	not,
	notInArray,
	or,
	type SQL,
	type Table,
} from "drizzle-orm";

/**
 * Converts filter to Drizzle SQL conditions.
 * Handles recursive AND/OR compound filters.
 *
 * @param table - Drizzle table schema
 * @param filter - Filter (single condition or compound AND/OR)
 * @returns SQL condition or undefined if no valid filter
 *
 * @example
 * ```typescript
 * // Single condition
 * const where = buildWhere(listing, {
 *   property: "title",
 *   operator: "iLike",
 *   value: "phone"
 * });
 *
 * // Compound filter (AND)
 * const where = buildWhere(listing, {
 *   and: [
 *     { property: "price", operator: "gt", value: 100 },
 *     { property: "status", operator: "eq", value: "active" }
 *   ]
 * });
 *
 * // Nested (OR containing ANDs)
 * const where = buildWhere(listing, {
 *   or: [
 *     { and: [{ property: "price", operator: "gt", value: 100 }, { property: "status", operator: "eq", value: "active" }] },
 *     { and: [{ property: "featured", operator: "eq", value: true }] }
 *   ]
 * });
 * ```
 */
export function buildWhere<T extends Table>(
	table: T,
	filter: Filter | null | undefined,
): SQL | undefined {
	if (!filter) return undefined;

	// Handle compound filter (AND/OR)
	if (isCompoundFilter(filter)) {
		if (filter.and) {
			const conditions = filter.and
				.map((f) => buildWhere(table, f))
				.filter((c): c is SQL => c !== undefined);
			return conditions.length > 0 ? and(...conditions) : undefined;
		}

		if (filter.or) {
			const conditions = filter.or
				.map((f) => buildWhere(table, f))
				.filter((c): c is SQL => c !== undefined);
			return conditions.length > 0 ? or(...conditions) : undefined;
		}

		return undefined;
	}

	// Handle single condition
	return buildCondition(table, filter);
}

/**
 * Builds SQL condition for a single filter condition.
 */
function buildCondition<T extends Table>(
	table: T,
	filter: FilterCondition,
): SQL | undefined {
	const { property, operator, value } = filter;
	const column = getColumn(table, property as keyof T);

	if (!column) return undefined;

	switch (operator) {
		// ============================================
		// Text operators (handle wildcards internally)
		// ============================================
		case "iLike":
			return typeof value === "string"
				? ilike(column, `%${value}%`)
				: undefined;

		case "notILike":
			return typeof value === "string"
				? not(ilike(column, `%${value}%`))
				: undefined;

		// ============================================
		// Equality operators
		// ============================================
		case "eq":
			return eq(column, value);

		case "ne":
			return ne(column, value);

		// ============================================
		// Comparison operators
		// ============================================
		case "lt":
			return lt(column, value);

		case "lte":
			return lte(column, value);

		case "gt":
			return gt(column, value);

		case "gte":
			return gte(column, value);

		// ============================================
		// Array operators
		// ============================================
		case "inArray":
			return Array.isArray(value) ? inArray(column, value) : undefined;

		case "notInArray":
			return Array.isArray(value) ? notInArray(column, value) : undefined;

		// ============================================
		// Range operator
		// ============================================
		case "isBetween":
			if (Array.isArray(value) && value.length === 2) {
				const [min, max] = value;
				const conditions: SQL[] = [];
				if (min != null) conditions.push(gte(column, min));
				if (max != null) conditions.push(lte(column, max));
				return conditions.length > 0 ? and(...conditions) : undefined;
			}
			return undefined;

		// ============================================
		// Empty operators
		// ============================================
		case "isEmpty":
			return or(isNull(column), eq(column, ""));

		case "isNotEmpty":
			return and(isNotNull(column), ne(column, ""));

		default:
			// Unknown operator - skip silently
			return undefined;
	}
}

/**
 * Helper to get typed column from table
 */
export function getColumn<T extends Table>(
	table: T,
	columnKey: keyof T,
): AnyColumn {
	return table[columnKey] as AnyColumn;
}
