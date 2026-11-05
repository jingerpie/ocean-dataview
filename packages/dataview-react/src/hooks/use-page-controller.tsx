"use client";

import type {
  BaseQueryOptions,
  GroupConfigInput,
  InfiniteGroupQueryOptions,
  Limit,
  PageController,
  PageQueryOptionsFactory,
  SearchQuery,
  WhereNode,
} from "@sparkyidea/dataview-core";
import { useCallback, useMemo, useRef } from "react";

export interface PageGroupInfo<TData> {
  count?: number;
  displayCount?: string;
  displayEnd: number;
  displayStart: number;
  hasNext: boolean;
  hasPrev: boolean;
  isFetching: boolean;
  items: TData[];
  key: string;
  onNext: () => void;
  onPrev: () => void;
}

export interface PagePaginationState<TData> {
  groups: PageGroupInfo<TData>[];
  limit: Limit;
  onLimitChange: (limit: Limit) => void;
}

export type {
  GroupQueryOptionsFactory,
  PageQueryOptionsFactory,
  PageQueryOptionsFactoryParams,
} from "@sparkyidea/dataview-core";

export interface UsePageControllerOptions<
  TQueryOptions extends BaseQueryOptions = BaseQueryOptions,
> {
  /** Factory for fetching column counts (board-specific) */
  columnQuery?: (params: {
    filter: WhereNode[] | null;
    groupBy: GroupConfigInput;
    hideEmpty: boolean;
    search: SearchQuery | null;
  }) => BaseQueryOptions;
  /** Factory for fetching data items */
  dataQuery: PageQueryOptionsFactory<TQueryOptions>;
  /** Factory for fetching group counts with pagination (accordion rows) */
  groupQuery?: (params: {
    filter: WhereNode[] | null;
    groupBy: GroupConfigInput;
    hideEmpty: boolean;
    search: SearchQuery | null;
    sort?: "asc" | "desc";
  }) => InfiniteGroupQueryOptions;
}

export interface UsePageControllerResult<TQueryOptions> {
  controller: PageController<TQueryOptions>;
}

export function usePageController<
  TQueryOptions extends BaseQueryOptions = BaseQueryOptions,
>(
  options: UsePageControllerOptions<TQueryOptions>
): UsePageControllerResult<TQueryOptions> {
  const { columnQuery, dataQuery, groupQuery } = options;

  const dataQueryRef = useRef(dataQuery);
  dataQueryRef.current = dataQuery;
  const stableDataQuery = useCallback<PageQueryOptionsFactory<TQueryOptions>>(
    (params) => dataQueryRef.current(params),
    []
  );

  // Stable column factory (board-specific)
  const hasColumnQuery = Boolean(columnQuery);
  const columnQueryRef = useRef(columnQuery);
  columnQueryRef.current = columnQuery;
  const stableColumnQuery = useMemo<
    | ((params: {
        filter: WhereNode[] | null;
        groupBy: GroupConfigInput;
        hideEmpty: boolean;
        search: SearchQuery | null;
      }) => BaseQueryOptions)
    | undefined
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
  const stableGroupQuery = useMemo<
    | ((params: {
        filter: WhereNode[] | null;
        groupBy: GroupConfigInput;
        hideEmpty: boolean;
        search: SearchQuery | null;
        sort?: "asc" | "desc";
      }) => InfiniteGroupQueryOptions)
    | undefined
  >(() => {
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

  const controller = useMemo<PageController<TQueryOptions>>(
    () => ({
      columnQuery: stableColumnQuery,
      dataQuery: stableDataQuery,
      groupQuery: stableGroupQuery,
      type: "page",
    }),
    [stableColumnQuery, stableDataQuery, stableGroupQuery]
  );

  return { controller };
}
