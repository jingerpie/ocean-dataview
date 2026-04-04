"use client";

import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useDeferredValue, useMemo } from "react";
import { useQueryControllerContext } from "../lib/providers/query-bridge";
import type { Limit } from "../types/pagination";
import type { BasePaginatedResponse } from "../types/pagination-types";

export interface UseInfiniteGroupQueryOptions {
  /** The group key to query for */
  groupKey: string;
}

export interface InfiniteGroupQueryState {
  /** True when the query encountered an error */
  isError: boolean;
  /** True when a request is in flight (including background refetch) */
  isFetching: boolean;
  /** True when fetching more pages */
  isFetchingNextPage: boolean;
}

export interface InfiniteGroupPaginationControls {
  /** Whether there's more data to load (boolean for single query, Record for getManyByColumn) */
  hasNextPage: boolean | Record<string, boolean>;
  /** Load more items */
  onLoadMore: () => void;
  /** Total items loaded so far */
  totalLoaded: number;
}

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

/**
 * Default getNextPageParam for simple cursor-based pagination.
 * Only works when hasNextPage is boolean and endCursor is string/number.
 * For board views with per-column pagination (Record<string, boolean>),
 * the caller MUST provide their own getNextPageParam.
 */
const defaultGetNextPageParam = (
  lastPage: BasePaginatedResponse<unknown>
): string | undefined => {
  // Only handle simple boolean hasNextPage
  // Record<string, boolean> requires custom getNextPageParam
  if (typeof lastPage.hasNextPage === "object") {
    throw new Error(
      "Board views with per-column pagination require a custom getNextPageParam. " +
        "Pass getNextPageParam to infiniteQueryOptions that handles Record<string, boolean> hasNextPage."
    );
  }

  if (!lastPage.hasNextPage) {
    return undefined;
  }

  // Validate endCursor is a simple value, not a Record
  if (lastPage.endCursor !== null && typeof lastPage.endCursor === "object") {
    throw new Error(
      "Board views with per-column cursors require a custom getNextPageParam. " +
        "Pass getNextPageParam to infiniteQueryOptions that handles Record<string, cursor> endCursor."
    );
  }

  return lastPage.endCursor == null ? undefined : String(lastPage.endCursor);
};

export function useInfiniteGroupQuery<TData = unknown>(
  options: UseInfiniteGroupQueryOptions
): UseInfiniteGroupQueryResult<TData> {
  const { groupKey } = options;

  const state = useQueryControllerContext();

  // Guard: This hook requires an InfiniteController
  if (state.type !== "infinite") {
    throw new Error(
      "useInfiniteGroupQuery requires an InfiniteController (type: 'infinite'). " +
        `Received controller type: '${state.type}'. ` +
        "Use useGroupQuery for page-based pagination, or switch to useInfiniteController."
    );
  }

  const { filter, group, limit, dataQuery, search, setLimit, sort } = state;

  // Defer query parameters to prevent re-suspending on changes
  const deferredFilter = useDeferredValue(filter);
  const deferredSort = useDeferredValue(sort);
  const deferredSearch = useDeferredValue(search);
  const deferredLimit = useDeferredValue(limit);
  const deferredGroup = useDeferredValue(group);

  interface InfiniteQueryOptionsShape {
    getNextPageParam?: (
      lastPage: BasePaginatedResponse<unknown>
    ) => string | undefined;
    initialPageParam?: unknown;
    queryFn: (context: {
      pageParam: unknown;
    }) => Promise<BasePaginatedResponse<TData>>;
    queryKey: readonly unknown[];
  }

  const queryOptions = useMemo(() => {
    const options = dataQuery({
      filter: deferredFilter,
      groupBy:
        deferredGroup && groupKey !== "__ungrouped__"
          ? { type: deferredGroup, key: groupKey }
          : null,
      limit: deferredLimit,
      search: deferredSearch,
      sort: deferredSort,
    }) as InfiniteQueryOptionsShape;

    // Validate required infinite query fields
    if (!(options.queryKey && Array.isArray(options.queryKey))) {
      throw new Error(
        "Invalid infinite query options: missing or invalid queryKey. " +
          "Ensure you're using infiniteQueryOptions(), not regular queryOptions()."
      );
    }

    if (typeof options.queryFn !== "function") {
      throw new Error(
        "Invalid infinite query options: missing queryFn. " +
          "Ensure you're using infiniteQueryOptions(), not regular queryOptions()."
      );
    }

    return options;
  }, [
    dataQuery,
    deferredFilter,
    deferredGroup,
    groupKey,
    deferredLimit,
    deferredSearch,
    deferredSort,
  ]);

  // Spread tRPC options directly and provide fallbacks
  const query = useSuspenseInfiniteQuery({
    ...queryOptions,
    getNextPageParam: queryOptions.getNextPageParam ?? defaultGetNextPageParam,
    initialPageParam: queryOptions.initialPageParam ?? undefined,
  });

  const data = useMemo(() => {
    if (!query.data?.pages) {
      return [];
    }
    return query.data.pages.flatMap(
      (page) => (page as BasePaginatedResponse<TData>).items
    );
  }, [query.data?.pages]);

  const hasNextPage = useMemo(() => {
    const lastPage = query.data?.pages?.at(-1) as
      | BasePaginatedResponse<TData>
      | undefined;
    return lastPage?.hasNextPage ?? false;
  }, [query.data?.pages]);

  const onLoadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage();
    }
  }, [query]);

  const onLimitChange = useCallback(
    (newLimit: Limit) => {
      setLimit(newLimit);
    },
    [setLimit]
  );

  return {
    data,
    isError: query.isError,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    error: query.error,
    hasNextPage,
    onLoadMore,
    totalLoaded: data.length,
    limit,
    onLimitChange,
  };
}
