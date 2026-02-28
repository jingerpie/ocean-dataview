"use client";

import type { SortQuery } from "@sparkyidea/shared/types";
import { parseAsSort } from "@sparkyidea/shared/utils/parsers/sort";
import { useQueryState } from "nuqs";
import { useCallback, useContext } from "react";
import { DataViewContext } from "../lib/providers/data-view-context";

const THROTTLE_MS = 50;

/**
 * Hook for managing sort state via URL.
 *
 * When used inside DataViewProvider, reads from context (which has defaults applied).
 * When used outside, reads directly from URL.
 * Writes always go to URL.
 *
 * @example
 * ```ts
 * const { sort, setSort, addSort, removeSort } = useSortParams();
 * ```
 */
export function useSortParams() {
  // Try to read from context (has defaults applied)
  const context = useContext(DataViewContext);

  // URL state for writes and fallback reads
  const [urlSort, setUrlSort] = useQueryState(
    "sort",
    parseAsSort.withDefault([]).withOptions({ throttleMs: THROTTLE_MS })
  );

  // Use context value if available (has defaults), otherwise URL value
  const sort = context?.sort ?? urlSort;

  // Set entire sort array
  const setSort = useCallback(
    (newSort: SortQuery[]) => {
      void setUrlSort(newSort.length > 0 ? newSort : null);
    },
    [setUrlSort]
  );

  // Add or toggle sort
  const addSort = useCallback(
    (prop: string, direction: "asc" | "desc" = "asc") => {
      const existing = sort.find((s) => s.property === prop);
      let newSort: SortQuery[];

      if (existing) {
        // Toggle direction
        newSort = sort.map((s) =>
          s.property === prop
            ? { ...s, direction: s.direction === "asc" ? "desc" : "asc" }
            : s
        );
      } else {
        newSort = [...sort, { property: prop, direction }];
      }

      void setUrlSort(newSort);
    },
    [sort, setUrlSort]
  );

  // Remove sort
  const removeSort = useCallback(
    (prop: string) => {
      const newSort = sort.filter((s) => s.property !== prop);
      void setUrlSort(newSort.length > 0 ? newSort : null);
    },
    [sort, setUrlSort]
  );

  // Update sort (for inline editing)
  const updateSort = useCallback(
    (prop: string, updates: Partial<SortQuery>) => {
      const newSort = sort.map((s) =>
        s.property === prop ? { ...s, ...updates } : s
      );
      void setUrlSort(newSort);
    },
    [sort, setUrlSort]
  );

  // Clear sort
  const clearSort = useCallback(() => {
    void setUrlSort(null);
  }, [setUrlSort]);

  // Reset sort (same as clear)
  const resetSort = clearSort;

  return {
    sort,
    setSort,
    addSort,
    updateSort,
    removeSort,
    clearSort,
    resetSort,
    isSorted: sort.length > 0,
  };
}
