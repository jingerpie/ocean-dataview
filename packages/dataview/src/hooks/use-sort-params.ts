"use client";

import { parseAsSort } from "@sparkyidea/shared/lib";
import type { SortQuery } from "@sparkyidea/shared/types";
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

  const setSort = useCallback(
    (newSort: SortQuery[]) => {
      setLocalSort(newSort);
      isInternalChange.current = true;
      // Always write to URL (even empty array) to track explicit state
      debouncedUrlUpdate(newSort);
    },
    [debouncedUrlUpdate]
  );

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
      debouncedUrlUpdate(newSort);
    },
    [localSort, debouncedUrlUpdate]
  );

  const removeSort = useCallback(
    (prop: string) => {
      setLocalSort((currentSort) => {
        const newSort = currentSort.filter((s) => s.property !== prop);
        isInternalChange.current = true;
        debouncedUrlUpdate(newSort);
        return newSort;
      });
    },
    [debouncedUrlUpdate]
  );

  const clearSort = useCallback(() => {
    setLocalSort([]);
    isInternalChange.current = true;
    // Write empty array to URL immediately (no debounce for clear)
    void setUrlSortState(EMPTY_SORT);
  }, [setUrlSortState]);

  /** Remove sort param from URL entirely, restoring to server defaults */
  const resetSort = useCallback(() => {
    setLocalSort(serverSort);
    isInternalChange.current = true;
    // Immediate URL update for reset
    void setUrlSortState(null);
  }, [serverSort, setUrlSortState]);

  return {
    sort: localSort,
    setSort,
    addSort,
    removeSort,
    clearSort,
    resetSort,
    isSorted: localSort.length > 0,
  };
}
