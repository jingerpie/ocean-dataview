"use client";

import { parseAsFilter } from "@ocean-dataview/shared/lib";
import type { FilterQuery, WhereNode } from "@ocean-dataview/shared/types";
import { normalizeFilter } from "@ocean-dataview/shared/utils";
import { useDebouncer } from "@tanstack/react-pacer";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";

const FILTER_DEBOUNCE_MS = 150;

interface UseFilterParamsOptions {
  /**
   * Default filter to use when URL has no filter param.
   * This is used as the initial state when the URL is empty.
   */
  filter?: WhereNode | null;
}

/**
 * Hook for managing filter state in URL with debouncing
 * Uses the new recursive WhereNode schema (AND/OR conditions)
 *
 * Debouncing: 150ms with leading edge (first click fires immediately,
 * subsequent rapid clicks are batched)
 *
 * @example
 * ```ts
 * const { filter, setFilter, flush } = useFilterParams();
 *
 * // With default filter:
 * const { filter, setFilter } = useFilterParams({
 *   filter: { and: [["status", "eq", "active"]] }
 * });
 *
 * // URL format: ?filter=[["status","eq","active"]]
 * // Call flush() before navigation to ensure pending updates are applied
 * ```
 */
export function useFilterParams(options: UseFilterParamsOptions = {}) {
  const defaultFilter = options.filter ?? null;

  const [urlFilter, setUrlFilterState] = useQueryState(
    "filter",
    parseAsFilter.withOptions({ shallow: false })
  );

  // Use URL filter if present, otherwise fall back to default
  const effectiveFilter =
    urlFilter !== null ? (urlFilter as WhereNode | null) : defaultFilter;

  // Local state for immediate UI updates
  const [localFilter, setLocalFilter] = useState<WhereNode | null>(
    effectiveFilter
  );

  // Debounced URL update with leading: true for responsive first click
  const urlDebouncer = useDebouncer(
    (normalized: FilterQuery | null) => {
      setUrlFilterState(normalized);
    },
    { wait: FILTER_DEBOUNCE_MS, leading: true, trailing: true }
  );

  // Sync local state when URL changes (e.g., back/forward navigation)
  useEffect(() => {
    const effectiveValue =
      urlFilter !== null ? (urlFilter as WhereNode | null) : defaultFilter;
    setLocalFilter(effectiveValue);
  }, [urlFilter, defaultFilter]);

  // Flush pending updates on unmount
  useEffect(() => {
    return () => urlDebouncer.flush();
  }, [urlDebouncer]);

  // Set the entire filter object (replaces previous filter)
  // Normalizes WhereNode to FilterQuery format ({ and: [...] })
  const setFilter = (newFilter: WhereNode | null) => {
    setLocalFilter(newFilter);

    if (newFilter === null) {
      urlDebouncer.maybeExecute(null);
      return;
    }
    // Normalize to ensure it's always { and: [...] } format for URL
    const normalized = normalizeFilter(newFilter);
    urlDebouncer.maybeExecute(normalized as FilterQuery | null);
  };

  const clearFilter = () => {
    setLocalFilter(null);
    urlDebouncer.cancel();
    setUrlFilterState(null);
  };

  return {
    filter: localFilter,
    setFilter,
    clearFilter,
    isFiltered: localFilter !== null,
    /** Immediately apply pending filter to URL */
    flush: () => urlDebouncer.flush(),
  };
}
