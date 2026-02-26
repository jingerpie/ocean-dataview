"use client";

import { parseAsString, useQueryState } from "nuqs";
import { useCallback, useState } from "react";
import { useDebouncedCallback } from "./use-debounced-callback";

const THROTTLE_MS = 50;
const SEARCH_DEBOUNCE_MS = 300;

/**
 * Hook for managing search term with debouncing (300ms).
 *
 * Uses local state for immediate input feedback, with debounced URL updates.
 * With shallow: true (default), URL updates are fast and React Query
 * handles refetching via queryKey changes.
 *
 * @example
 * ```ts
 * const { search, setSearch, clearSearch } = useSearchParams();
 * ```
 */
export function useSearchParams() {
  // URL state - source of truth, updates trigger React Query refetch
  const [urlSearch, setUrlSearch] = useQueryState(
    "search",
    parseAsString.withDefault("").withOptions({ throttleMs: THROTTLE_MS })
  );

  // Local state for immediate input feedback (debounced to URL)
  const [inputValue, setInputValue] = useState(urlSearch);

  // Debounced URL update
  const debouncedSetUrl = useDebouncedCallback((value: string) => {
    setUrlSearch(value || null);
  }, SEARCH_DEBOUNCE_MS);

  const setSearch = useCallback(
    (value: string | null) => {
      const normalizedValue = value ?? "";
      setInputValue(normalizedValue);
      debouncedSetUrl(normalizedValue);
    },
    [debouncedSetUrl]
  );

  const clearSearch = useCallback(() => {
    setInputValue("");
    // Clear immediately (no debounce)
    void setUrlSearch(null);
  }, [setUrlSearch]);

  return {
    search: inputValue,
    setSearch,
    clearSearch,
    hasSearch: Boolean(inputValue),
  };
}
