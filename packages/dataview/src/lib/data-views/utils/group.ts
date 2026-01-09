import type { GroupedData } from "../../../types";

/**
 * Groups data by a specified property key
 * Used primarily for board view to create columns
 */
export function groupByField<T>(
	data: T[],
	propertyKey: keyof T,
	groups?: string[],
	propertyName?: string,
): GroupedData<T> {
	const grouped: GroupedData<T> = {};
	const emptyGroupLabel = propertyName ? `No ${propertyName}` : "Uncategorized";

	// Initialize groups if provided
	if (groups) {
		for (const group of groups) {
			grouped[group] = [];
		}
	}

	// Group the data
	for (const item of data) {
		const key = String(item[propertyKey] ?? emptyGroupLabel);

		if (!grouped[key]) {
			grouped[key] = [];
		}

		grouped[key].push(item);
	}

	return grouped;
}
