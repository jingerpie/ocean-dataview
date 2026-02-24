"use client";

import type { SortQuery } from "@sparkyidea/shared/types";
import { parseAsSort } from "@sparkyidea/shared/utils/parsers/sort";
import { useQueryState } from "nuqs";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDataViewContext } from "../lib/providers";
import { useDebouncedCallback } from "./use-debounced-callback";

const SORT_DEBOUNCE_MS = 150;

/** Empty sort sentinel - written to URL when user explicitly clears sort */
const EMPTY_SORT: SortQuery[] = [];

/**
 * Hook for managing sort state with debouncing.
 * Uses SortQuery[] array format for multi-column sort support.
 *
 * - Reads from DataViewContext defaults (server props)
 * - Writes to URL via nuqs (triggers server re-render)
 * - Uses empty array `[]` in URL to distinguish "cleared" from "use default"
 * - Uses useDebouncedCallback for debouncing (like tablecn)
 *
 * @example
 * ```ts
 * const { sort, setSort } = useSortParams();
 *
 * // URL format: ?sort=[["name","asc"]]
 * // Empty sort: ?sort=[]
 * ```
 */
export function useSortParams() {
  // Read sort from context (server props)
  const { sort: contextSort } = useDataViewContext();
  const serverSort = contextSort ?? [];

  // URL state (nuqs handles URL updates)
  const [, setUrlSortState] = useQueryState("sort", {
    ...parseAsSort,
    shallow: false,
  });

  // Local state for immediate UI updates (initialized from server)
  const [localSort, setLocalSort] = useState<SortQuery[]>(serverSort);

  // Track if change originated internally
  const isInternalChange = useRef(false);

  // Debounced URL update (like tablecn)
  const debouncedUrlUpdate = useDebouncedCallback((newSort: SortQuery[]) => {
    setUrlSortState(newSort);
  }, SORT_DEBOUNCE_MS);

  // Sync local state when server value changes (navigation, refresh)
  // Skip sync if we triggered the change ourselves
  useEffect(() => {
    if (!isInternalChange.current) {
      setLocalSort(serverSort);
    }
    isInternalChange.current = false;
  }, [serverSort]);

  // Set entire sort array - immediate (discrete action like reorder, preset)
  const setSort = useCallback(
    (newSort: SortQuery[]) => {
      setLocalSort(newSort);
      isInternalChange.current = true;
      void setUrlSortState(newSort);
    },
    [setUrlSortState]
  );

  // Add sort - immediate (discrete action, popover closes)
  const addSort = useCallback(
    (prop: string, direction: "asc" | "desc" = "asc") => {
      const existing = localSort.find((s) => s.property === prop);
      let newSort: SortQuery[];
      if (existing) {
        // Toggle direction
        newSort = localSort.map((s) =>
          s.property === prop
            ? { ...s, direction: s.direction === "asc" ? "desc" : "asc" }
            : s
        );
      } else {
        newSort = [...localSort, { property: prop, direction }];
      }
      setLocalSort(newSort);
      isInternalChange.current = true;
      void setUrlSortState(newSort);
    },
    [localSort, setUrlSortState]
  );

  // Remove sort - immediate (discrete action)
  const removeSort = useCallback(
    (prop: string) => {
      const newSort = localSort.filter((s) => s.property !== prop);
      setLocalSort(newSort);
      isInternalChange.current = true;
      void setUrlSortState(newSort);
    },
    [localSort, setUrlSortState]
  );

  // Update sort - debounced (editing property/direction)
  const updateSort = useCallback(
    (prop: string, updates: Partial<SortQuery>) => {
      const newSort = localSort.map((s) =>
        s.property === prop ? { ...s, ...updates } : s
      );
      setLocalSort(newSort);
      isInternalChange.current = true;
      debouncedUrlUpdate(newSort);
    },
    [localSort, debouncedUrlUpdate]
  );

  const clearSort = useCallback(() => {
    setLocalSort([]);
    isInternalChange.current = true;
    // Write empty array to URL immediately (no debounce for clear)
    void setUrlSortState(EMPTY_SORT);
  }, [setUrlSortState]);

  /** Remove sort param from URL entirely, restoring to server defaults */
  const resetSort = useCallback(() => {
    // Clear local sort immediately for UI feedback
    setLocalSort([]);
    // Don't set isInternalChange - allow effect to sync to server defaults after re-render
    // Immediate URL update for reset
    void setUrlSortState(null);
  }, [setUrlSortState]);

  return {
    sort: localSort,
    setSort,
    addSort,
    updateSort,
    removeSort,
    clearSort,
    resetSort,
    isSorted: localSort.length > 0,
  };
}
