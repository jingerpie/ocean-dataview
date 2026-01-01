import type {
	FilterOperator,
	FilterVariant,
	JoinOperator,
} from "@ocean-dataview/shared/types";
import { addDays, endOfDay, startOfDay } from "date-fns";
import {
	type AnyColumn,
	and,
	eq,
	gt,
	gte,
	ilike,
	inArray,
	lt,
	lte,
	ne,
	not,
	notIlike,
	notInArray,
	or,
	type SQL,
	type Table,
} from "drizzle-orm";
import { isEmpty } from "./helpers";

/**
 * Filter configuration for a single property (table column)
 */
export interface PropertyFilter<T extends Table> {
	/** Property/column name (must be a key of the table) */
	propertyId: Extract<keyof T, string>;
	/** Filter value (single value or array for multi-select/range) */
	value: string | string[];
	/** Type of filter (affects value processing) */
	variant: FilterVariant;
	/** Comparison operator */
	operator: FilterOperator;
	/** Unique identifier for this filter rule */
	filterId: string;
}

/**
 * Converts filter configurations to Drizzle SQL conditions
 *
 * @param table - Drizzle table schema
 * @param filters - Array of filter configurations
 * @param joinOperator - How to combine filters ("and" or "or")
 * @returns SQL condition or undefined if no valid filters
 *
 * @example
 * ```typescript
 * const where = filterColumns({
 *   table: listing,
 *   filters: [
 *     { propertyId: "title", value: "phone", variant: "text", operator: "iLike", filterId: "1" },
 *     { propertyId: "price", value: ["100", "500"], variant: "range", operator: "isBetween", filterId: "2" }
 *   ],
 *   joinOperator: "and"
 * });
 *
 * const results = await db.select().from(listing).where(where);
 * ```
 */
export function filterColumns<T extends Table>({
	table,
	filters,
	joinOperator,
}: {
	table: T;
	filters: PropertyFilter<T>[];
	joinOperator: JoinOperator;
}): SQL | undefined {
	const joinFn = joinOperator === "and" ? and : or;

	const conditions = filters.map((filter) => {
		const column = getColumn(table, filter.propertyId);

		switch (filter.operator) {
			// TEXT OPERATORS
			case "iLike":
				return filter.variant === "text" && typeof filter.value === "string"
					? ilike(column, `%${filter.value}%`)
					: undefined;

			case "notILike":
				return filter.variant === "text" && typeof filter.value === "string"
					? notIlike(column, `%${filter.value}%`)
					: undefined;

			// EQUALITY OPERATORS
			case "eq":
				// Boolean handling
				if (column.dataType === "boolean" && typeof filter.value === "string") {
					return eq(column, filter.value === "true");
				}
				// Date handling (full day range: 00:00:00 - 23:59:59)
				if (filter.variant === "date" || filter.variant === "dateRange") {
					const date = new Date(Number(filter.value));
					date.setHours(0, 0, 0, 0);
					const end = new Date(date);
					end.setHours(23, 59, 59, 999);
					return and(gte(column, date), lte(column, end));
				}
				return eq(column, filter.value);

			case "ne":
				// Boolean handling
				if (column.dataType === "boolean" && typeof filter.value === "string") {
					return ne(column, filter.value === "true");
				}
				// Date handling (exclude full day)
				if (filter.variant === "date" || filter.variant === "dateRange") {
					const date = new Date(Number(filter.value));
					date.setHours(0, 0, 0, 0);
					const end = new Date(date);
					end.setHours(23, 59, 59, 999);
					return or(lt(column, date), gt(column, end));
				}
				return ne(column, filter.value);

			// ARRAY OPERATORS
			case "inArray":
				if (Array.isArray(filter.value)) {
					return inArray(column, filter.value);
				}
				return undefined;

			case "notInArray":
				if (Array.isArray(filter.value)) {
					return notInArray(column, filter.value);
				}
				return undefined;

			// COMPARISON OPERATORS
			case "lt":
				return filter.variant === "number" || filter.variant === "range"
					? lt(column, filter.value)
					: filter.variant === "date" && typeof filter.value === "string"
						? lt(
								column,
								(() => {
									const date = new Date(Number(filter.value));
									date.setHours(23, 59, 59, 999); // End of day
									return date;
								})(),
							)
						: undefined;

			case "lte":
				return filter.variant === "number" || filter.variant === "range"
					? lte(column, filter.value)
					: filter.variant === "date" && typeof filter.value === "string"
						? lte(
								column,
								(() => {
									const date = new Date(Number(filter.value));
									date.setHours(23, 59, 59, 999); // End of day
									return date;
								})(),
							)
						: undefined;

			case "gt":
				return filter.variant === "number" || filter.variant === "range"
					? gt(column, filter.value)
					: filter.variant === "date" && typeof filter.value === "string"
						? gt(
								column,
								(() => {
									const date = new Date(Number(filter.value));
									date.setHours(0, 0, 0, 0); // Start of day
									return date;
								})(),
							)
						: undefined;

			case "gte":
				return filter.variant === "number" || filter.variant === "range"
					? gte(column, filter.value)
					: filter.variant === "date" && typeof filter.value === "string"
						? gte(
								column,
								(() => {
									const date = new Date(Number(filter.value));
									date.setHours(0, 0, 0, 0); // Start of day
									return date;
								})(),
							)
						: undefined;

			// RANGE OPERATORS
			case "isBetween":
				// Date range
				if (
					(filter.variant === "date" || filter.variant === "dateRange") &&
					Array.isArray(filter.value) &&
					filter.value.length === 2
				) {
					return and(
						filter.value[0]
							? gte(
									column,
									(() => {
										const date = new Date(Number(filter.value[0]));
										date.setHours(0, 0, 0, 0);
										return date;
									})(),
								)
							: undefined,
						filter.value[1]
							? lte(
									column,
									(() => {
										const date = new Date(Number(filter.value[1]));
										date.setHours(23, 59, 59, 999);
										return date;
									})(),
								)
							: undefined,
					);
				}

				// Number range
				if (
					(filter.variant === "number" || filter.variant === "range") &&
					Array.isArray(filter.value) &&
					filter.value.length === 2
				) {
					const firstValue =
						filter.value[0] && filter.value[0].trim() !== ""
							? Number(filter.value[0])
							: null;
					const secondValue =
						filter.value[1] && filter.value[1].trim() !== ""
							? Number(filter.value[1])
							: null;

					if (firstValue === null && secondValue === null) {
						return undefined;
					}

					if (firstValue !== null && secondValue === null) {
						return eq(column, firstValue);
					}

					if (firstValue === null && secondValue !== null) {
						return eq(column, secondValue);
					}

					return and(
						firstValue !== null ? gte(column, firstValue) : undefined,
						secondValue !== null ? lte(column, secondValue) : undefined,
					);
				}
				return undefined;

			// RELATIVE DATE OPERATOR
			case "isRelativeToToday":
				if (
					(filter.variant === "date" || filter.variant === "dateRange") &&
					typeof filter.value === "string"
				) {
					const today = new Date();
					const [amount, unit] = filter.value.split(" ") ?? [];
					let startDate: Date;
					let endDate: Date;

					if (!amount || !unit) return undefined;

					switch (unit) {
						case "days":
							startDate = startOfDay(addDays(today, Number.parseInt(amount)));
							endDate = endOfDay(startDate);
							break;
						case "weeks":
							startDate = startOfDay(
								addDays(today, Number.parseInt(amount) * 7),
							);
							endDate = endOfDay(addDays(startDate, 6));
							break;
						case "months":
							startDate = startOfDay(
								addDays(today, Number.parseInt(amount) * 30),
							);
							endDate = endOfDay(addDays(startDate, 29));
							break;
						default:
							return undefined;
					}

					return and(gte(column, startDate), lte(column, endDate));
				}
				return undefined;

			// EMPTY OPERATORS
			case "isEmpty":
				return isEmpty(column);

			case "isNotEmpty":
				return not(isEmpty(column));

			default:
				throw new Error(`Unsupported operator: ${filter.operator}`);
		}
	});

	const validConditions = conditions.filter(
		(condition) => condition !== undefined,
	);

	return validConditions.length > 0 ? joinFn(...validConditions) : undefined;
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
