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
 * - Uses useDebouncedCallback for debouncing (like tablecn)
 *
 * @example
 * ```ts
 * const { filter, setFilter } = useFilterParams();
 *
 * // URL format: ?filter=[["status","eq","active"]]
 * // Empty filter: ?filter=[]
 * ```
 */
export function useFilterParams() {
  // Read filter from context (server props)
  const { filter: contextFilter } = useDataViewContext();
  const serverFilter = contextFilter ?? null;

  // URL state (nuqs handles URL updates)
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

  // Debounced URL update (like tablecn)
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

  // Set the entire filter array - debounced (for value editing)
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

  // Add filter - immediate (discrete action, popover closes)
  const addFilter = useCallback(
    (node: WhereNode) => {
      const newFilter = localFilter ? [...localFilter, node] : [node];
      setLocalFilter(newFilter);
      isInternalChange.current = true;
      void setUrlFilterState(newFilter);
    },
    [localFilter, setUrlFilterState]
  );

  // Remove filter - immediate (discrete action)
  const removeFilter = useCallback(
    (propertyId: string) => {
      setLocalFilter((currentFilter) => {
        if (!currentFilter) {
          return null;
        }
        const newFilter = currentFilter.filter((node) => {
          if ("property" in node) {
            return node.property !== propertyId;
          }
          return true;
        });
        isInternalChange.current = true;
        void setUrlFilterState(newFilter.length > 0 ? newFilter : EMPTY_FILTER);
        return newFilter.length > 0 ? newFilter : null;
      });
    },
    [setUrlFilterState]
  );

  const clearFilter = useCallback(() => {
    setLocalFilter(null);
    isInternalChange.current = true;
    // Write empty filter to URL immediately (no debounce for clear)
    void setUrlFilterState(EMPTY_FILTER);
  }, [setUrlFilterState]);

  /** Remove filter param from URL entirely, restoring to server defaults */
  const resetFilter = useCallback(() => {
    // Clear local filter immediately for UI feedback
    setLocalFilter(null);
    // Don't set isInternalChange - allow effect to sync to server defaults after re-render
    // Immediate URL update for reset
    void setUrlFilterState(null);
  }, [setUrlFilterState]);

  return {
    filter: localFilter,
    setFilter,
    addFilter,
    removeFilter,
    clearFilter,
    resetFilter,
    isFiltered: localFilter !== null && localFilter.length > 0,
  };
}
