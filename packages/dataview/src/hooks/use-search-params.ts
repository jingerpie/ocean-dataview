"use client";

import { parseAsString, useQueryState } from "nuqs";
import { useCallback, useContext, useState } from "react";
import { DataViewContext } from "../lib/providers/data-view-context";
import { useDebouncedCallback } from "./use-debounced-callback";

const THROTTLE_MS = 50;
const SEARCH_DEBOUNCE_MS = 300;

/**
 * Hook for managing search term with debouncing (300ms).
 *
 * When used inside DataViewProvider, reads from context (which has defaults applied).
 * When used outside, reads directly from URL.
 * Writes always go to URL.
 *
 * @example
 * ```ts
 * const { search, setSearch, clearSearch } = useSearchParams();
 * ```
 */
export function useSearchParams() {
  // Try to read from context (has defaults applied)
  const context = useContext(DataViewContext);

  // URL state for writes and fallback reads
  const [urlSearch, setUrlSearch] = useQueryState(
    "search",
    parseAsString.withDefault("").withOptions({ throttleMs: THROTTLE_MS })
  );

  // Use context value if available (has defaults), otherwise URL value
  const effectiveSearch = context?.search ?? urlSearch;

  // Local state for immediate input feedback (debounced to URL)
  const [inputValue, setInputValue] = useState(effectiveSearch);

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
