"use client";

import { parseAsString, useQueryState } from "nuqs";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDataViewContext } from "../lib/providers";
import { useDebouncedCallback } from "./use-debounced-callback";

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Hook for managing search term with debouncing (300ms).
 *
 * - Reads from DataViewContext defaults (server props)
 * - Writes to URL via nuqs (triggers server re-render)
 * - Uses useDebouncedCallback for debouncing (like tablecn)
 *
 * @example
 * ```ts
 * const { search, setSearch } = useSearchParams();
 *
 * // URL format: ?search=laptop
 * ```
 */
export function useSearchParams() {
  // Read search from context (server props)
  const { search: contextSearch } = useDataViewContext();
  const serverSearch = contextSearch ?? "";

  // URL state (nuqs handles URL updates)
  const [, setUrlSearchState] = useQueryState(
    "search",
    parseAsString.withOptions({ shallow: false })
  );

  // Local state for immediate UI updates (initialized from server)
  const [localSearch, setLocalSearch] = useState(serverSearch);

  // Track if change originated from user typing (internal)
  const isInternalChange = useRef(false);

  // Debounced URL update (like tablecn)
  const debouncedUrlUpdate = useDebouncedCallback((value: string) => {
    setUrlSearchState(value);
  }, SEARCH_DEBOUNCE_MS);

  // Sync local state when server value changes (navigation, refresh)
  // Skip sync if we triggered the change ourselves
  useEffect(() => {
    if (!isInternalChange.current) {
      setLocalSearch(serverSearch);
    }
    isInternalChange.current = false;
  }, [serverSearch]);

  const setSearch = useCallback(
    (value: string | null) => {
      const normalizedValue = value ?? "";
      setLocalSearch(normalizedValue);
      isInternalChange.current = true;
      // Always write to URL (even empty string) to track explicit state
      debouncedUrlUpdate(normalizedValue);
    },
    [debouncedUrlUpdate]
  );

  const clearSearch = useCallback(() => {
    setLocalSearch("");
    isInternalChange.current = true;
    // Write empty string to URL immediately (no debounce for clear)
    void setUrlSearchState("");
  }, [setUrlSearchState]);

  return {
    search: localSearch,
    setSearch,
    clearSearch,
    hasSearch: Boolean(localSearch),
  };
}
