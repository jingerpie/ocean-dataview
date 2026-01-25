"use client";

import { parseAsSort } from "@ocean-dataview/shared/lib";
import type { PropertySort } from "@ocean-dataview/shared/types";
import { useDebouncer } from "@tanstack/react-pacer";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";

const SORT_DEBOUNCE_MS = 150;

interface UseSortParamsOptions {
  /** Initial sort from server props or defaults */
  sort?: PropertySort[];
}

/**
 * Hook for managing sort state in URL with debouncing.
 * Uses PropertySort[] array format for multi-column sort support.
 *
 * Debouncing: 150ms with leading edge (first click fires immediately,
 * subsequent rapid clicks are batched)
 *
 * @example
 * ```ts
 * const { sort, setSort, flush } = useSortParams();
 *
 * // With default sort
 * const { sort, setSort } = useSortParams({ sort: defaults?.sort });
 *
 * // URL format: ?sort=[["name","asc"]]
 * // Call flush() before navigation to ensure pending updates are applied
 * ```
 */
export function useSortParams(options: UseSortParamsOptions = {}) {
  const [urlSort, setUrlSortJson] = useQueryState("sort", {
    ...parseAsSort,
    defaultValue: options.sort ?? [],
    shallow: false,
  });

  // Local state for immediate UI updates
  const [localSort, setLocalSort] = useState<PropertySort[]>(urlSort ?? []);

  // Debounced URL update with leading: true for responsive first click
  const urlDebouncer = useDebouncer(
    (newSort: PropertySort[] | null) => {
      setUrlSortJson(newSort);
    },
    { wait: SORT_DEBOUNCE_MS, leading: true, trailing: true }
  );

  // Sync local state when URL changes (e.g., back/forward navigation)
  useEffect(() => {
    setLocalSort(urlSort ?? []);
  }, [urlSort]);

  // Flush pending updates on unmount
  useEffect(() => {
    return () => urlDebouncer.flush();
  }, [urlDebouncer]);

  const setSort = (newSort: PropertySort[]) => {
    setLocalSort(newSort);
    urlDebouncer.maybeExecute(newSort.length === 0 ? null : newSort);
  };

  const addSort = (prop: string, desc = false) => {
    const existing = localSort.find((s) => s.property === prop);
    if (existing) {
      // Toggle direction
      setSort(
        localSort.map((s) =>
          s.property === prop ? { ...s, desc: !s.desc } : s
        )
      );
    } else {
      setSort([...localSort, { property: prop, desc }]);
    }
  };

  const removeSort = (prop: string) => {
    setSort(localSort.filter((s) => s.property !== prop));
  };

  const clearSort = () => {
    setLocalSort([]);
    urlDebouncer.cancel();
    setUrlSortJson(null);
  };

  return {
    sort: localSort,
    setSort,
    addSort,
    removeSort,
    clearSort,
    isSorted: localSort.length > 0,
    /** Immediately apply pending sort to URL */
    flush: () => urlDebouncer.flush(),
  };
}
