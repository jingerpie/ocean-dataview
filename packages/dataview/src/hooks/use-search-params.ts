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
 * - Uses proper debouncing that always uses the LATEST value
 *
 * @example
 * ```ts
 * const { search, setSearch, isSearching } = useSearchParams();
 *
 * // URL format: ?search=laptop
 * // isSearching is true while debounce is pending
 * ```
 */
export function useSearchParams() {
  // Read search from context (server props)
  const { defaults } = useDataViewContext();
  const serverSearch = defaults?.search ?? "";

  // Write-only URL state
  const [, setUrlSearchState] = useQueryState(
    "search",
    parseAsString.withOptions({ shallow: false })
  );

  // Local state for immediate UI updates (initialized from server)
  const [localSearch, setLocalSearch] = useState(serverSearch);

  // Track if change originated from user typing (internal)
  const isInternalChange = useRef(false);

  // Debounced URL update - uses proper debounce that resets timer on each call
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

  // Flush pending updates on unmount
  useEffect(() => {
    return () => debouncedUrlUpdate.flush();
  }, [debouncedUrlUpdate]);

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
    debouncedUrlUpdate.cancel();
    // Write empty string to URL to distinguish from "use default"
    setUrlSearchState("");
  }, [debouncedUrlUpdate, setUrlSearchState]);

  return {
    search: localSearch,
    setSearch,
    clearSearch,
    hasSearch: Boolean(localSearch),
    /** True while debounce is pending (search not yet applied to URL) */
    isSearching: debouncedUrlUpdate.isPending(),
    /** Immediately apply pending search to URL */
    flush: debouncedUrlUpdate.flush,
  };
}
