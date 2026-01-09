import type { PropertyFilter } from "@ocean-dataview/shared/types";

/**
 * Client-side filtering utility
 * Filters an array of data based on PropertyFilter configurations
 * Uses the unified filter operators from the shared package
 */
export function filterData<T>(data: T[], filters: PropertyFilter<T>[]): T[] {
	if (!filters || filters.length === 0) return data;

	return data.filter((item) => {
		return filters.every((filter) => {
			const propertyId = filter.propertyId as keyof T;
			const propertyValue = item[propertyId] as
				| number
				| string
				| boolean
				| Date
				| null
				| undefined;
			const filterValue = filter.value;

			switch (filter.operator) {
				// Text operators
				case "iLike":
					if (
						typeof propertyValue === "string" &&
						typeof filterValue === "string"
					) {
						return propertyValue
							.toLowerCase()
							.includes(filterValue.toLowerCase());
					}
					return false;

				case "notILike":
					if (
						typeof propertyValue === "string" &&
						typeof filterValue === "string"
					) {
						return !propertyValue
							.toLowerCase()
							.includes(filterValue.toLowerCase());
					}
					return true;

				// Equality operators
				case "eq":
					if (typeof filterValue === "string" && filter.variant === "boolean") {
						return propertyValue === (filterValue === "true");
					}
					return propertyValue === filterValue;

				case "ne":
					if (typeof filterValue === "string" && filter.variant === "boolean") {
						return propertyValue !== (filterValue === "true");
					}
					return propertyValue !== filterValue;

				// Array operators
				case "inArray":
					if (Array.isArray(filterValue)) {
						return filterValue.includes(String(propertyValue));
					}
					return false;

				case "notInArray":
					if (Array.isArray(filterValue)) {
						return !filterValue.includes(String(propertyValue));
					}
					return true;

				// Comparison operators
				case "lt":
					return Number(propertyValue) < Number(filterValue);

				case "lte":
					return Number(propertyValue) <= Number(filterValue);

				case "gt":
					return Number(propertyValue) > Number(filterValue);

				case "gte":
					return Number(propertyValue) >= Number(filterValue);

				// Range operator
				case "isBetween":
					if (Array.isArray(filterValue) && filterValue.length === 2) {
						const numValue = Number(propertyValue);
						const min = filterValue[0]
							? Number(filterValue[0])
							: Number.NEGATIVE_INFINITY;
						const max = filterValue[1]
							? Number(filterValue[1])
							: Number.POSITIVE_INFINITY;
						return numValue >= min && numValue <= max;
					}
					return false;

				// Empty operators
				case "isEmpty":
					return (
						propertyValue === null ||
						propertyValue === undefined ||
						propertyValue === ""
					);

				case "isNotEmpty":
					return (
						propertyValue !== null &&
						propertyValue !== undefined &&
						propertyValue !== ""
					);

				default:
					return true;
			}
		});
	});
}
