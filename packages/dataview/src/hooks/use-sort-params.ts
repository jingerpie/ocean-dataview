"use client";

import type { DataViewProperty } from "@ocean-dataview/dataview/types";
import { parseAsSort } from "@ocean-dataview/shared/lib";
import type { PropertySort } from "@ocean-dataview/shared/types";
import { useQueryState } from "nuqs";

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
 * Hook for managing sort state in URL
 * Uses PropertySort[] array format for multi-column sort support
 *
 * @example
 * ```ts
 * // With type inference from properties (recommended)
 * const { sort, setSort } = useSortParams({ properties: productProperties });
 *
 * // With explicit type
 * const { sort, setSort } = useSortParams<Product>();
 *
 * // URL format: ?sort=[["name","asc"]]
 * ```
 */
export function useSortParams<T = unknown>(
	options: UseSortParamsOptions<T> = {}
) {
	const [sortJson, setSortJson] = useQueryState("sort", {
		...parseAsSort,
		defaultValue: (options.sort as PropertySort<unknown>[]) ?? [],
		shallow: false,
	});

	const sort = sortJson as PropertySort<T>[];

	const setSort = (newSort: PropertySort<T>[]) => {
		setSortJson(
			newSort.length === 0 ? null : (newSort as PropertySort<unknown>[])
		);
	};

	const addSort = (prop: Extract<keyof T, string>, desc = false) => {
		const existing = sort.find((s) => s.property === prop);
		if (existing) {
			// Toggle direction
			setSort(
				sort.map((s) => (s.property === prop ? { ...s, desc: !s.desc } : s))
			);
		} else {
			setSort([...sort, { property: prop, desc }]);
		}
	};

	const removeSort = (prop: Extract<keyof T, string>) => {
		setSort(sort.filter((s) => s.property !== prop));
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
