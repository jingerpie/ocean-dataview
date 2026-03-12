"use client";

import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useDeferredValue, useMemo } from "react";
import { useQueryControllerContext } from "../lib/providers/query-bridge";
import type { Limit } from "../types";
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

const defaultGetNextPageParam = (
  lastPage: BasePaginatedResponse<unknown>
): string | undefined =>
  lastPage.hasNextPage && lastPage.endCursor
    ? String(lastPage.endCursor)
    : undefined;

export function useInfiniteGroupQuery<TData = unknown>(
  options: UseInfiniteGroupQueryOptions
): UseInfiniteGroupQueryResult<TData> {
  const { groupKey } = options;

  const state = useQueryControllerContext();

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

  const queryOptions = useMemo(
    () =>
      dataQuery({
        filter: deferredFilter,
        groupConfig: deferredGroup,
        groupKey,
        limit: deferredLimit,
        search: deferredSearch,
        sort: deferredSort,
      }) as InfiniteQueryOptionsShape,
    [
      dataQuery,
      deferredFilter,
      deferredGroup,
      groupKey,
      deferredLimit,
      deferredSearch,
      deferredSort,
    ]
  );

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
