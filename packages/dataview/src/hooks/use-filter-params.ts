"use client";

import { parseAsFilter } from "@ocean-dataview/shared/lib";
import type { FilterQuery, WhereNode } from "@ocean-dataview/shared/types";
import { normalizeFilter } from "@ocean-dataview/shared/utils";
import { useDebouncer } from "@tanstack/react-pacer";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { useDataViewContext } from "../lib/providers";

const FILTER_DEBOUNCE_MS = 150;

/** Empty filter sentinel - written to URL when user explicitly clears filter */
const EMPTY_FILTER: FilterQuery = { and: [] };

/**
 * Hook for managing filter state with debouncing.
 *
 * - Reads from DataViewContext defaults (server props)
 * - Writes to URL via nuqs (triggers server re-render)
 * - Uses empty filter `{ and: [] }` in URL to distinguish "cleared" from "use default"
 *
 * Debouncing: 150ms with leading edge (first click fires immediately,
 * subsequent rapid clicks are batched)
 *
 * @example
 * ```ts
 * const { filter, setFilter, flush } = useFilterParams();
 *
 * // URL format: ?filter=[["status","eq","active"]]
 * // Empty filter: ?filter=[]
 * // Call flush() before navigation to ensure pending updates are applied
 * ```
 */
export function useFilterParams() {
  // Read filter from context (server props)
  const { defaults } = useDataViewContext();
  const serverFilter = defaults?.filter ?? null;

  // Write-only URL state
  const [, setUrlFilterState] = useQueryState(
    "filter",
    parseAsFilter.withOptions({ shallow: false })
  );

  // Local state for immediate UI updates (initialized from server)
  const [localFilter, setLocalFilter] = useState<WhereNode | null>(
    serverFilter
  );

  // Debounced URL update with leading: true for responsive first click
  const urlDebouncer = useDebouncer(
    (normalized: FilterQuery) => {
      setUrlFilterState(normalized);
    },
    { wait: FILTER_DEBOUNCE_MS, leading: true, trailing: true }
  );

  // Sync local state when server value changes (navigation, refresh)
  useEffect(() => {
    setLocalFilter(serverFilter);
  }, [serverFilter]);

  // Flush pending updates on unmount
  useEffect(() => {
    return () => urlDebouncer.flush();
  }, [urlDebouncer]);

  // Set the entire filter object (replaces previous filter)
  // Normalizes WhereNode to FilterQuery format ({ and: [...] })
  const setFilter = (newFilter: WhereNode | null) => {
    setLocalFilter(newFilter);

    if (newFilter === null) {
      // Write empty filter to URL to distinguish from "use default"
      urlDebouncer.maybeExecute(EMPTY_FILTER);
      return;
    }
    // Normalize to ensure it's always { and: [...] } format for URL
    const normalized = normalizeFilter(newFilter);
    urlDebouncer.maybeExecute(normalized as FilterQuery);
  };

  const clearFilter = () => {
    setLocalFilter(null);
    urlDebouncer.cancel();
    // Write empty filter to URL to distinguish from "use default"
    setUrlFilterState(EMPTY_FILTER);
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
