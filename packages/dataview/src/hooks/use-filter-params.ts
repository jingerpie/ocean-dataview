"use client";

import type { WhereNode } from "@sparkyidea/shared/types";
import { parseAsFilter } from "@sparkyidea/shared/utils/parsers/filter";
import { useQueryState } from "nuqs";
import { useCallback, useContext } from "react";
import { DataViewContext } from "../lib/providers/data-view-context";

const THROTTLE_MS = 50;

/**
 * Hook for managing filter state via URL.
 *
 * When used inside DataViewProvider, reads from context (which has defaults applied).
 * When used outside, reads directly from URL.
 * Writes always go to URL.
 *
 * @example
 * ```ts
 * const { filter, setFilter, addFilter, removeFilter } = useFilterParams();
 * ```
 */
export function useFilterParams() {
  // Try to read from context (has defaults applied)
  const context = useContext(DataViewContext);

  // URL state for writes and fallback reads
  const [urlFilter, setUrlFilter] = useQueryState(
    "filter",
    parseAsFilter.withOptions({ throttleMs: THROTTLE_MS })
  );

  // Use context value if available (has defaults), otherwise URL value
  const filter = context?.filter ?? urlFilter;

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
