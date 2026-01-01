"use client";

import { parseAsString, useQueryStates } from "nuqs";

/**
 * Hook for managing sort state in URL
 * Uses nuqs to sync sort field and direction with URL search params
 */
export function useSortParams<T extends string = string>() {
	const [sortState, setSortState] = useQueryStates({
		sortBy: parseAsString.withDefault(""),
		sortOrder: parseAsString.withDefault("asc"),
	});

	const setSort = (field: T | null, direction: "asc" | "desc" = "asc") => {
		if (field === null) {
			setSortState({ sortBy: "", sortOrder: "asc" });
		} else {
			setSortState({ sortBy: field, sortOrder: direction });
		}
	};

	return {
		sortBy: (sortState.sortBy || null) as T | null,
		sortOrder: sortState.sortOrder as "asc" | "desc",
		setSort,
		setSortState,
	};
}
