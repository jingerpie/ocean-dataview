"use client";

import { parseAsSort } from "@ocean-dataview/shared/lib";
import type { PropertySort } from "@ocean-dataview/shared/types";
import { useQueryState } from "nuqs";

interface UseSortParamsOptions<T = unknown> {
	sort?: PropertySort<T>[]; // Props from server
}

/**
 * Hook for managing sort state in URL
 * Uses PropertySort[] array format for multi-column sort support
 *
 * @example
 * ```ts
 * // With server-parsed initial values
 * const { sort, setSort, addSort } = useSortParams({ sort: props.sort });
 *
 * // URL format: ?sort=[{"propertyId":"name","desc":false}]
 * ```
 */
export function useSortParams<T = unknown>(
	options: UseSortParamsOptions<T> = {},
) {
	const [sortJson, setSortJson] = useQueryState("sort", {
		...parseAsSort,
		defaultValue: (options.sort as PropertySort<unknown>[]) ?? [],
		shallow: false,
	});

	const sort = sortJson as PropertySort<T>[];

	const setSort = (newSort: PropertySort<T>[]) => {
		setSortJson(
			newSort.length === 0 ? null : (newSort as PropertySort<unknown>[]),
		);
	};

	const addSort = (propertyId: Extract<keyof T, string>, desc = false) => {
		const existing = sort.find((s) => s.propertyId === propertyId);
		if (existing) {
			// Toggle direction
			setSort(
				sort.map((s) =>
					s.propertyId === propertyId ? { ...s, desc: !s.desc } : s,
				),
			);
		} else {
			setSort([...sort, { propertyId, desc }]);
		}
	};

	const removeSort = (propertyId: Extract<keyof T, string>) => {
		setSort(sort.filter((s) => s.propertyId !== propertyId));
	};

	const clearSort = () => setSortJson(null);

	return {
		sort,
		setSort,
		addSort,
		removeSort,
		clearSort,
		isSorted: sort.length > 0,
	};
}
