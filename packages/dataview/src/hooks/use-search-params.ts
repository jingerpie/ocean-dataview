"use client";

import { useCallback, useState } from "react";
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
    setInputValue("");
    // Clear immediately (no debounce)
    setSearchAction("");
  }, [setSearchAction]);

  return {
    search: inputValue,
    setSearch,
    clearSearch,
    hasSearch: Boolean(inputValue),
  };
}
