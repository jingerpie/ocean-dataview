"use client";

import type { Limit } from "@sparkyidea/shared/types/pagination.type";
import type { GroupConfigInput } from "@sparkyidea/shared/utils/parsers/group";
import { useCallback, useMemo, useRef } from "react";
import type {
  BaseQueryOptions,
  InfinitePaginationController,
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

export interface UseInfinitePaginationOptions<
  TQueryOptions extends InfiniteQueryOptions = InfiniteQueryOptions,
> {
  /** Factory for fetching column counts (board-specific) */
  columnQueryOptionsFactory?: (
    columnConfig: GroupConfigInput
  ) => BaseQueryOptions;
  /** Factory for fetching group counts (accordion rows) */
  groupQueryOptionsFactory?: (
    groupConfig: GroupConfigInput
  ) => BaseQueryOptions;
  /** Factory for fetching data items */
  queryOptionsFactory: InfiniteQueryOptionsFactory<TQueryOptions>;
}

export interface UseInfinitePaginationResult<TQueryOptions> {
  pagination: InfinitePaginationController<TQueryOptions>;
}

export function useInfinitePagination<
  TQueryOptions extends InfiniteQueryOptions = InfiniteQueryOptions,
>(
  options: UseInfinitePaginationOptions<TQueryOptions>
): UseInfinitePaginationResult<TQueryOptions> {
  const {
    columnQueryOptionsFactory,
    groupQueryOptionsFactory,
    queryOptionsFactory,
  } = options;

  const factoryRef = useRef(queryOptionsFactory);
  factoryRef.current = queryOptionsFactory;
  const stableFactory = useCallback<InfiniteQueryOptionsFactory<TQueryOptions>>(
    (params) => factoryRef.current(params),
    []
  );

  // Stable column factory (board-specific)
  const columnFactoryRef = useRef(columnQueryOptionsFactory);
  columnFactoryRef.current = columnQueryOptionsFactory;
  const stableColumnFactory = useMemo<
    ((columnConfig: GroupConfigInput) => BaseQueryOptions) | undefined
  >(() => {
    if (!columnQueryOptionsFactory) {
      return undefined;
    }
    return (columnConfig) => {
      const factory = columnFactoryRef.current;
      if (!factory) {
        throw new Error("columnQueryOptionsFactory ref is unexpectedly null");
      }
      return factory(columnConfig);
    };
  }, [Boolean(columnQueryOptionsFactory)]);

  // Stable group factory (accordion rows)
  const groupFactoryRef = useRef(groupQueryOptionsFactory);
  groupFactoryRef.current = groupQueryOptionsFactory;
  const stableGroupFactory = useMemo<
    ((groupConfig: GroupConfigInput) => BaseQueryOptions) | undefined
  >(() => {
    if (!groupQueryOptionsFactory) {
      return undefined;
    }
    return (groupConfig) => {
      const factory = groupFactoryRef.current;
      if (!factory) {
        throw new Error("groupQueryOptionsFactory ref is unexpectedly null");
      }
      return factory(groupConfig);
    };
  }, [Boolean(groupQueryOptionsFactory)]);

  const pagination = useMemo<InfinitePaginationController<TQueryOptions>>(
    () => ({
      columnQueryOptionsFactory: stableColumnFactory,
      groupQueryOptionsFactory: stableGroupFactory,
      queryOptionsFactory: stableFactory,
      type: "infinite",
    }),
    [stableColumnFactory, stableGroupFactory, stableFactory]
  );

  return { pagination };
}
