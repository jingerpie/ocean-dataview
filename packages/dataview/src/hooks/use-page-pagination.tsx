"use client";

import type { Limit } from "@sparkyidea/shared/types/pagination.type";
import type { GroupConfigInput } from "@sparkyidea/shared/utils/parsers/group";
import { useCallback, useMemo, useRef } from "react";
import type {
  PagePaginationController,
  PageQueryOptionsFactory,
} from "../types/pagination-controller";

// ============================================================================
// Types
// ============================================================================

/**
 * Query options compatible with TRPC's queryOptions return type.
 */
export interface PageQueryOptions {
  queryFn?: unknown;
  queryKey: readonly unknown[];
}

/**
 * Per-group pagination info for DataViewProvider.
 */
export interface PageGroupInfo<TData> {
  count?: number;
  displayCount?: string;
  displayEnd: number;
  displayStart: number;
  hasNext: boolean;
  hasPrev: boolean;
  isFetching: boolean;
  isLoading: boolean;
  items: TData[];
  key: string;
  onNext: () => void;
  onPrev: () => void;
}

/**
 * Pagination state for DataViewProvider.
 */
export interface PagePaginationState<TData> {
  groups: PageGroupInfo<TData>[];
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
  PageQueryOptionsFactory,
  PageQueryOptionsFactoryParams,
} from "../types/pagination-controller";

/**
 * Options for usePagePagination hook.
 *
 * Contains query configuration only. Defaults are passed to DataViewProvider.
 */
export interface UsePagePaginationOptions<
  TQueryOptions extends PageQueryOptions = PageQueryOptions,
> {
  /**
   * Factory for fetching group counts (enables grouped mode).
   * Called by QueryBridge when group URL param is set.
   * Returns PageQueryOptions (base type) since group queries have different return shapes.
   */
  groupQueryOptionsFactory?: (
    groupConfig: GroupConfigInput
  ) => PageQueryOptions;

  /**
   * Factory for fetching data items.
   * Receives groupConfig and groupKey in params for building group filters.
   */
  queryOptionsFactory: PageQueryOptionsFactory<TQueryOptions>;

  /**
   * Factory for fetching subGroup counts (board-specific).
   * Called by QueryBridge when subGroup URL param is set.
   * Enables automatic subGroup count fetching for board views.
   */
  subGroupQueryOptionsFactory?: (
    subGroupConfig: GroupConfigInput
  ) => PageQueryOptions;
}

/**
 * Result of usePagePagination hook.
 */
export interface UsePagePaginationResult<TQueryOptions> {
  /** Pagination config to pass to DataViewProvider */
  pagination: PagePaginationController<TQueryOptions>;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * usePagePagination - Page-based pagination hook that returns a config object.
 *
 * Returns a pagination config that should be passed to DataViewProvider.
 * The config contains queryOptionsFactory and optional groupQueryOptionsFactory.
 * Defaults are passed to DataViewProvider via the `defaults` prop.
 * Actual URL state (filter, sort, search, cursors, group) is managed by QueryBridge.
 *
 * @example
 * ```tsx
 * const { pagination } = usePagePagination({
 *   // Optional: enables grouped mode when group URL param is set
 *   groupQueryOptionsFactory: (groupConfig) =>
 *     trpc.product.getGroup.queryOptions({ groupBy: groupConfig }),
 *
 *   // Required: factory for data queries
 *   queryOptionsFactory: (params) =>
 *     trpc.product.getMany.queryOptions({
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
 *     <TableContent />
 *   </DataViewProvider>
 * );
 * ```
 */
export function usePagePagination<
  TQueryOptions extends PageQueryOptions = PageQueryOptions,
>(
  options: UsePagePaginationOptions<TQueryOptions>
): UsePagePaginationResult<TQueryOptions> {
  const {
    groupQueryOptionsFactory,
    queryOptionsFactory,
    subGroupQueryOptionsFactory,
  } = options;

  // Stable queryOptionsFactory via ref (prevents unnecessary re-renders)
  const factoryRef = useRef(queryOptionsFactory);
  factoryRef.current = queryOptionsFactory;
  const stableFactory = useCallback<PageQueryOptionsFactory<TQueryOptions>>(
    (params) => factoryRef.current(params),
    []
  );

  // Stable groupQueryOptionsFactory via ref
  const groupFactoryRef = useRef(groupQueryOptionsFactory);
  groupFactoryRef.current = groupQueryOptionsFactory;
  const stableGroupFactory = useMemo<
    ((groupConfig: GroupConfigInput) => PageQueryOptions) | undefined
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
    ((subGroupConfig: GroupConfigInput) => PageQueryOptions) | undefined
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
  const pagination = useMemo<PagePaginationController<TQueryOptions>>(
    () => ({
      groupQueryOptionsFactory: stableGroupFactory,
      queryOptionsFactory: stableFactory,
      subGroupQueryOptionsFactory: stableSubGroupFactory,
      type: "page",
    }),
    [stableGroupFactory, stableFactory, stableSubGroupFactory]
  );

  return { pagination };
}
