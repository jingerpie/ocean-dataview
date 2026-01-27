"use client";

import { parseAsSort } from "@ocean-dataview/shared/lib";
import type { SortQuery } from "@ocean-dataview/shared/types";
import { useDebouncer } from "@tanstack/react-pacer";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { useDataViewContext } from "../lib/providers";

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
 *
 * Debouncing: 150ms with leading edge (first click fires immediately,
 * subsequent rapid clicks are batched)
 *
 * @example
 * ```ts
 * const { sort, setSort, flush } = useSortParams();
 *
 * // URL format: ?sort=[["name","asc"]]
 * // Empty sort: ?sort=[]
 * // Call flush() before navigation to ensure pending updates are applied
 * ```
 */
export function useSortParams() {
  // Read sort from context (server props)
  const { defaults } = useDataViewContext();
  const serverSort = defaults?.sort ?? [];

  // Write-only URL state
  const [, setUrlSortState] = useQueryState("sort", {
    ...parseAsSort,
    shallow: false,
  });

  // Local state for immediate UI updates (initialized from server)
  const [localSort, setLocalSort] = useState<SortQuery[]>(serverSort);

  // Debounced URL update with leading: true for responsive first click
  const urlDebouncer = useDebouncer(
    (newSort: SortQuery[]) => {
      setUrlSortState(newSort);
    },
    { wait: SORT_DEBOUNCE_MS, leading: true, trailing: true }
  );

  // Sync local state when server value changes (navigation, refresh)
  useEffect(() => {
    setLocalSort(serverSort);
  }, [serverSort]);

  // Flush pending updates on unmount
  useEffect(() => {
    return () => urlDebouncer.flush();
  }, [urlDebouncer]);

  const setSort = (newSort: SortQuery[]) => {
    setLocalSort(newSort);
    // Always write to URL (even empty array) to track explicit state
    urlDebouncer.maybeExecute(newSort);
  };

  const addSort = (prop: string, direction: "asc" | "desc" = "asc") => {
    const existing = localSort.find((s) => s.property === prop);
    if (existing) {
      // Toggle direction
      setSort(
        localSort.map((s) =>
          s.property === prop
            ? { ...s, direction: s.direction === "asc" ? "desc" : "asc" }
            : s
        )
      );
    } else {
      setSort([...localSort, { property: prop, direction }]);
    }
  };

  const removeSort = (prop: string) => {
    setSort(localSort.filter((s) => s.property !== prop));
  };

  const clearSort = () => {
    setLocalSort([]);
    urlDebouncer.cancel();
    // Write empty array to URL to distinguish from "use default"
    setUrlSortState(EMPTY_SORT);
  };

  /** Remove sort param from URL entirely, restoring to server defaults */
  const resetSort = () => {
    setLocalSort(serverSort);
    urlDebouncer.cancel();
    setUrlSortState(null);
  };

  return {
    sort: localSort,
    setSort,
    addSort,
    removeSort,
    clearSort,
    resetSort,
    isSorted: localSort.length > 0,
    /** Immediately apply pending sort to URL */
    flush: () => urlDebouncer.flush(),
  };
}
