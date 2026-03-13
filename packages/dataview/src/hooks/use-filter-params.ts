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

  // Recursively remove property from a single node
  const removePropertyFromNode = useCallback(
    (node: WhereNode, propertyId: string): WhereNode | null => {
      // If it's a rule with matching property, remove it
      if ("property" in node) {
        return node.property === propertyId ? null : node;
      }

      // If it's an and/or expression, recurse into children
      const children = node.and ?? node.or ?? [];
      const filtered = children
        .map((child) => removePropertyFromNode(child, propertyId))
        .filter((child): child is WhereNode => child !== null);

      // If no children remain, remove the entire expression
      if (filtered.length === 0) {
        return null;
      }

      // Return updated expression
      return node.and ? { and: filtered } : { or: filtered };
    },
    []
  );

  // Remove filter - immediate (recursive)
  const removeFilter = useCallback(
    (propertyId: string) => {
      if (!filter) {
        return;
      }

      const newFilter = filter
        .map((node) => removePropertyFromNode(node, propertyId))
        .filter((node): node is WhereNode => node !== null);

      setFilter(newFilter.length > 0 ? newFilter : null);
    },
    [filter, setFilter, removePropertyFromNode]
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
