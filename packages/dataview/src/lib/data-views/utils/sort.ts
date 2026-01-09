import type { SortConfig } from "../../../types";

/**
 * Client-side sorting utility
 * Sorts an array of data based on sort configurations
 * Supports multi-column sorting
 */
export function sortData<T>(data: T[], sorts: SortConfig<T>[]): T[] {
	if (!sorts || sorts.length === 0) return data;

	// Create a new array to avoid mutating the original
	const sortedData = [...data];

	sortedData.sort((a, b) => {
		for (const sort of sorts) {
			const propertyKey = sort.propertyKey;
			const aValue = a[propertyKey];
			const bValue = b[propertyKey];

			// Handle null/undefined values
			if (aValue == null && bValue == null) continue;
			if (aValue == null) return 1;
			if (bValue == null) return -1;

			let comparison = 0;

			// Compare values based on type
			if (typeof aValue === "string" && typeof bValue === "string") {
				comparison = aValue.localeCompare(bValue);
			} else if (typeof aValue === "number" && typeof bValue === "number") {
				comparison = aValue - bValue;
			} else if (aValue instanceof Date && bValue instanceof Date) {
				comparison = aValue.getTime() - bValue.getTime();
			} else {
				// Fallback to string comparison
				comparison = String(aValue).localeCompare(String(bValue));
			}

			// Apply direction
			if (comparison !== 0) {
				return sort.direction === "asc" ? comparison : -comparison;
			}
		}

		return 0;
	});

	return sortedData;
}
