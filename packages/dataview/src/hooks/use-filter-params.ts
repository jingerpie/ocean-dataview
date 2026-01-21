"use client";

import { parseAsFilter } from "@ocean-dataview/shared/lib";
import type { FilterQuery, WhereNode } from "@ocean-dataview/shared/types";
import { normalizeFilter } from "@ocean-dataview/shared/utils";
import { useQueryState } from "nuqs";

/**
 * Hook for managing filter state in URL
 * Uses the new recursive WhereNode schema (AND/OR conditions)
 *
 * @example
 * ```ts
 * const { filter, setFilter } = useFilterParams();
 *
 * // URL format: ?filter=[["status","eq","active"]]
 * ```
 */
export function useFilterParams() {
	const [filterState, setFilterState] = useQueryState(
		"filter",
		parseAsFilter.withOptions({ shallow: false })
	);

	// Expose as WhereNode for consumers (FilterQuery is a WhereExpression which is a WhereNode)
	const filter = filterState as WhereNode | null;

	// Set the entire filter object (replaces previous filter)
	// Normalizes WhereNode to FilterQuery format ({ and: [...] })
	const setFilter = (newFilter: WhereNode | null) => {
		if (newFilter === null) {
			setFilterState(null);
			return;
		}
		// Normalize to ensure it's always { and: [...] } format for URL
		const normalized = normalizeFilter(newFilter);
		setFilterState(normalized as FilterQuery | null);
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
