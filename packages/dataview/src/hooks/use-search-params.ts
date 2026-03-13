"use client";

import { useCallback, useEffect, useState } from "react";
import {
  useQueryParamsActions,
  useQueryParamsState,
} from "../lib/providers/query-params-context";
import { useDebouncedCallback } from "./use-debounced-callback";

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Hook for managing search term with debouncing (300ms).
 *
 * Reads from QueryParamsContext (single source of truth).
 * Local state provides immediate input feedback, debounced to URL.
 *
 * @example
 * ```ts
 * const { search, setSearch, clearSearch } = useSearchParams();
 * ```
 */
export function useSearchParams() {
  const { search } = useQueryParamsState();
  const { setSearch: setSearchAction } = useQueryParamsActions();

  // Local state for immediate input feedback (debounced to URL)
  const [inputValue, setInputValue] = useState(search);

  // Sync local state when external search changes (e.g., browser navigation)
  useEffect(() => {
    setInputValue(search);
  }, [search]);

  // Debounced URL update via context action
  const debouncedSetUrl = useDebouncedCallback((value: string) => {
    setSearchAction(value);
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
    // Cancel any pending debounced update before clearing
    debouncedSetUrl.cancel();
    setInputValue("");
    // Clear immediately (no debounce)
    setSearchAction("");
  }, [debouncedSetUrl, setSearchAction]);

  return {
    search: inputValue,
    setSearch,
    clearSearch,
    hasSearch: Boolean(inputValue),
  };
}
