"use client";

import {
	useFilterParams,
	useSearchParams,
	useSortParams,
} from "@ocean-dataview/ui/lib/data-views/hooks";
import type { DataViewProperty } from "@ocean-dataview/ui/lib/data-views/types";
import { cn } from "@ocean-dataview/ui/lib/utils";
import { type ReactNode, useMemo } from "react";
import { type FilterDefinition, FilterDropdown } from "./filter-dropdown";
import { SearchBar } from "./search-bar";
import { SortDropdown, type SortOption } from "./sort-dropdown";

export interface DataViewToolbarProps<T = unknown> {
	/**
	 * Property definitions - auto-generates filters and sort options
	 */
	properties: DataViewProperty<T>[];

	/**
	 * Enable search functionality
	 */
	enableSearch?: boolean;

	/**
	 * Placeholder text for search input
	 */
	searchPlaceholder?: string;

	/**
	 * Enable filter functionality
	 */
	enableFilters?: boolean;

	/**
	 * Enable sort functionality
	 */
	enableSort?: boolean;

	/**
	 * Custom action buttons to render on the right
	 */
	actions?: ReactNode;

	/**
	 * Additional CSS classes
	 */
	className?: string;
}

/**
 * Auto-generate filter definitions from properties
 */
function generateFiltersFromProperties<T>(
	properties: DataViewProperty<T>[],
): FilterDefinition[] {
	const result: FilterDefinition[] = [];

	for (const prop of properties) {
		if (
			![
				"select",
				"multi-select",
				"status",
				"checkbox",
				"date",
				"number",
			].includes(prop.type)
		) {
			continue;
		}

		const field = String(prop.id);
		const label = prop.label ?? String(prop.id);

		switch (prop.type) {
			case "select":
			case "status":
				if (prop.config?.options) {
					result.push({
						field,
						label,
						options: prop.config.options.map((opt) => ({
							value: opt.value,
							label: opt.label,
						})),
					});
				}
				break;

			case "multi-select":
				if (prop.config?.options) {
					result.push({
						field,
						label,
						options: prop.config.options.map((opt) => ({
							value: opt.value,
							label: opt.label,
						})),
					});
				}
				break;

			case "checkbox":
				result.push({
					field,
					label,
					options: [
						{ value: "true", label: "Yes" },
						{ value: "false", label: "No" },
					],
				});
				break;

			case "date":
			case "number":
				// For date and number, we can add filter options later
				// For now, skip them as the current FilterDropdown doesn't support them
				break;
		}
	}

	return result;
}

/**
 * Auto-generate sort options from properties
 */
function generateSortOptionsFromProperties<T>(
	properties: DataViewProperty<T>[],
): SortOption[] {
	return properties.map((prop) => ({
		field: String(prop.id),
		label: prop.label ?? String(prop.id),
	}));
}

/**
 * Reusable toolbar component that works with any view
 * Updates URL parameters which are read by useViewData hook
 *
 * This component is completely view-agnostic and only manages URL state
 */
export function DataViewToolbar<T = unknown>({
	properties,
	enableSearch = true,
	searchPlaceholder = "Search...",
	enableFilters = false,
	enableSort = false,
	actions,
	className,
}: DataViewToolbarProps<T>) {
	// Auto-generate filters and sort options from properties
	const filters = useMemo(() => {
		return generateFiltersFromProperties(properties);
	}, [properties]);

	const sortOptions = useMemo(() => {
		return generateSortOptionsFromProperties(properties);
	}, [properties]);

	// URL state management
	const [search, setSearch] = useSearchParams();
	const { sortBy, sortOrder, setSort } = useSortParams<string>();
	const { filtersObject, setFilter, clearFilters } = useFilterParams();

	const hasAnyControls = enableSearch || enableFilters || enableSort || actions;

	if (!hasAnyControls) {
		return null;
	}

	return (
		<div className={cn("flex items-center justify-between gap-4", className)}>
			{/* Left side: Search */}
			<div className="max-w-md flex-1">
				{enableSearch && (
					<SearchBar
						value={search}
						onChange={setSearch}
						placeholder={searchPlaceholder}
					/>
				)}
			</div>

			{/* Right side: Filters, Sort, Actions */}
			<div className="flex flex-wrap items-center gap-2">
				{enableFilters && filters.length > 0 && (
					<FilterDropdown
						filters={filters}
						activeFilters={filtersObject}
						onFilterChange={setFilter}
						onClearAll={clearFilters}
					/>
				)}

				{enableSort && sortOptions.length > 0 && (
					<SortDropdown
						sortOptions={sortOptions}
						currentSort={sortBy}
						currentOrder={sortOrder}
						onSortChange={(field, order) => {
							if (field === null) {
								setSort(null);
							} else {
								setSort(field, order || "asc");
							}
						}}
					/>
				)}

				{actions}
			</div>
		</div>
	);
}
