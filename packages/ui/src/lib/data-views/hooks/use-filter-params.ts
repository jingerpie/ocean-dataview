"use client";

import type { PropertyFilter } from "@ocean-dataview/shared/types";
import { useQueryState } from "nuqs";

/**
 * Hook for managing filter state in URL
 * Uses the unified PropertyFilter schema from shared package
 */
export function useFilterParams<T = unknown>() {
	const [filtersJson, setFiltersJson] = useQueryState("filters", {
		defaultValue: "[]",
		clearOnDefault: true,
	});

	// Parse filters from URL (expects PropertyFilter[] array)
	const filters: PropertyFilter<T>[] = (() => {
		try {
			const parsed = JSON.parse(filtersJson);
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	})();

	// Update the entire filters array
	const setFilters = (newFilters: PropertyFilter<T>[]) => {
		const jsonString = JSON.stringify(newFilters);
		setFiltersJson(newFilters.length === 0 ? null : jsonString);
	};

	// Set or update a filter for a specific property
	const setFilter = (filter: PropertyFilter<T>) => {
		const existingIndex = filters.findIndex(
			(f) => f.propertyId === filter.propertyId,
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

	// Remove a filter by propertyId
	const removeFilter = (propertyId: Extract<keyof T, string>) => {
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
		clearFilters,
		isFiltered: filters.length > 0,
	};
}
