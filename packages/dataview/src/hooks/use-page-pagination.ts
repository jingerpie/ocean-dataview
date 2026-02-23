"use client";

import { parseAsCursors, parseAsExpanded } from "@sparkyidea/shared/lib";
import type { Cursors, CursorValue, Limit } from "@sparkyidea/shared/types";
import { useQueries, useSuspenseQueries } from "@tanstack/react-query";
import { parseAsInteger, useQueryState } from "nuqs";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
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

/**
 * Output type for useSuspensePagePagination hook
 * Same as PagePaginationResult but without loading states (data is always ready)
 */
export interface SuspensePagePaginationResult<TData> {
  /** Flattened data from all groups */
  data: TData[];
  /** Current expanded groups (empty for flat mode) */
  expandedGroups: string[];
  /** Handler for accordion expand/collapse (no-op for flat mode) */
  handleAccordionChange: (newExpanded: string[]) => void;
  /** Pagination state for DataViewProvider */
  pagination: PagePaginationState<TData>;
}

/**
 * Internal query result shape for processing
 */
interface QueryResultLike<TData> {
  data?: BidirectionalPaginatedResponse<TData>;
  isFetching?: boolean;
  isLoading?: boolean;
}

// ============================================================================
// Shared State Hook
// ============================================================================

interface SharedPaginationState {
  allGroupKeys: string[];
  cursors: Cursors;
  fetchedGroups: Set<string>;
  handleAccordionChange: (newExpanded: string[]) => void;
  isGrouped: boolean;
  limit: Limit;
  localExpanded: string[];
  onLimitChange: (limit: Limit) => void;
  setCursors: (cursors: Cursors | null) => void;
  startTransition: (callback: () => void) => void;
}

/**
 * Shared state management for page pagination hooks.
 * Handles expanded state, fetched groups tracking, and URL state.
 */
function usePagePaginationState<TQueryOptions extends PageQueryOptions>(
  options: UsePagePaginationOptions<TQueryOptions>
): SharedPaginationState {
  const { limit, groupBy, cursors = {} } = options;

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

  // URL state for expanded groups
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
        // Update URL
        setExpanded(newExpanded.length > 0 ? newExpanded : null);
      });
    },
    [isGrouped, localExpanded, cursors, setCursors, setExpanded]
  );

  return {
    allGroupKeys,
    cursors,
    fetchedGroups,
    handleAccordionChange,
    isGrouped,
    limit,
    localExpanded,
    onLimitChange,
    setCursors,
    startTransition,
  };
}

// ============================================================================
// Query Building
// ============================================================================

interface QueryConfig {
  enabled: boolean;
  // biome-ignore lint/suspicious/noExplicitAny: TRPC returns complex types
  queryFn: any;
  queryKey: readonly unknown[];
}

/**
 * Build query configurations for all groups
 */
function buildQueryConfigs<TQueryOptions extends PageQueryOptions>(
  options: UsePagePaginationOptions<TQueryOptions>,
  state: SharedPaginationState
): QueryConfig[] {
  const { queryOptions } = options;
  const { allGroupKeys, cursors, fetchedGroups, localExpanded } = state;

  return allGroupKeys.map((groupKey) => {
    const cursor =
      groupKey === FLAT_GROUP_KEY ? cursors[FLAT_GROUP_KEY] : cursors[groupKey];
    const isEnabled =
      localExpanded.includes(groupKey) || fetchedGroups.has(groupKey);

    const opts = queryOptions(groupKey, cursor);

    return {
      queryKey: opts.queryKey,
      queryFn: opts.queryFn,
      enabled: isEnabled,
    };
  });
}

// ============================================================================
// Result Processing
// ============================================================================

/**
 * Process query results into pagination result
 */
function processQueryResults<TData>(
  queries: QueryResultLike<TData>[],
  state: SharedPaginationState
): {
  data: TData[];
  groups: PageGroupInfo<TData>[];
  isLoading: boolean;
} {
  const {
    allGroupKeys,
    cursors,
    limit,
    localExpanded,
    setCursors,
    startTransition,
  } = state;

  const groups = allGroupKeys.map((groupKey, index) => {
    const query = queries[index];
    const isExpanded = localExpanded.includes(groupKey);
    const queryData = query?.data;

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

  const data = groups.flatMap((g) => g.items);
  const isLoading = queries.some((q) => q?.isFetching);

  return { data, groups, isLoading };
}

// ============================================================================
// usePagePagination (Non-Suspense)
// ============================================================================

/**
 * Hook for page-based pagination with loading states.
 * Handles both flat and grouped modes with a single API.
 *
 * Uses `useQueries` internally which returns loading states.
 * Use this for client-side rendering where you want to show loading spinners.
 *
 * For SSR/prefetch scenarios where data should be ready before render,
 * use `useSuspensePagePagination` instead.
 *
 * @example
 * ```tsx
 * // Client-only page with loading spinner
 * function ProductTableClient() {
 *   const { data, pagination, isLoading } = usePagePagination({
 *     limit: 10,
 *     cursors,
 *     queryOptions: (groupKey, cursor) =>
 *       trpc.product.getMany.queryOptions({ limit: 10, cursor }),
 *   });
 *
 *   if (pagination.isLoading) return <Spinner />;
 *   return <Table data={data} pagination={pagination} />;
 * }
 * ```
 */
export function usePagePagination<
  TQueryOptions extends PageQueryOptions,
  TData = unknown,
>(
  options: UsePagePaginationOptions<TQueryOptions>
): PagePaginationResult<TData> {
  const state = usePagePaginationState(options);
  const queryConfigs = buildQueryConfigs(options, state);

  // Use useQueries for non-suspense queries with loading states
  const queries = useQueries({
    queries: queryConfigs,
  });

  // Map to internal format
  const queryResults: QueryResultLike<TData>[] = queries.map((q) => ({
    data: q.data as BidirectionalPaginatedResponse<TData> | undefined,
    isFetching: q.isFetching,
    isLoading: q.isLoading,
  }));

  const { data, groups, isLoading } = processQueryResults(queryResults, state);

  return {
    data,
    pagination: {
      groups,
      limit: state.limit,
      onLimitChange: state.onLimitChange,
      isLoading,
    },
    handleAccordionChange: state.handleAccordionChange,
    expandedGroups: state.isGrouped ? state.localExpanded : [],
  };
}

// ============================================================================
// useSuspensePagePagination (Suspense)
// ============================================================================

/**
 * Hook for page-based pagination with Suspense support.
 * Handles both flat and grouped modes with a single API.
 *
 * Uses `useSuspenseQueries` internally which suspends until data is ready.
 * Use this for SSR/prefetch scenarios where data should be available before render.
 *
 * For client-side rendering where you want to show loading spinners,
 * use `usePagePagination` instead.
 *
 * @example
 * ```tsx
 * // SSR page with prefetch
 * function ProductTableSSR() {
 *   const { data, pagination } = useSuspensePagePagination({
 *     limit: 10,
 *     cursors,
 *     queryOptions: (groupKey, cursor) =>
 *       trpc.product.getMany.queryOptions({ limit: 10, cursor }),
 *   });
 *
 *   // Data is always available (suspends until ready)
 *   return <Table data={data} pagination={pagination} />;
 * }
 * ```
 */
export function useSuspensePagePagination<
  TQueryOptions extends PageQueryOptions,
  TData = unknown,
>(
  options: UsePagePaginationOptions<TQueryOptions>
): SuspensePagePaginationResult<TData> {
  const state = usePagePaginationState(options);
  const queryConfigs = buildQueryConfigs(options, state);

  // Use useSuspenseQueries for suspense-enabled queries
  const queries = useSuspenseQueries({
    queries: queryConfigs,
  });

  // Map to internal format - suspense queries always have data
  const queryResults: QueryResultLike<TData>[] = queries.map((q) => ({
    data: q.data as BidirectionalPaginatedResponse<TData>,
    isFetching: q.isFetching,
    isLoading: false, // Suspense queries are never "loading"
  }));

  const { data, groups, isLoading } = processQueryResults(queryResults, state);

  return {
    data,
    pagination: {
      groups,
      limit: state.limit,
      onLimitChange: state.onLimitChange,
      isLoading,
    },
    handleAccordionChange: state.handleAccordionChange,
    expandedGroups: state.isGrouped ? state.localExpanded : [],
  };
}
