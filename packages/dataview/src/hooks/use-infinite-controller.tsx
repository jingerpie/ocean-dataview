"use client";

import type { Limit } from "@sparkyidea/shared/types/pagination.type";
import type { GroupConfigInput } from "@sparkyidea/shared/utils/parsers/group";
import { useCallback, useMemo, useRef } from "react";
import type {
  BaseQueryOptions,
  InfiniteController,
  InfiniteGroupQueryOptions,
  InfiniteQueryOptionsFactory,
} from "../types/pagination-controller";

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
} from "../types/pagination-controller";

export interface UseInfiniteControllerOptions<
  TQueryOptions extends InfiniteQueryOptions = InfiniteQueryOptions,
> {
  /** Factory for fetching column counts (board-specific) */
  columnQuery?: (params: {
    columnConfig: GroupConfigInput;
    filter: import("@sparkyidea/shared/types").WhereNode[] | null;
    hideEmpty: boolean;
    search: string;
  }) => BaseQueryOptions;
  /** Factory for fetching data items */
  dataQuery: InfiniteQueryOptionsFactory<TQueryOptions>;
  /** Factory for fetching group counts with pagination (accordion rows) */
  groupQuery?: (params: {
    filter: import("@sparkyidea/shared/types").WhereNode[] | null;
    groupConfig: GroupConfigInput;
    hideEmpty: boolean;
    search: string;
  }) => InfiniteGroupQueryOptions;
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
  const columnQueryRef = useRef(columnQuery);
  columnQueryRef.current = columnQuery;
  const stableColumnQuery = useMemo<
    | ((params: {
        columnConfig: GroupConfigInput;
        filter: import("@sparkyidea/shared/types").WhereNode[] | null;
        hideEmpty: boolean;
        search: string;
      }) => BaseQueryOptions)
    | undefined
  >(() => {
    if (!columnQuery) {
      return undefined;
    }
    return (params) => {
      const factory = columnQueryRef.current;
      if (!factory) {
        throw new Error("columnQuery ref is unexpectedly null");
      }
      return factory(params);
    };
  }, [Boolean(columnQuery)]);

  // Stable group factory (accordion rows) with pagination support
  const groupQueryRef = useRef(groupQuery);
  groupQueryRef.current = groupQuery;
  const stableGroupQuery = useMemo<
    | ((params: {
        filter: import("@sparkyidea/shared/types").WhereNode[] | null;
        groupConfig: GroupConfigInput;
        hideEmpty: boolean;
        search: string;
      }) => InfiniteGroupQueryOptions)
    | undefined
  >(() => {
    if (!groupQuery) {
      return undefined;
    }
    return (params) => {
      const factory = groupQueryRef.current;
      if (!factory) {
        throw new Error("groupQuery ref is unexpectedly null");
      }
      return factory(params);
    };
  }, [Boolean(groupQuery)]);

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
