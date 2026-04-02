"use client";

import { useCallback } from "react";
import {
  useQueryParamsActions,
  useQueryParamsState,
} from "../lib/providers/query-params-context";
import type { SortQuery } from "../types/sort.type";

/**
 * Hook for managing sort state via URL.
 *
 * Reads from QueryParamsContext (single source of truth for validated state).
 *
 * @example
 * ```ts
 * const { sort, setSort, addSort, removeSort } = useSortParams();
 * ```
 */
export function useSortParams() {
  const { sort } = useQueryParamsState();
  const { setSort } = useQueryParamsActions();

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

      setSort(newSort);
    },
    [sort, setSort]
  );

  // Remove sort
  const removeSort = useCallback(
    (prop: string) => {
      const newSort = sort.filter((s) => s.property !== prop);
      setSort(newSort);
    },
    [sort, setSort]
  );

  // Update sort (for inline editing)
  const updateSort = useCallback(
    (prop: string, updates: Partial<SortQuery>) => {
      const newSort = sort.map((s) =>
        s.property === prop ? { ...s, ...updates } : s
      );
      setSort(newSort);
    },
    [sort, setSort]
  );

  // Clear sort
  const clearSort = useCallback(() => {
    setSort([]);
  }, [setSort]);

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
