"use client";

import type {
  BaseQueryOptions,
  ColumnQueryOptionsFactory,
  GroupQueryOptionsFactory,
  InfiniteController,
  InfiniteQueryOptionsFactory,
  Limit,
} from "@sparkyidea/dataview-core";
import { useCallback, useMemo, useRef } from "react";

/**
 * Extended interface for infinite query options.
 * Ensures compatibility with both tRPC's infiniteQueryOptions and manual configurations.
 *
 * Note: This interface is intentionally loose to accommodate tRPC's complex types.
 * Runtime validation in useInfiniteGroupQuery ensures the options are valid.
 *
 * @example
 * // Correct usage with tRPC
 * dataQuery: (params) => trpc.product.getManyByColumn.infiniteQueryOptions({
 *   ...params,
 *   getNextPageParam: (lastPage) => {
 *     // Handle per-column cursors for board views
 *     if (Object.values(lastPage.hasNextPage).some(Boolean)) {
 *       return lastPage.endCursor;
 *     }
 *     return undefined;
 *   },
 * })
 */
export interface InfiniteQueryOptions extends BaseQueryOptions {
  // biome-ignore lint/suspicious/noExplicitAny: TRPC returns complex types
  getNextPageParam?: any;
  // biome-ignore lint/suspicious/noExplicitAny: TRPC returns complex types
  initialPageParam?: any;
}

export interface InfiniteGroupInfo<TData> {
  count?: number;
  displayCount?: string;
  error: Error | null;
  hasNext: boolean | Record<string, boolean>;
  isError: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  items: TData[];
  key: string;
  onNext: () => void;
  totalLoaded: number;
}

export interface InfinitePaginationState<TData> {
  groups: InfiniteGroupInfo<TData>[];
  limit: Limit;
  onLimitChange: (limit: Limit) => void;
}

export type {
  GroupQueryOptionsFactory,
  InfiniteQueryOptionsFactory,
  InfiniteQueryOptionsFactoryParams,
} from "@sparkyidea/dataview-core";

export interface UseInfiniteControllerOptions<
  TQueryOptions extends InfiniteQueryOptions = InfiniteQueryOptions,
> {
  /** Factory for fetching column counts (board-specific) */
  columnQuery?: ColumnQueryOptionsFactory;
  /** Factory for fetching data items */
  dataQuery: InfiniteQueryOptionsFactory<TQueryOptions>;
  /** Factory for fetching group counts with pagination (accordion rows) */
  groupQuery?: GroupQueryOptionsFactory;
}

export interface UseInfiniteControllerResult<TQueryOptions> {
  controller: InfiniteController<TQueryOptions>;
}

export function useInfiniteController<
  TQueryOptions extends InfiniteQueryOptions = InfiniteQueryOptions,
>(
  options: UseInfiniteControllerOptions<TQueryOptions>
): UseInfiniteControllerResult<TQueryOptions> {
  const { columnQuery, dataQuery, groupQuery } = options;

  const dataQueryRef = useRef(dataQuery);
  dataQueryRef.current = dataQuery;
  const stableDataQuery = useCallback<
    InfiniteQueryOptionsFactory<TQueryOptions>
  >((params) => dataQueryRef.current(params), []);

  // Stable column factory (board-specific)
  const hasColumnQuery = Boolean(columnQuery);
  const columnQueryRef = useRef(columnQuery);
  columnQueryRef.current = columnQuery;
  const stableColumnQuery = useMemo<
    ColumnQueryOptionsFactory | undefined
  >(() => {
    if (!hasColumnQuery) {
      return undefined;
    }
    return (params) => {
      const factory = columnQueryRef.current;
      if (!factory) {
        throw new Error("columnQuery ref is unexpectedly null");
      }
      return factory(params);
    };
  }, [hasColumnQuery]);

  // Stable group factory (accordion rows) with pagination support
  const hasGroupQuery = Boolean(groupQuery);
  const groupQueryRef = useRef(groupQuery);
  groupQueryRef.current = groupQuery;
  const stableGroupQuery = useMemo<GroupQueryOptionsFactory | undefined>(() => {
    if (!hasGroupQuery) {
      return undefined;
    }
    return (params) => {
      const factory = groupQueryRef.current;
      if (!factory) {
        throw new Error("groupQuery ref is unexpectedly null");
      }
      return factory(params);
    };
  }, [hasGroupQuery]);

  const controller = useMemo<InfiniteController<TQueryOptions>>(
    () => ({
      columnQuery: stableColumnQuery,
      dataQuery: stableDataQuery,
      groupQuery: stableGroupQuery,
      type: "infinite",
    }),
    [stableColumnQuery, stableDataQuery, stableGroupQuery]
  );

  return { controller };
}
