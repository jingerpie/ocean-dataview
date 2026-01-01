"use client";

import { useQueryState } from "nuqs";

/**
 * Hook for managing search term in URL
 * Uses nuqs to sync with URL search params
 */
export function useSearchParams(defaultValue = "") {
	const [search, setSearch] = useQueryState("search", {
		defaultValue,
		clearOnDefault: true,
	});

	return [search, setSearch] as const;
}
