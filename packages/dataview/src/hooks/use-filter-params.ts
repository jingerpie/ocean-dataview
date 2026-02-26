"use client";

import type { WhereNode } from "@sparkyidea/shared/types";
import { parseAsFilter } from "@sparkyidea/shared/utils/parsers/filter";
import { useQueryState } from "nuqs";
import { useCallback } from "react";

const THROTTLE_MS = 50;

/**
 * Hook for managing filter state via URL.
 *
 * Uses URL as single source of truth with shallow: true (default).
 * All components using this hook share the same URL state.
 *
 * @example
 * ```ts
 * const { filter, setFilter, addFilter, removeFilter } = useFilterParams();
 * ```
 */
export function useFilterParams() {
  // URL state - single source of truth shared across all hook instances
  const [filter, setUrlFilter] = useQueryState(
    "filter",
    parseAsFilter.withOptions({ throttleMs: THROTTLE_MS })
  );

  // Set filter (replaces entire filter)
  const setFilter = useCallback(
    (newFilter: WhereNode[] | null) => {
      void setUrlFilter(newFilter);
    },
    [setUrlFilter]
  );

  // Add filter - immediate
  const addFilter = useCallback(
    (node: WhereNode) => {
      const current = filter ?? [];
      void setUrlFilter([...current, node]);
    },
    [filter, setUrlFilter]
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

      void setUrlFilter(newFilter.length > 0 ? newFilter : null);
    },
    [filter, setUrlFilter]
  );

  // Clear all filters
  const clearFilter = useCallback(() => {
    void setUrlFilter(null);
  }, [setUrlFilter]);

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
