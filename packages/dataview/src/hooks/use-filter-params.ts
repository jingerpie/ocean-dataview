"use client";

import { parseAsFilter } from "@sparkyidea/shared/lib";
import type { WhereNode } from "@sparkyidea/shared/types";
import { useQueryState } from "nuqs";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDataViewContext } from "../lib/providers";
import { useDebouncedCallback } from "./use-debounced-callback";

const FILTER_DEBOUNCE_MS = 300;

/** Empty filter sentinel - written to URL when user explicitly clears filter */
const EMPTY_FILTER: WhereNode[] = [];

/**
 * Hook for managing filter state with debouncing.
 *
 * - Reads from DataViewContext defaults (server props)
 * - Writes to URL via nuqs (triggers server re-render)
 * - Uses empty filter `[]` in URL to distinguish "cleared" from "use default"
 * - Uses proper debouncing that always uses the LATEST value
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
  const [localFilter, setLocalFilter] = useState<WhereNode[] | null>(
    serverFilter
  );

  // Track if change originated internally
  const isInternalChange = useRef(false);

  // Debounced URL update - uses proper debounce that resets timer on each call
  const debouncedUrlUpdate = useDebouncedCallback((filter: WhereNode[]) => {
    setUrlFilterState(filter);
  }, FILTER_DEBOUNCE_MS);

  // Sync local state when server value changes (navigation, refresh)
  // Skip sync if we triggered the change ourselves
  useEffect(() => {
    if (!isInternalChange.current) {
      setLocalFilter(serverFilter);
    }
    isInternalChange.current = false;
  }, [serverFilter]);

  // Flush pending updates on unmount
  useEffect(() => {
    return () => debouncedUrlUpdate.flush();
  }, [debouncedUrlUpdate]);

  // Set the entire filter array (replaces previous filter)
  const setFilter = useCallback(
    (newFilter: WhereNode[] | null) => {
      setLocalFilter(newFilter);
      isInternalChange.current = true;

      if (newFilter === null) {
        // Write empty filter to URL to distinguish from "use default"
        debouncedUrlUpdate(EMPTY_FILTER);
        return;
      }
      debouncedUrlUpdate(newFilter);
    },
    [debouncedUrlUpdate]
  );

  const clearFilter = useCallback(() => {
    setLocalFilter(null);
    isInternalChange.current = true;
    debouncedUrlUpdate.cancel();
    // Write empty filter to URL to distinguish from "use default"
    setUrlFilterState(EMPTY_FILTER);
  }, [debouncedUrlUpdate, setUrlFilterState]);

  /** Remove filter param from URL entirely, restoring to server defaults */
  const resetFilter = useCallback(() => {
    setLocalFilter(serverFilter);
    isInternalChange.current = true;
    debouncedUrlUpdate.cancel();
    setUrlFilterState(null);
  }, [debouncedUrlUpdate, serverFilter, setUrlFilterState]);

  return {
    filter: localFilter,
    setFilter,
    clearFilter,
    resetFilter,
    isFiltered: localFilter !== null && localFilter.length > 0,
    /** Immediately apply pending filter to URL */
    flush: debouncedUrlUpdate.flush,
  };
}
