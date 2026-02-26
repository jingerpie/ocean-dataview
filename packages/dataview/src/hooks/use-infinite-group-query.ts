"use client";

import type { Limit } from "@sparkyidea/shared/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useInfinitePaginationContext } from "../lib/providers/infinite-pagination-provider";
import type { BasePaginatedResponse } from "../types/pagination-types";

// ============================================================================
// Types
// ============================================================================

/**
 * Options for useInfiniteGroupQuery hook.
 */
export interface UseInfiniteGroupQueryOptions {
  /**
   * Whether to enable the query.
   * Defaults to true if group is expanded.
   */
  enabled?: boolean;
  /** The group key to query for */
  groupKey: string;
}

/**
 * Query state information for UI rendering.
 */
export interface InfiniteGroupQueryState {
  /** True when the query encountered an error */
  isError: boolean;
  /** True when a request is in flight (including background refetch) */
  isFetching: boolean;
  /** True when fetching more pages */
  isFetchingNextPage: boolean;
  /** True only during initial load (no cached data) */
  isPending: boolean;
}

/**
 * Pagination controls for an infinite group.
 */
export interface InfiniteGroupPaginationControls {
  /** Whether there's more data to load (boolean for single query, Record for getManyByGroup) */
  hasNextPage: boolean | Record<string, boolean>;
  /** Load more items */
  onLoadMore: () => void;
  /** Total items loaded so far */
  totalLoaded: number;
}

/**
 * Result of useInfiniteGroupQuery hook.
 */
export interface UseInfiniteGroupQueryResult<TData>
  extends InfiniteGroupQueryState,
    InfiniteGroupPaginationControls {
  /** Data items for this group (flattened from all pages) */
  data: TData[];
  /** Error if query failed */
  error: Error | null;
  /** Current page limit */
  limit: Limit;
  /** Handler to change page limit */
  onLimitChange: (limit: Limit) => void;
}

// ============================================================================
// Default Page Param Handler
// ============================================================================

const defaultGetNextPageParam = (
  lastPage: BasePaginatedResponse<unknown>
): string | undefined =>
  lastPage.hasNextPage && lastPage.endCursor
    ? String(lastPage.endCursor)
    : undefined;

// ============================================================================
// Hook
// ============================================================================

/**
 * useInfiniteGroupQuery - Per-group infinite query hook.
 *
 * Each group accordion owns its useInfiniteQuery, enabling:
 * - Unlimited groups (no fixed hook limit)
 * - Independent load-more per group
 * - Proper React patterns
 *
 * Must be used within an InfinitePaginationProvider.
 *
 * @example
 * ```tsx
 * function GroupAccordionSection({ groupKey }: { groupKey: string }) {
 *   const {
 *     data,
 *     isPending,
 *     isFetchingNextPage,
 *     hasNextPage,
 *     onLoadMore,
 *   } = useInfiniteGroupQuery({ groupKey });
 *
 *   if (isPending && data.length === 0) {
 *     return <Skeleton />;
 *   }
 *
 *   return (
 *     <>
 *       <List data={data} />
 *       {hasNextPage && (
 *         <Button onClick={onLoadMore} disabled={isFetchingNextPage}>
 *           {isFetchingNextPage ? "Loading..." : "Load More"}
 *         </Button>
 *       )}
 *     </>
 *   );
 * }
 * ```
 */
export function useInfiniteGroupQuery<TData = unknown>(
  options: UseInfiniteGroupQueryOptions
): UseInfiniteGroupQueryResult<TData> {
  const { groupKey, enabled: enabledOption } = options;

  // Get context from provider
  const { expandedGroups, limit, queryOptionsFactory, setLimit } =
    useInfinitePaginationContext();

  // Determine if query should be enabled
  const isExpanded = expandedGroups.includes(groupKey);
  const enabled = enabledOption ?? isExpanded;

  // Build query options
  const queryOptions = useMemo(
    () => queryOptionsFactory(groupKey),
    [queryOptionsFactory, groupKey]
  );

  // Execute infinite query
  const query = useInfiniteQuery({
    queryKey: queryOptions.queryKey,
    queryFn: queryOptions.queryFn,
    getNextPageParam: queryOptions.getNextPageParam ?? defaultGetNextPageParam,
    initialPageParam: queryOptions.initialPageParam ?? undefined,
    enabled,
  });

  // Flatten data from all pages
  const data = useMemo(() => {
    if (!query.data?.pages) {
      return [];
    }
    return query.data.pages.flatMap(
      (page) => (page as BasePaginatedResponse<TData>).items
    );
  }, [query.data?.pages]);

  // Get hasNextPage from last page response (supports Record<string, boolean> for getManyByGroup)
  const hasNextPage = useMemo(() => {
    const lastPage = query.data?.pages?.at(-1) as
      | BasePaginatedResponse<TData>
      | undefined;
    return lastPage?.hasNextPage ?? false;
  }, [query.data?.pages]);

  // Load more handler
  const onLoadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage();
    }
  }, [query]);

  // Limit change handler
  const onLimitChange = useCallback(
    (newLimit: Limit) => {
      setLimit(newLimit);
    },
    [setLimit]
  );

  return {
    // Data
    data,

    // Query state
    isError: query.isError,
    isPending: query.isPending,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    error: query.error,

    // Pagination controls
    hasNextPage,
    onLoadMore,
    totalLoaded: data.length,

    // Limit
    limit,
    onLimitChange,
  };
}
