"use client";

import { parseAsFilter } from "@ocean-dataview/shared/lib";
import type { Filter } from "@ocean-dataview/shared/types";
import { useQueryState } from "nuqs";

/**
 * Hook for managing filter state in URL
 * Uses the new recursive Filter schema (AND/OR conditions)
 *
 * @example
 * ```ts
 * const { filter, setFilter } = useFilterParams();
 *
 * // URL format: ?filter={"and":[{"property":"status","operator":"eq","value":"active"}]}
 * ```
 */
export function useFilterParams() {
	const [filter, setFilterState] = useQueryState(
		"filter",
		parseAsFilter.withOptions({ shallow: false })
	);

	// Set the entire filter object (replaces previous filter)
	const setFilter = (newFilter: Filter | null) => {
		setFilterState(newFilter);
	};

	const clearFilter = () => {
		setFilterState(null);
	};

	return {
		filter,
		setFilter,
		clearFilter,
		isFiltered: filter !== null,
	};
}
