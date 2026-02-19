"use client";

import { parseAsCursors, parseAsExpanded } from "@sparkyidea/shared/lib";
import type { Cursors, CursorValue, Limit } from "@sparkyidea/shared/types";
import { useQueries } from "@tanstack/react-query";
import { parseAsInteger, useQueryState } from "nuqs";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import type { BidirectionalPaginatedResponse } from "../types/pagination-types";

// ============================================================================
// Constants
// ============================================================================

const FLAT_GROUP_KEY = "__all__";

// ============================================================================
// Types
// ============================================================================

/**
 * Query options for page-based query.
 * Compatible with TRPC's queryOptions return type.
 */
export interface PageQueryOptions {
  // biome-ignore lint/suspicious/noExplicitAny: TRPC returns complex types
  queryFn?: any;
  queryKey: readonly unknown[];
}

/**
 * Group configuration for grouped mode
 */
export interface PageGroupByOptions {
  /** All group keys in stable order */
  allGroupKeys: string[];
  /** Currently expanded groups */
  expanded: string[];
}

/**
 * Input options for usePagePagination hook.
 */
export interface UsePagePaginationOptions<
  TQueryOptions extends PageQueryOptions,
> {
  /** Cursors object per group (from URL props) */
  cursors?: Cursors;

  /**
   * Group configuration (optional)
   * - When undefined: flat mode (single "__all__" group)
   * - When defined: grouped mode with per-group pagination
   */
  groupBy?: PageGroupByOptions;

  /** Items per page */
  limit: Limit;

  /**
   * Query options factory
   * - Receives "__all__" for flat mode
   * - Receives actual group keys ("A", "B", etc.) for grouped mode
   * - cursor is the pagination cursor for that group
   */
  queryOptions: (groupKey: string, cursor?: CursorValue) => TQueryOptions;
}

/**
 * Per-group pagination info
 */
export interface PageGroupInfo<TData> {
  displayEnd: number;
  displayStart: number;
  hasNext: boolean | Record<string, boolean>;
  hasPrev: boolean;
  isFetching: boolean;
  isLoading: boolean;
  items: TData[];
  key: string;
  onNext: () => void;
  onPrev: () => void;
}

/**
 * Pagination state for DataViewProvider
 */
export interface PagePaginationState<TData> {
  /** Per-group info (single group for flat mode) */
  groups: PageGroupInfo<TData>[];
  /** Whether any group is loading */
  isLoading: boolean;
  /** Items per page */
  limit: Limit;
  /** Handler for limit changes */
  onLimitChange: (limit: Limit) => void;
}

/**
 * Output type for usePagePagination hook
 */
export interface PagePaginationResult<TData> {
  /** Flattened data from all groups */
  data: TData[];
  /** Current expanded groups (empty for flat mode) */
  expandedGroups: string[];
  /** Handler for accordion expand/collapse (no-op for flat mode) */
  handleAccordionChange: (newExpanded: string[]) => void;
  /** Pagination state for DataViewProvider */
  pagination: PagePaginationState<TData>;
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Unified hook for page-based pagination.
 * Handles both flat and grouped modes with a single API.
 *
 * Uses `useQueries` internally which supports dynamic arrays natively.
 * No maxGroups limitation like infinite pagination.
 *
 * Flat mode (groupBy undefined):
 * - Uses single "__all__" group internally
 * - queryOptions receives "__all__" as groupKey
 *
 * Grouped mode (groupBy defined):
 * - Uses provided allGroupKeys
 * - Per-group pagination with prev/next navigation
 *
 * @example
 * ```tsx
 * // Flat mode
 * const { data, pagination } = usePagePagination({
 *   limit: 10,
 *   cursors,
 *   queryOptions: (groupKey, cursor) =>
 *     trpc.product.getMany.queryOptions({ limit: 10, cursor }),
 * });
 *
 * // Grouped mode
 * const { data, pagination, handleAccordionChange, expandedGroups } =
 *   usePagePagination({
 *     limit: 10,
 *     cursors,
 *     groupBy: {
 *       allGroupKeys: ["A", "B", "C"],
 *       expanded: ["A"],
 *     },
 *     queryOptions: (groupKey, cursor) =>
 *       trpc.product.getManyByGroup.queryOptions({
 *         groupKeys: [groupKey],
 *         limit: 10,
 *         cursor,
 *       }),
 *   });
 * ```
 */
export function usePagePagination<
  TQueryOptions extends PageQueryOptions,
  TData = unknown,
>(
  options: UsePagePaginationOptions<TQueryOptions>
): PagePaginationResult<TData> {
  const { limit, groupBy, queryOptions, cursors = {} } = options;

  // Determine mode: flat vs grouped
  const isGrouped = groupBy != null;
  const allGroupKeys = isGrouped ? groupBy.allGroupKeys : [FLAT_GROUP_KEY];
  const initialExpanded = isGrouped ? groupBy.expanded : [FLAT_GROUP_KEY];

  // For flat mode, always "expand" the single group
  // For grouped mode, use provided expanded state
  const [localExpanded, setLocalExpanded] = useState(initialExpanded);
  const isInternalChange = useRef(false);

  // Track groups that have been fetched (for cache preservation)
  const [fetchedGroups, setFetchedGroups] = useState<Set<string>>(
    () => new Set(initialExpanded)
  );

  // Sync from props on external changes
  useEffect(() => {
    if (!isInternalChange.current) {
      const newExpanded = isGrouped ? groupBy.expanded : [FLAT_GROUP_KEY];
      setLocalExpanded(newExpanded);
      setFetchedGroups((prev) => {
        const next = new Set(prev);
        for (const key of newExpanded) {
          next.add(key);
        }
        return next;
      });
    }
    isInternalChange.current = false;
  }, [isGrouped, groupBy?.expanded]);

  const [, startTransition] = useTransition();

  // URL state for expanded groups (only for grouped mode)
  const [, setExpanded] = useQueryState(
    "expanded",
    parseAsExpanded.withOptions({ shallow: false })
  );

  // URL state for cursors
  const [, setCursors] = useQueryState(
    "cursors",
    parseAsCursors.withDefault({}).withOptions({ shallow: false })
  );

  // URL state for limit
  const [, setUrlLimit] = useQueryState(
    "limit",
    parseAsInteger.withOptions({ shallow: false })
  );

  // Create queries using useQueries (supports dynamic arrays!)
  const queries = useQueries({
    queries: allGroupKeys.map((groupKey) => {
      const cursor =
        groupKey === FLAT_GROUP_KEY
          ? cursors[FLAT_GROUP_KEY]
          : cursors[groupKey];
      const isEnabled =
        localExpanded.includes(groupKey) || fetchedGroups.has(groupKey);

      const opts = queryOptions(groupKey, cursor);

      return {
        queryKey: opts.queryKey,
        queryFn: opts.queryFn,
        enabled: isEnabled,
      };
    }),
  });

  // Build groups array with items and pagination info
  const groups = useMemo(() => {
    return allGroupKeys.map((groupKey, index) => {
      const query = queries[index];
      const isExpanded = localExpanded.includes(groupKey);
      const queryData = query?.data as
        | BidirectionalPaginatedResponse<TData>
        | undefined;

      const items: TData[] = queryData?.items ?? [];
      const cursorState = cursors[groupKey];
      const groupStart = cursorState?.start ?? 0;

      const group: PageGroupInfo<TData> = {
        key: groupKey,
        isLoading: query?.isLoading ?? false,
        isFetching: isExpanded && (query?.isFetching ?? false),
        items,
        hasNext: queryData?.hasNextPage ?? false,
        hasPrev: groupStart > 0,
        displayStart: items.length > 0 ? groupStart + 1 : 0,
        displayEnd: groupStart + items.length,

        onNext: () => {
          const endCursor = queryData?.endCursor;
          if (endCursor == null) {
            return;
          }
          startTransition(() => {
            setCursors({
              ...cursors,
              [groupKey]: {
                after: String(endCursor),
                start: groupStart + limit,
              },
            });
          });
        },

        onPrev: () => {
          const newStart = Math.max(0, groupStart - limit);
          startTransition(() => {
            if (newStart === 0) {
              // Remove cursor for this group
              const { [groupKey]: _, ...rest } = cursors;
              setCursors(Object.keys(rest).length > 0 ? rest : {});
            } else {
              const startCursor = queryData?.startCursor;
              if (startCursor == null) {
                return;
              }
              setCursors({
                ...cursors,
                [groupKey]: {
                  before: String(startCursor),
                  start: newStart,
                },
              });
            }
          });
        },
      };

      return group;
    });
  }, [allGroupKeys, queries, localExpanded, cursors, limit, setCursors]);

  // Flatten all items
  const data = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  // Limit change handler
  const onLimitChange = useCallback(
    (newLimit: Limit) => {
      startTransition(() => {
        setUrlLimit(newLimit);
        setCursors({}); // Reset all cursors when limit changes
      });
    },
    [setUrlLimit, setCursors]
  );

  // Accordion change handler (no-op for flat mode)
  const handleAccordionChange = useCallback(
    (newExpanded: string[]) => {
      if (!isGrouped) {
        return; // No-op for flat mode
      }

      setLocalExpanded(newExpanded);
      isInternalChange.current = true;

      setFetchedGroups((prev) => {
        const next = new Set(prev);
        for (const key of newExpanded) {
          next.add(key);
        }
        return next;
      });

      const removed = localExpanded.find((g) => !newExpanded.includes(g));

      startTransition(() => {
        // Clear cursor for collapsed group
        if (removed) {
          const { [removed]: _, ...rest } = cursors;
          setCursors(Object.keys(rest).length > 0 ? rest : {});
        }
        setExpanded(newExpanded.length > 0 ? newExpanded : null);
      });
    },
    [isGrouped, localExpanded, cursors, setExpanded, setCursors]
  );

  // Check if any group is loading
  const isLoading = queries.some((q) => q?.isFetching);

  return {
    data,
    pagination: {
      groups,
      limit,
      onLimitChange,
      isLoading,
    },
    handleAccordionChange,
    expandedGroups: isGrouped ? localExpanded : [],
  };
}
