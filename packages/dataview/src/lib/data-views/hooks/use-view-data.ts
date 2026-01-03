"use client";

import type { PropertyFilter } from "@ocean-dataview/shared/types";
import { useMemo } from "react";
import type { DataViewProperty, PaginationResult, SortConfig } from "../types";
import { filterData, paginateData, searchData, sortData } from "../utils";
import { useFilterParams } from "./use-filter-params";
import { usePaginationParams } from "./use-pagination-params";
import { useSearchParams } from "./use-search-params";
import { useSortParams } from "./use-sort-params";

export interface UseViewDataConfig<T> {
	/**
	 * Property definitions for the data
	 * Properties determine what fields are searchable, filterable, and sortable
	 */
	properties: DataViewProperty<T>[];

	/**
	 * Default page size for pagination
	 */
	defaultPageSize?: number;

	/**
	 * Enable/disable specific features
	 */
	enableSearch?: boolean;
	enableFilters?: boolean;
	enableSort?: boolean;
	enablePagination?: boolean;
}

export interface UseViewDataResult<T> extends PaginationResult<T> {
	/**
	 * Whether any filters are currently active
	 */
	isFiltered: boolean;

	/**
	 * Whether a search is currently active
	 */
	isSearching: boolean;

	/**
	 * Whether data is currently sorted
	 */
	isSorted: boolean;

	/**
	 * The current search term
	 */
	searchTerm: string;

	/**
	 * The current active filters
	 */
	activeFilters: PropertyFilter<T>[];

	/**
	 * The current sort configuration
	 */
	sortConfig: SortConfig<T> | null;
}

/**
 * Derive searchable fields from properties
 * Auto-searches text, email, phone, url properties
 */
function getSearchableFields<T>(properties: DataViewProperty<T>[]): string[] {
	return properties
		.filter((prop) => ["text", "email", "phone", "url"].includes(prop.type))
		.map((prop) => prop.id);
}

/**
 * Derive filterable fields from properties
 * Auto-generates filters for select, multi-select, status, checkbox, date, number properties
 */
function getFilterableFields<T>(properties: DataViewProperty<T>[]): string[] {
	return properties
		.filter((prop) =>
			[
				"select",
				"multi-select",
				"status",
				"checkbox",
				"date",
				"number",
			].includes(prop.type),
		)
		.map((prop) => prop.id);
}

/**
 * Derive sortable fields from properties
 * All properties can be sorted
 */
function getSortableFields<T>(properties: DataViewProperty<T>[]): string[] {
	return properties.map((prop) => prop.id);
}

/**
 * Hook that reads URL parameters and transforms data
 * This is the connection layer between the toolbar (which writes URL params)
 * and views (which display transformed data)
 *
 * @param data - Raw data array to transform
 * @param config - Configuration with properties that define data behavior
 * @returns Transformed data with metadata
 */
export function useViewData<T>(
	data: T[],
	config: UseViewDataConfig<T>,
): UseViewDataResult<T> {
	const {
		properties,
		defaultPageSize = 10,
		enableSearch = true,
		enableFilters = true,
		enableSort = true,
		enablePagination = true,
	} = config;

	// Derive fields from properties
	const searchableFields = useMemo(
		() => getSearchableFields(properties),
		[properties],
	);

	const filterableFields = useMemo(
		() => getFilterableFields(properties),
		[properties],
	);

	const sortableFields = useMemo(
		() => getSortableFields(properties),
		[properties],
	);

	// Read URL parameters
	const [search] = useSearchParams();
	const { sortBy, sortOrder } = useSortParams<string>();
	const { page, pageSize } = usePaginationParams(defaultPageSize);
	const { filters } = useFilterParams<T>();

	// Transform data through pipeline
	const result = useMemo(() => {
		let transformed = [...data];

		// 1. Apply filters
		if (enableFilters && filters.length > 0 && filterableFields.length > 0) {
			transformed = filterData(transformed, filters);
		}

		// 2. Apply search
		if (enableSearch && search && searchableFields.length > 0) {
			transformed = searchData(transformed, search, searchableFields);
		}

		// 3. Apply sort
		if (enableSort && sortBy && sortableFields.length > 0) {
			const sortConfig: SortConfig<T>[] = [
				{
					propertyKey: sortBy as keyof T,
					direction: sortOrder,
				},
			];
			transformed = sortData(transformed, sortConfig);
		}

		// 4. Apply pagination
		if (enablePagination) {
			return paginateData(transformed, page, pageSize);
		}

		// If pagination is disabled, return data in pagination format
		return {
			data: transformed,
			totalPages: 1,
			currentPage: 1,
			hasNext: false,
			hasPrev: false,
			totalItems: transformed.length,
			pageSize,
		};
	}, [
		data,
		filters,
		search,
		sortBy,
		sortOrder,
		page,
		pageSize,
		searchableFields,
		filterableFields,
		sortableFields,
		enableSearch,
		enableFilters,
		enableSort,
		enablePagination,
	]);

	// Build sort config
	const sortConfig: SortConfig<T> | null = sortBy
		? {
				propertyKey: sortBy as keyof T,
				direction: sortOrder,
			}
		: null;

	return {
		...result,
		isFiltered: filters.length > 0,
		isSearching: Boolean(search),
		isSorted: Boolean(sortBy),
		searchTerm: search,
		activeFilters: filters,
		sortConfig,
	};
}
