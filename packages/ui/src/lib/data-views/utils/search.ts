/**
 * Client-side search utility
 * Searches across specified property keys in the data
 * Case-insensitive matching
 */
export function searchData<T>(
	data: T[],
	searchTerm: string,
	searchablePropertyKeys: string[],
): T[] {
	if (
		!searchTerm ||
		searchTerm.trim() === "" ||
		!searchablePropertyKeys.length
	) {
		return data;
	}

	const normalizedSearchTerm = searchTerm.toLowerCase().trim();

	return data.filter((item) => {
		return searchablePropertyKeys.some((propertyKey) => {
			const value = (item as Record<string, unknown>)[propertyKey];

			if (value == null) return false;

			// Convert value to string and search
			const stringValue = String(value).toLowerCase();
			return stringValue.includes(normalizedSearchTerm);
		});
	});
}
