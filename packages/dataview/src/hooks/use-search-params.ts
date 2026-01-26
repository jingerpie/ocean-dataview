"use client";

import { useDebouncer } from "@tanstack/react-pacer";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { useDataViewContext } from "../lib/providers";

const SEARCH_DEBOUNCE_MS = 150;

/**
 * Hook for managing search term with debouncing (150ms).
 *
 * - Reads from DataViewContext defaults (server props)
 * - Writes to URL via nuqs (triggers server re-render)
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
  const [isPending, setIsPending] = useState(false);

  // Debounced URL update
  const urlDebouncer = useDebouncer(
    (value: string) => {
      setUrlSearchState(value);
      setIsPending(false);
    },
    { wait: SEARCH_DEBOUNCE_MS }
  );

  // Sync local state when server value changes (navigation, refresh)
  useEffect(() => {
    setLocalSearch(serverSearch);
  }, [serverSearch]);

  // Flush pending updates on unmount
  useEffect(() => {
    return () => urlDebouncer.flush();
  }, [urlDebouncer]);

  const setSearch = (value: string | null) => {
    const normalizedValue = value ?? "";
    setLocalSearch(normalizedValue);
    setIsPending(true);
    // Always write to URL (even empty string) to track explicit state
    urlDebouncer.maybeExecute(normalizedValue);
  };

  const clearSearch = () => {
    setLocalSearch("");
    setIsPending(false);
    urlDebouncer.cancel();
    // Write empty string to URL to distinguish from "use default"
    setUrlSearchState("");
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
