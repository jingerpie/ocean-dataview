"use client";

import { parseAsFilters } from "@ocean-dataview/shared/lib";
import type { PropertyFilter } from "@ocean-dataview/shared/types";
import { useQueryState } from "nuqs";

interface UseFilterParamsOptions<T = unknown> {
	filters?: PropertyFilter<T>[]; // Props from server
}

/**
 * Hook for managing filter state in URL
 * Uses the unified PropertyFilter schema from shared package
 *
 * @example
 * ```ts
 * // With server-parsed initial values
 * const { filters, setFilter, removeFilter } = useFilterParams({ filters: props.filters });
 *
 * // URL format: ?filters=[{"propertyId":"status","value":"active",...}]
 * ```
 */
export function useFilterParams<T = unknown>(
	options: UseFilterParamsOptions<T> = {},
) {
	const [filtersJson, setFiltersJson] = useQueryState("filters", {
		...parseAsFilters,
		defaultValue: (options.filters as PropertyFilter<unknown>[]) ?? [],
		shallow: false,
	});

	const filters = filtersJson as PropertyFilter<T>[];

	// Update the entire filters array
	const setFilters = (newFilters: PropertyFilter<T>[]) => {
		setFiltersJson(
			newFilters.length === 0
				? null
				: (newFilters as PropertyFilter<unknown>[]),
		);
	};

	// Set or update a filter for a specific property
	const setFilter = (filter: PropertyFilter<T>) => {
		const existingIndex = filters.findIndex(
			(f) => f.filterId === filter.filterId,
		);

		if (existingIndex >= 0) {
			// Update existing filter
			const updated = [...filters];
			updated[existingIndex] = filter;
			setFilters(updated);
		} else {
			// Add new filter
			setFilters([...filters, filter]);
		}
	};

	// Remove a filter by filterId
	const removeFilter = (filterId: string) => {
		setFilters(filters.filter((f) => f.filterId !== filterId));
	};

	// Remove all filters for a specific property
	const removeFiltersForProperty = (propertyId: string) => {
		setFilters(filters.filter((f) => f.propertyId !== propertyId));
	};

	const clearFilters = () => {
		setFiltersJson(null);
	};

	return {
		filters,
		setFilters,
		setFilter,
		removeFilter,
		removeFiltersForProperty,
		clearFilters,
		isFiltered: filters.length > 0,
	};
}
