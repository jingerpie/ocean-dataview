"use client";

import type { CursorValue, Limit } from "@sparkyidea/shared/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DataViewProvider as DataViewProviderCore,
  type DataViewProviderProps,
} from "../lib/providers/data-view-provider";
import {
  type GroupCounts,
  GroupPaginationProvider,
  useGroupPaginationContext,
} from "../lib/providers/group-pagination-provider";
import type { DataViewProperty, ViewCounts } from "../types";
import { type UseGroupQueryResult, useGroupQuery } from "./use-group-query";

// ============================================================================
// Constants
// ============================================================================

export const FLAT_GROUP_KEY = "__all__";

// ============================================================================
// Types
// ============================================================================

/**
 * Query options compatible with TRPC's queryOptions return type.
 */
export interface PageQueryOptions {
  // biome-ignore lint/suspicious/noExplicitAny: TRPC returns complex QueryFunction types
  queryFn?: any;
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
 * Options for usePagePagination hook.
 */
export interface UsePagePaginationOptions<
  TQueryOptions extends PageQueryOptions,
> {
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
  /** Query factory - receives cursor, limit, and optionally groupKey (for grouped mode) */
  queryOptionsFactory: (
    cursor?: CursorValue,
    limit?: Limit,
    groupKey?: string
  ) => TQueryOptions;
}

/**
 * Props for the returned DataViewProvider (excludes auto-injected props).
 */
export type MergedDataViewProviderProps<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
> = Omit<
  DataViewProviderProps<TData, TProperties>,
  "data" | "pagination" | "expandedGroups" | "onExpandedGroupsChange" | "counts"
> & {
  /** Additional counts to merge (subGroup, etc.) */
  counts?: Omit<ViewCounts, "group" | "groupSortValues">;
};

/**
 * Result of usePagePagination hook.
 */
export interface UsePagePaginationResult<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
> {
  /** Merged DataViewProvider with pagination baked in */
  DataViewProvider: React.FC<MergedDataViewProviderProps<TData, TProperties>>;
  /** True when no data yet (for skeleton) */
  isEmpty: boolean;
  /** True when any group is loading */
  isLoading: boolean;
  /** True when showing stale data while refetching */
  isPlaceholderData: boolean;
}

// ============================================================================
// Internal State Types
// ============================================================================

interface InternalPaginationState<TData> {
  data: TData[];
  expandedGroups: string[];
  isPlaceholderData: boolean;
  pagination: PagePaginationState<TData>;
  setExpandedGroups: (groups: string[]) => void;
}

const noop = () => {
  /* no-op */
};

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * usePagePagination - Page-based pagination with merged DataViewProvider.
 *
 * Returns a DataViewProvider component that handles:
 * - Per-group queries with keepPreviousData for smooth transitions
 * - Automatic data/pagination injection
 * - No group limit (each group is a separate component)
 *
 * IMPORTANT: DataViewProvider MUST always render for queries to execute.
 * Put loading/empty states INSIDE the provider, not outside.
 *
 * @example
 * ```tsx
 * // Flat mode - groupKey not needed
 * const { DataViewProvider, isPlaceholderData, isLoading, isEmpty } = usePagePagination({
 *   queryOptionsFactory: (cursor, limit) =>
 *     trpc.product.getMany.queryOptions({ cursor, limit }),
 * });
 *
 * // Grouped mode - include groupKey
 * const { DataViewProvider } = usePagePagination({
 *   groupKeys: ['group1', 'group2'],
 *   queryOptionsFactory: (cursor, limit, groupKey) =>
 *     trpc.product.getManyByGroup.queryOptions({ groupKey, cursor, limit }),
 * });
 *
 * // CORRECT: DataViewProvider always renders, skeleton is inside
 * return (
 *   <DataViewProvider properties={productProperties} filter={filter}>
 *     {isLoading && isEmpty ? (
 *       <TableSkeleton />
 *     ) : (
 *       <div style={{ opacity: isPlaceholderData ? 0.7 : 1 }}>
 *         <TableView />
 *       </div>
 *     )}
 *   </DataViewProvider>
 * );
 *
 * // WRONG: This will cause infinite loading because queries never start
 * // if (isLoading && isEmpty) return <TableSkeleton />;
 * // return <DataViewProvider>...</DataViewProvider>;
 * ```
 */
export function usePagePagination<
  TData,
  TProperties extends
    readonly DataViewProperty<TData>[] = readonly DataViewProperty<TData>[],
  TQueryOptions extends PageQueryOptions = PageQueryOptions,
>(
  options: UsePagePaginationOptions<TQueryOptions>
): UsePagePaginationResult<TData, TProperties> {
  const {
    groupKeys = [FLAT_GROUP_KEY],
    defaultExpanded,
    defaultLimit = 10,
  } = options;

  // State synced from QueryBridge
  const [state, setState] = useState<InternalPaginationState<TData>>(() => ({
    data: [],
    pagination: {
      groups: [],
      isLoading: true,
      limit: defaultLimit,
      onLimitChange: noop,
    },
    isPlaceholderData: false,
    expandedGroups: defaultExpanded ?? groupKeys.slice(0, 1),
    setExpandedGroups: noop,
  }));

  // Stable ref for options (avoid recreating Provider on every render)
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Memoized DataViewProvider component
  const DataViewProvider = useMemo(() => {
    return function MergedDataViewProvider(
      props: MergedDataViewProviderProps<TData, TProperties>
    ) {
      const opts = optionsRef.current;
      return (
        <GroupPaginationProvider
          defaultExpanded={opts.defaultExpanded}
          defaultLimit={opts.defaultLimit}
          groupCounts={opts.groupCounts}
          groupKeys={opts.groupKeys ?? [FLAT_GROUP_KEY]}
          queryOptionsFactory={opts.queryOptionsFactory}
        >
          <QueryBridge<TData, TProperties>
            groupCounts={opts.groupCounts}
            groupSortValues={opts.groupSortValues}
            onStateChange={setState}
            viewProps={props}
          />
        </GroupPaginationProvider>
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

interface QueryBridgeProps<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
> {
  groupCounts?: GroupCounts;
  groupSortValues?: Record<string, string | number>;
  onStateChange: (state: InternalPaginationState<TData>) => void;
  viewProps: MergedDataViewProviderProps<TData, TProperties>;
}

/**
 * QueryBridge - Internal component that orchestrates per-group queries.
 *
 * Renders a GroupQueryRunner for each group, collects results,
 * and passes aggregated data to DataViewProviderCore.
 */
function QueryBridge<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
>({
  groupCounts,
  groupSortValues,
  onStateChange,
  viewProps,
}: QueryBridgeProps<TData, TProperties>) {
  const ctx = useGroupPaginationContext();
  const { expandedGroups, setExpandedGroups, limit, groupKeys } = ctx;

  // Map to collect query results from each GroupQueryRunner
  const [queryResults, setQueryResults] = useState<
    Map<string, UseGroupQueryResult<TData>>
  >(() => new Map());

  const handleQueryResult = useCallback(
    (groupKey: string, result: UseGroupQueryResult<TData>) => {
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
    const groups = groupKeys.map((key) => {
      const q = queryResults.get(key);
      const countInfo = groupCounts?.[key];
      return {
        key,
        items: q?.data ?? [],
        isLoading: q?.isPending ?? false,
        isFetching: q?.isFetching ?? false,
        hasNext: q?.hasNext ?? false,
        hasPrev: q?.hasPrev ?? false,
        onNext: q?.onNext ?? noop,
        onPrev: q?.onPrev ?? noop,
        displayStart: q?.displayStart ?? 0,
        displayEnd: q?.displayEnd ?? 0,
        count: countInfo?.count,
        displayCount: countInfo?.hasMore ? "99+" : undefined,
      };
    });

    const results = Array.from(queryResults.values());
    return {
      data: groups.flatMap((g) => g.items),
      pagination: {
        groups,
        isLoading: results.length === 0 || results.some((q) => q?.isFetching),
        limit,
        onLimitChange: results[0]?.onLimitChange ?? noop,
      },
      isPlaceholderData: results.some((q) => q?.isPlaceholderData),
    };
  }, [groupKeys, queryResults, groupCounts, limit]);

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

  // Merge counts
  const mergedCounts: ViewCounts = useMemo(
    () => ({
      group: groupCounts ?? {},
      groupSortValues: groupSortValues ?? {},
      ...viewProps.counts,
    }),
    [groupCounts, groupSortValues, viewProps.counts]
  );

  return (
    <>
      {groupKeys.map((key) => (
        <GroupQueryRunner<TData>
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

interface GroupQueryRunnerProps<TData> {
  groupKey: string;
  onResult: (groupKey: string, result: UseGroupQueryResult<TData>) => void;
}

/**
 * GroupQueryRunner - Invisible component that runs a single useGroupQuery.
 *
 * Each group gets its own component instance = its own hook call = no limit.
 */
function GroupQueryRunner<TData>({
  groupKey,
  onResult,
}: GroupQueryRunnerProps<TData>) {
  const result = useGroupQuery<TData>({ groupKey });

  useEffect(() => {
    onResult(groupKey, result);
  }, [groupKey, result, onResult]);

  return null;
}
