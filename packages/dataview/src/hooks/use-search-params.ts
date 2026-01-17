"use client";

import { useQueryState } from "nuqs";

interface UseSearchParamsOptions {
	/** Initial search value from server */
	search?: string;
}

/**
 * Hook for managing search term in URL
 * Uses nuqs to sync with URL search params
 *
 * @example
 * ```ts
 * // With server-parsed initial value
 * const { search, setSearch } = useSearchParams({ search: props.search });
 *
 * // URL format: ?search=laptop
 * ```
 */
export function useSearchParams(options: UseSearchParamsOptions = {}) {
	const [search, setSearchState] = useQueryState("search", {
		defaultValue: options.search ?? "",
		clearOnDefault: true,
		shallow: false, // Trigger server refetch on change
	});

	const setSearch = (value: string | null) => {
		setSearchState(value === "" ? null : value);
	};

	const clearSearch = () => {
		setSearchState(null);
	};

	return {
		search: search ?? "",
		setSearch,
		clearSearch,
		hasSearch: Boolean(search),
	};
}
