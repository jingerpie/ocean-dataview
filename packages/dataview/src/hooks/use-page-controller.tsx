"use client";

import type { GroupConfigInput, Limit } from "@sparkyidea/shared/types";
import { useCallback, useMemo, useRef } from "react";
import type {
  BaseQueryOptions,
  InfiniteGroupQueryOptions,
  PageController,
  PageQueryOptionsFactory,
} from "../types/pagination-controller";

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
} from "../types/pagination-controller";

export interface UsePageControllerOptions<
  TQueryOptions extends BaseQueryOptions = BaseQueryOptions,
> {
  /** Factory for fetching column counts (board-specific) */
  columnQuery?: (params: {
    columnConfig: GroupConfigInput;
    filter: import("@sparkyidea/shared/types").WhereNode[] | null;
    hideEmpty: boolean;
    search: string;
  }) => BaseQueryOptions;
  /** Factory for fetching data items */
  dataQuery: PageQueryOptionsFactory<TQueryOptions>;
  /** Factory for fetching group counts with pagination (accordion rows) */
  groupQuery?: (params: {
    filter: import("@sparkyidea/shared/types").WhereNode[] | null;
    groupConfig: GroupConfigInput;
    hideEmpty: boolean;
    search: string;
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
