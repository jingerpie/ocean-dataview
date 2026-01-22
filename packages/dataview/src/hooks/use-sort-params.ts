"use client";

import type { DataViewProperty } from "@ocean-dataview/dataview/types";
import { parseAsSort } from "@ocean-dataview/shared/lib";
import type { PropertySort } from "@ocean-dataview/shared/types";
import { useDebouncer } from "@tanstack/react-pacer";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";

const SORT_DEBOUNCE_MS = 150;

interface UseSortParamsOptions<T = unknown> {
	/** Initial sort from server props */
	sort?: PropertySort<T>[];
	/**
	 * Properties array for type inference.
	 * When provided, T is inferred from the properties type.
	 */
	properties?: DataViewProperty<T>[];
}

/**
 * Hook for managing sort state in URL with debouncing
 * Uses PropertySort[] array format for multi-column sort support
 *
 * Debouncing: 150ms with leading edge (first click fires immediately,
 * subsequent rapid clicks are batched)
 *
 * @example
 * ```ts
 * // With type inference from properties (recommended)
 * const { sort, setSort, flush } = useSortParams({ properties: productProperties });
 *
 * // With explicit type
 * const { sort, setSort, flush } = useSortParams<Product>();
 *
 * // URL format: ?sort=[["name","asc"]]
 * // Call flush() before navigation to ensure pending updates are applied
 * ```
 */
export function useSortParams<T = unknown>(
	options: UseSortParamsOptions<T> = {}
) {
	const [urlSort, setUrlSortJson] = useQueryState("sort", {
		...parseAsSort,
		defaultValue: (options.sort as PropertySort<unknown>[]) ?? [],
		shallow: false,
	});

	// Local state for immediate UI updates
	const [localSort, setLocalSort] = useState<PropertySort<T>[]>(
		(urlSort as PropertySort<T>[]) ?? []
	);

	// Debounced URL update with leading: true for responsive first click
	const urlDebouncer = useDebouncer(
		(newSort: PropertySort<unknown>[] | null) => {
			setUrlSortJson(newSort);
		},
		{ wait: SORT_DEBOUNCE_MS, leading: true, trailing: true }
	);

	// Sync local state when URL changes (e.g., back/forward navigation)
	useEffect(() => {
		setLocalSort((urlSort as PropertySort<T>[]) ?? []);
	}, [urlSort]);

	// Flush pending updates on unmount
	useEffect(() => {
		return () => urlDebouncer.flush();
	}, [urlDebouncer]);

	const setSort = (newSort: PropertySort<T>[]) => {
		setLocalSort(newSort);
		urlDebouncer.maybeExecute(
			newSort.length === 0 ? null : (newSort as PropertySort<unknown>[])
		);
	};

	const addSort = (prop: Extract<keyof T, string>, desc = false) => {
		const existing = localSort.find((s) => s.property === prop);
		if (existing) {
			// Toggle direction
			setSort(
				localSort.map((s) =>
					s.property === prop ? { ...s, desc: !s.desc } : s
				)
			);
		} else {
			setSort([...localSort, { property: prop, desc }]);
		}
	};

	const removeSort = (prop: Extract<keyof T, string>) => {
		setSort(localSort.filter((s) => s.property !== prop));
	};

	const clearSort = () => {
		setLocalSort([]);
		urlDebouncer.cancel();
		setUrlSortJson(null);
	};

	return {
		sort: localSort,
		setSort,
		addSort,
		removeSort,
		clearSort,
		isSorted: localSort.length > 0,
		/** Immediately apply pending sort to URL */
		flush: () => urlDebouncer.flush(),
	};
}
