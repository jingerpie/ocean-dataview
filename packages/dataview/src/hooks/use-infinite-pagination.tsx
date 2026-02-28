"use client";

import type { Limit } from "@sparkyidea/shared/types/pagination.type";
import type { GroupConfigInput } from "@sparkyidea/shared/utils/parsers/group";
import { useCallback, useMemo, useRef } from "react";
import type {
  InfinitePaginationController,
  InfiniteQueryOptionsFactory,
} from "../types/pagination-controller";

// ============================================================================
// Types
// ============================================================================

/**
 * Query options compatible with TRPC's infiniteQueryOptions return type.
 */
export interface InfiniteQueryOptions {
  // biome-ignore lint/suspicious/noExplicitAny: TRPC returns complex types
  getNextPageParam?: any;
  // biome-ignore lint/suspicious/noExplicitAny: TRPC returns complex types
  initialPageParam?: any;
  // biome-ignore lint/suspicious/noExplicitAny: TRPC returns complex types
  queryFn?: any;
  queryKey: readonly unknown[];
}

/**
 * Per-group pagination info for DataViewProvider.
 */
export interface InfiniteGroupInfo<TData> {
  count?: number;
  displayCount?: string;
  error: Error | null;
  hasNext: boolean | Record<string, boolean>;
  isError: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  isLoading: boolean;
  items: TData[];
  key: string;
  onNext: () => void;
  totalLoaded: number;
}

/**
 * Pagination state for DataViewProvider.
 */
export interface InfinitePaginationState<TData> {
  groups: InfiniteGroupInfo<TData>[];
  isLoading: boolean;
  limit: Limit;
  onLimitChange: (limit: Limit) => void;
}

/**
 * Re-export types for convenience.
 */
export type { SortQuery, WhereNode } from "@sparkyidea/shared/types";
export type { GroupConfigInput } from "@sparkyidea/shared/utils/parsers/group";
export type {
  GroupQueryOptionsFactory,
  InfiniteQueryOptionsFactory,
  InfiniteQueryOptionsFactoryParams,
} from "../types/pagination-controller";

/**
 * Base query options for group queries (minimal interface).
 */
interface BaseGroupQueryOptions {
  queryFn?: unknown;
  queryKey: readonly unknown[];
}

/**
 * Options for useInfinitePagination hook.
 *
 * Contains query configuration only. Defaults are passed to DataViewProvider.
 */
export interface UseInfinitePaginationOptions<
  TQueryOptions extends InfiniteQueryOptions = InfiniteQueryOptions,
> {
  /**
   * Factory for fetching group counts (enables grouped mode).
   * Called by QueryBridge when group URL param is set.
   * Returns BaseGroupQueryOptions since group queries have different return shapes.
   */
  groupQueryOptionsFactory?: (
    groupConfig: GroupConfigInput
  ) => BaseGroupQueryOptions;

  /**
   * Factory for fetching data items.
   * Receives groupConfig and groupKey in params for building group filters.
   */
  queryOptionsFactory: InfiniteQueryOptionsFactory<TQueryOptions>;

  /**
   * Factory for fetching subGroup counts (board-specific).
   * Called by QueryBridge when subGroup URL param is set.
   * Enables automatic subGroup count fetching for board views.
   */
  subGroupQueryOptionsFactory?: (
    subGroupConfig: GroupConfigInput
  ) => BaseGroupQueryOptions;
}

/**
 * Result of useInfinitePagination hook.
 */
export interface UseInfinitePaginationResult<TQueryOptions> {
  /** Pagination config to pass to DataViewProvider */
  pagination: InfinitePaginationController<TQueryOptions>;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * useInfinitePagination - Infinite scroll pagination hook that returns a config object.
 *
 * Returns a pagination config that should be passed to DataViewProvider.
 * The config contains queryOptionsFactory and optional groupQueryOptionsFactory.
 * Defaults are passed to DataViewProvider via the `defaults` prop.
 * Actual URL state (filter, sort, search, expanded, group) is managed by QueryBridge.
 *
 * @example
 * ```tsx
 * const { pagination } = useInfinitePagination({
 *   // Optional: enables grouped mode when group URL param is set
 *   groupQueryOptionsFactory: (groupConfig) =>
 *     trpc.product.getGroup.queryOptions({ groupBy: groupConfig }),
 *
 *   // Required: factory for data queries
 *   queryOptionsFactory: (params) =>
 *     trpc.product.getMany.infiniteQueryOptions({
 *       filter: params.groupConfig
 *         ? combineGroupFilter(params.groupConfig, params.groupKey, params.filter)
 *         : params.filter,
 *       limit: params.limit,
 *       ...
 *     }),
 * });
 *
 * return (
 *   <DataViewProvider
 *     defaults={{ limit, filter, sort, search, group }}
 *     pagination={pagination}
 *     properties={productProperties}
 *   >
 *     <ListContent />
 *   </DataViewProvider>
 * );
 * ```
 */
export function useInfinitePagination<
  TQueryOptions extends InfiniteQueryOptions = InfiniteQueryOptions,
>(
  options: UseInfinitePaginationOptions<TQueryOptions>
): UseInfinitePaginationResult<TQueryOptions> {
  const {
    groupQueryOptionsFactory,
    queryOptionsFactory,
    subGroupQueryOptionsFactory,
  } = options;

  // Stable queryOptionsFactory via ref (prevents unnecessary re-renders)
  const factoryRef = useRef(queryOptionsFactory);
  factoryRef.current = queryOptionsFactory;
  const stableFactory = useCallback<InfiniteQueryOptionsFactory<TQueryOptions>>(
    (params) => factoryRef.current(params),
    []
  );

  // Stable groupQueryOptionsFactory via ref
  const groupFactoryRef = useRef(groupQueryOptionsFactory);
  groupFactoryRef.current = groupQueryOptionsFactory;
  const stableGroupFactory = useMemo<
    ((groupConfig: GroupConfigInput) => BaseGroupQueryOptions) | undefined
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
    // Only re-create if factory existence changes
  }, [Boolean(groupQueryOptionsFactory)]);

  // Stable subGroupQueryOptionsFactory via ref
  const subGroupFactoryRef = useRef(subGroupQueryOptionsFactory);
  subGroupFactoryRef.current = subGroupQueryOptionsFactory;
  const stableSubGroupFactory = useMemo<
    ((subGroupConfig: GroupConfigInput) => BaseGroupQueryOptions) | undefined
  >(() => {
    if (!subGroupQueryOptionsFactory) {
      return undefined;
    }
    return (subGroupConfig) => {
      const factory = subGroupFactoryRef.current;
      if (!factory) {
        throw new Error("subGroupQueryOptionsFactory ref is unexpectedly null");
      }
      return factory(subGroupConfig);
    };
    // Only re-create if factory existence changes
  }, [Boolean(subGroupQueryOptionsFactory)]);

  // Build config object (stable when inputs don't change)
  const pagination = useMemo<InfinitePaginationController<TQueryOptions>>(
    () => ({
      groupQueryOptionsFactory: stableGroupFactory,
      queryOptionsFactory: stableFactory,
      subGroupQueryOptionsFactory: stableSubGroupFactory,
      type: "infinite",
    }),
    [stableGroupFactory, stableFactory, stableSubGroupFactory]
  );

  return { pagination };
}
