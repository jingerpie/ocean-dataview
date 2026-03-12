"use client";

import { useCallback } from "react";
import {
  useQueryParamsActions,
  useQueryParamsState,
} from "../lib/providers/query-params-context";
import type { WhereNode } from "../types";

/**
 * Hook for managing filter state via URL.
 *
 * Reads from QueryParamsContext (single source of truth for validated state).
 *
 * @example
 * ```ts
 * const { filter, setFilter, addFilter, removeFilter } = useFilterParams();
 * ```
 */
export function useFilterParams() {
  const { filter } = useQueryParamsState();
  const { setFilter } = useQueryParamsActions();

  // Add filter - immediate
  const addFilter = useCallback(
    (node: WhereNode) => {
      const current = filter ?? [];
      setFilter([...current, node]);
    },
    [filter, setFilter]
  );

  // Remove filter - immediate
  const removeFilter = useCallback(
    (propertyId: string) => {
      if (!filter) {
        return;
      }

      const newFilter = filter.filter((node) => {
        if ("property" in node) {
          return node.property !== propertyId;
        }
        return true;
      });

      setFilter(newFilter.length > 0 ? newFilter : null);
    },
    [filter, setFilter]
  );

  // Clear all filters
  const clearFilter = useCallback(() => {
    setFilter(null);
  }, [setFilter]);

  // Reset filter (same as clear)
  const resetFilter = clearFilter;

  return {
    filter,
    setFilter,
    addFilter,
    removeFilter,
    clearFilter,
    resetFilter,
    isFiltered: filter !== null && filter.length > 0,
  };
}
