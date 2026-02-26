"use client";

import type { Limit } from "@sparkyidea/shared/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DataViewProvider as DataViewProviderCore,
  type DataViewProviderProps,
} from "../lib/providers/data-view-provider";
import {
  type GroupCounts,
  InfinitePaginationProvider,
  useInfinitePaginationContext,
} from "../lib/providers/infinite-pagination-provider";
import type { DataViewProperty, ViewCounts } from "../types";
import {
  type UseInfiniteGroupQueryResult,
  useInfiniteGroupQuery,
} from "./use-infinite-group-query";

// ============================================================================
// Constants
// ============================================================================

export const FLAT_GROUP_KEY = "__all__";

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
 * Options for useInfinitePagination hook.
 */
export interface UseInfinitePaginationOptions<
  TQueryOptions extends InfiniteQueryOptions,
> {
  /**
   * Property key for client-side grouping of flat data.
   * When set, items from a shared query will be filtered by this property
   * to match each group key. Use this for board views with getManyByGroup
   * where all columns share one query but need separate items per column.
   */
  clientSideGroupBy?: string;
  /** Initial expanded groups (defaults to first group) */
  defaultExpanded?: string[];
  /** Default page size (default: 10) */
  defaultLimit?: Limit;
  /** Optional group counts from server */
  groupCounts?: GroupCounts;
  /** Group keys - defaults to [FLAT_GROUP_KEY] for flat mode */
  groupKeys?: string[];
  /** Sort values for group ordering */
  groupSortValues?: Record<string, string | number>;
  /** Query factory - receives limit and optionally groupKey (for grouped mode) */
  queryOptionsFactory: (limit?: Limit, groupKey?: string) => TQueryOptions;
}

/**
 * Props for the returned DataViewProvider (excludes auto-injected props).
 */
export type MergedInfiniteDataViewProviderProps<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
> = Omit<
  DataViewProviderProps<TData, TProperties>,
  "data" | "pagination" | "expandedGroups" | "onExpandedGroupsChange" | "counts"
> & {
  /**
   * Optional counts for the view.
   * If provided, these take precedence over hook's groupCounts/groupSortValues.
   * Use this for board with subGroups where hook's groupKeys are rows but
   * view needs separate column and row counts.
   */
  counts?: Partial<ViewCounts>;
};

/**
 * Result of useInfinitePagination hook.
 */
export interface UseInfinitePaginationResult<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
> {
  /** Merged DataViewProvider with pagination baked in */
  DataViewProvider: React.FC<
    MergedInfiniteDataViewProviderProps<TData, TProperties>
  >;
  /** True when no data yet (for skeleton) */
  isEmpty: boolean;
  /** True when any group is loading */
  isLoading: boolean;
  /** True when showing stale data while refetching (for smooth transitions) */
  isPlaceholderData: boolean;
}

// ============================================================================
// Internal State Types
// ============================================================================

interface InternalInfinitePaginationState<TData> {
  data: TData[];
  expandedGroups: string[];
  isPlaceholderData: boolean;
  pagination: InfinitePaginationState<TData>;
  setExpandedGroups: (groups: string[]) => void;
}

const noop = () => {
  /* no-op */
};

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * useInfinitePagination - Infinite scroll pagination with merged DataViewProvider.
 *
 * Returns a DataViewProvider component that handles:
 * - Per-group infinite queries (useInfiniteQuery)
 * - Automatic data/pagination injection
 * - No group limit (each group is a separate component)
 *
 * IMPORTANT: DataViewProvider MUST always render for queries to execute.
 * Put loading/empty states INSIDE the provider, not outside.
 *
 * @example
 * ```tsx
 * // Flat mode - groupKey not needed
 * const { DataViewProvider, isLoading, isEmpty } = useInfinitePagination({
 *   queryOptionsFactory: (limit) =>
 *     trpc.product.getMany.infiniteQueryOptions({ limit }),
 * });
 *
 * // Grouped mode - include groupKey
 * const { DataViewProvider } = useInfinitePagination({
 *   groupKeys: ['group1', 'group2'],
 *   queryOptionsFactory: (limit, groupKey) =>
 *     trpc.product.getManyByGroup.infiniteQueryOptions({ groupKey, limit }),
 * });
 *
 * // CORRECT: DataViewProvider always renders, skeleton is inside
 * return (
 *   <DataViewProvider properties={productProperties} filter={filter}>
 *     {isLoading && isEmpty ? (
 *       <ListSkeleton />
 *     ) : (
 *       <ListView pagination="loadMore" />
 *     )}
 *   </DataViewProvider>
 * );
 * ```
 */
export function useInfinitePagination<
  TData,
  TProperties extends
    readonly DataViewProperty<TData>[] = readonly DataViewProperty<TData>[],
  TQueryOptions extends InfiniteQueryOptions = InfiniteQueryOptions,
>(
  options: UseInfinitePaginationOptions<TQueryOptions>
): UseInfinitePaginationResult<TData, TProperties> {
  const { defaultExpanded, defaultLimit = 10 } = options;

  // State synced from QueryBridge
  const [state, setState] = useState<InternalInfinitePaginationState<TData>>(
    () => ({
      data: [],
      pagination: {
        groups: [],
        isLoading: true,
        limit: defaultLimit,
        onLimitChange: noop,
      },
      expandedGroups: defaultExpanded ?? [],
      isPlaceholderData: false,
      setExpandedGroups: noop,
    })
  );

  // Stable ref for options (avoid recreating Provider on every render)
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Memoized DataViewProvider component
  const DataViewProvider = useMemo(() => {
    return function MergedInfiniteDataViewProvider(
      props: MergedInfiniteDataViewProviderProps<TData, TProperties>
    ) {
      const opts = optionsRef.current;
      return (
        <InfinitePaginationProvider
          defaultExpanded={opts.defaultExpanded}
          defaultLimit={opts.defaultLimit}
          groupCounts={opts.groupCounts}
          groupKeys={opts.groupKeys ?? [FLAT_GROUP_KEY]}
          queryOptionsFactory={opts.queryOptionsFactory}
        >
          <InfiniteQueryBridge<TData, TProperties>
            clientSideGroupBy={opts.clientSideGroupBy}
            groupCounts={opts.groupCounts}
            groupSortValues={opts.groupSortValues}
            onStateChange={setState}
            viewProps={props}
          />
        </InfinitePaginationProvider>
      );
    };
  }, []);

  return {
    DataViewProvider,
    isEmpty: state.data.length === 0,
    isLoading: state.pagination.isLoading,
    isPlaceholderData: state.isPlaceholderData,
  };
}

// ============================================================================
// Internal Components
// ============================================================================

interface InfiniteQueryBridgeProps<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
> {
  clientSideGroupBy?: string;
  groupCounts?: GroupCounts;
  groupSortValues?: Record<string, string | number>;
  onStateChange: (state: InternalInfinitePaginationState<TData>) => void;
  viewProps: MergedInfiniteDataViewProviderProps<TData, TProperties>;
}

/**
 * InfiniteQueryBridge - Internal component that orchestrates per-group infinite queries.
 *
 * Renders an InfiniteGroupQueryRunner for each group, collects results,
 * and passes aggregated data to DataViewProviderCore.
 */
function InfiniteQueryBridge<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
>({
  clientSideGroupBy,
  groupCounts,
  groupSortValues,
  onStateChange,
  viewProps,
}: InfiniteQueryBridgeProps<TData, TProperties>) {
  const ctx = useInfinitePaginationContext();
  const { expandedGroups, setExpandedGroups, limit, groupKeys } = ctx;

  // Map to collect query results from each InfiniteGroupQueryRunner
  const [queryResults, setQueryResults] = useState<
    Map<string, UseInfiniteGroupQueryResult<TData>>
  >(() => new Map());

  const handleQueryResult = useCallback(
    (groupKey: string, result: UseInfiniteGroupQueryResult<TData>) => {
      setQueryResults((prev) => {
        const next = new Map(prev);
        next.set(groupKey, result);
        return next;
      });
    },
    []
  );

  // Build pagination state from collected results
  const { data, pagination, isPlaceholderData } = useMemo(() => {
    // For client-side grouping, collect all items from all queries (deduped)
    const allItems: TData[] = [];
    const seenItems = new Set<TData>();
    for (const result of queryResults.values()) {
      for (const item of result?.data ?? []) {
        if (!seenItems.has(item)) {
          seenItems.add(item);
          allItems.push(item);
        }
      }
    }

    const groups = groupKeys.map((key) => {
      const q = queryResults.get(key);
      const countInfo = groupCounts?.[key];

      // Filter items for this group if clientSideGroupBy is set
      let items = q?.data ?? [];
      if (clientSideGroupBy && allItems.length > 0) {
        items = allItems.filter(
          (item) => (item as Record<string, unknown>)[clientSideGroupBy] === key
        );
      }

      return {
        key,
        items,
        isLoading: q?.isPending ?? false,
        isError: q?.isError ?? false,
        isFetching: q?.isFetching ?? false,
        isFetchingNextPage: q?.isFetchingNextPage ?? false,
        hasNext: q?.hasNextPage ?? false,
        onNext: q?.onLoadMore ?? noop,
        totalLoaded: items.length,
        error: q?.error ?? null,
        count: countInfo?.count,
        displayCount: countInfo?.hasMore ? "99+" : undefined,
      };
    });

    const results = Array.from(queryResults.values());
    return {
      data: clientSideGroupBy ? allItems : groups.flatMap((g) => g.items),
      pagination: {
        groups,
        isLoading: results.length === 0 || results.some((q) => q?.isFetching),
        limit,
        onLimitChange: results[0]?.onLimitChange ?? noop,
      },
      isPlaceholderData: results.some((q) => q?.isPlaceholderData),
    };
  }, [groupKeys, queryResults, groupCounts, limit, clientSideGroupBy]);

  // Sync state to parent hook
  useEffect(() => {
    onStateChange({
      data,
      pagination,
      isPlaceholderData,
      expandedGroups,
      setExpandedGroups,
    });
  }, [
    data,
    pagination,
    isPlaceholderData,
    expandedGroups,
    setExpandedGroups,
    onStateChange,
  ]);

  // Merge counts - viewProps.counts takes precedence over hook's groupCounts
  const mergedCounts: ViewCounts = useMemo(
    () => ({
      group: viewProps.counts?.group ?? groupCounts ?? {},
      groupSortValues:
        viewProps.counts?.groupSortValues ?? groupSortValues ?? {},
      subGroup: viewProps.counts?.subGroup,
      subGroupSortValues: viewProps.counts?.subGroupSortValues,
    }),
    [groupCounts, groupSortValues, viewProps.counts]
  );

  return (
    <>
      {groupKeys.map((key) => (
        <InfiniteGroupQueryRunner<TData>
          groupKey={key}
          key={key}
          onResult={handleQueryResult}
        />
      ))}
      <DataViewProviderCore<TData, TProperties>
        {...(viewProps as DataViewProviderProps<TData, TProperties>)}
        counts={mergedCounts}
        data={data}
        expandedGroups={expandedGroups}
        onExpandedGroupsChange={setExpandedGroups}
        pagination={pagination}
      />
    </>
  );
}

interface InfiniteGroupQueryRunnerProps<TData> {
  groupKey: string;
  onResult: (
    groupKey: string,
    result: UseInfiniteGroupQueryResult<TData>
  ) => void;
}

/**
 * InfiniteGroupQueryRunner - Invisible component that runs a single useInfiniteGroupQuery.
 *
 * Each group gets its own component instance = its own hook call = no limit.
 */
function InfiniteGroupQueryRunner<TData>({
  groupKey,
  onResult,
}: InfiniteGroupQueryRunnerProps<TData>) {
  const result = useInfiniteGroupQuery<TData>({ groupKey });

  useEffect(() => {
    onResult(groupKey, result);
  }, [groupKey, result, onResult]);

  return null;
}
