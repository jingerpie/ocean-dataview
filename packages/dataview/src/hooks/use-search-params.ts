"use client";

import { useDebouncer } from "@tanstack/react-pacer";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";

const SEARCH_DEBOUNCE_MS = 150;

interface UseSearchParamsOptions {
	/** Initial search value from server */
	search?: string;
}

/**
 * Hook for managing search term in URL with debouncing (150ms)
 * Uses nuqs to sync with URL search params
 *
 * @example
 * ```ts
 * // With server-parsed initial value
 * const { search, setSearch, isSearching } = useSearchParams({ search: props.search });
 *
 * // URL format: ?search=laptop
 * // isSearching is true while debounce is pending
 * ```
 */
export function useSearchParams(options: UseSearchParamsOptions = {}) {
	const [urlSearch, setUrlSearchState] = useQueryState("search", {
		defaultValue: options.search ?? "",
		clearOnDefault: true,
		shallow: false, // Trigger server refetch on change
	});

	// Local state for immediate UI updates
	const [localSearch, setLocalSearch] = useState(urlSearch ?? "");
	const [isPending, setIsPending] = useState(false);

	// Debounced URL update
	const urlDebouncer = useDebouncer(
		(value: string | null) => {
			setUrlSearchState(value);
			setIsPending(false);
		},
		{ wait: SEARCH_DEBOUNCE_MS }
	);

	// Sync local state when URL changes (e.g., back/forward navigation)
	useEffect(() => {
		setLocalSearch(urlSearch ?? "");
	}, [urlSearch]);

	// Flush pending updates on unmount
	useEffect(() => {
		return () => urlDebouncer.flush();
	}, [urlDebouncer]);

	const setSearch = (value: string | null) => {
		const normalizedValue = value === "" ? null : value;
		setLocalSearch(normalizedValue ?? "");
		setIsPending(true);
		urlDebouncer.maybeExecute(normalizedValue);
	};

	const clearSearch = () => {
		setLocalSearch("");
		setIsPending(false);
		urlDebouncer.cancel();
		setUrlSearchState(null);
	};

	return {
		search: localSearch,
		setSearch,
		clearSearch,
		hasSearch: Boolean(localSearch),
		/** True while debounce is pending (search not yet applied to URL) */
		isSearching: isPending,
		/** Immediately apply pending search to URL */
		flush: () => urlDebouncer.flush(),
	};
}
