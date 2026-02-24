"use client";

import type { Limit } from "@sparkyidea/shared/types";
import { parseAsExpanded } from "@sparkyidea/shared/utils/parsers/pagination";
import {
  type InfiniteData,
  type UseInfiniteQueryResult,
  type UseSuspenseInfiniteQueryResult,
  useInfiniteQuery,
  useSuspenseInfiniteQuery,
} from "@tanstack/react-query";
import { parseAsInteger, useQueryState } from "nuqs";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import type { BasePaginatedResponse } from "../types/pagination-types";

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_MAX_GROUPS = 50;
const FLAT_GROUP_KEY = "__all__";

// ============================================================================
// Types
// ============================================================================

/**
 * Query options for infinite query.
 * Compatible with TRPC's infiniteQueryOptions return type.
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
 * Group configuration for grouped mode
 */
export interface GroupByOptions {
  /** All group keys in stable order */
  allGroupKeys: string[];
  /** Currently expanded groups */
  expanded: string[];
}

/**
 * Input options for useInfinitePagination hook.
 */
export interface UseInfinitePaginationOptions<
  TQueryOptions extends InfiniteQueryOptions,
> {
  /**
   * Group configuration (optional)
   * - When undefined: flat mode (single "__all__" group)
   * - When defined: grouped mode with per-group pagination
   */
  groupBy?: GroupByOptions;
  /** Items per page */
  limit: Limit;

  /** Max groups to support (default: 50) */
  maxGroups?: number;

  /**
   * Query options factory
   * - Receives "__all__" for flat mode
   * - Receives actual group keys ("A", "B", etc.) for grouped mode
   */
  queryOptions: (groupKey: string) => TQueryOptions;
}

/**
 * Per-group pagination info
 */
export interface GroupInfo<TData> {
  error: unknown;
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
 * Pagination state for DataViewProvider
 */
export interface InfinitePaginationState<TData> {
  /** Per-group info (single group for flat mode) */
  groups: GroupInfo<TData>[];
  /** Whether any group is loading */
  isLoading: boolean;
  /** Items per page */
  limit: Limit;
  /** Handler for limit changes */
  onLimitChange: (limit: Limit) => void;
}

/**
 * Output type for useInfinitePagination hook
 */
export interface InfinitePaginationResult<TData> {
  /** Flattened data from all groups */
  data: TData[];
  /** Current expanded groups (empty for flat mode) */
  expandedGroups: string[];
  /** Handler for accordion expand/collapse (no-op for flat mode) */
  handleAccordionChange: (newExpanded: string[]) => void;
  /** Pagination state for DataViewProvider */
  pagination: InfinitePaginationState<TData>;
}

/**
 * Output type for useSuspenseInfinitePagination hook
 * Same as InfinitePaginationResult but data is always available (suspends until ready)
 */
export interface SuspenseInfinitePaginationResult<TData> {
  /** Flattened data from all groups */
  data: TData[];
  /** Current expanded groups (empty for flat mode) */
  expandedGroups: string[];
  /** Handler for accordion expand/collapse (no-op for flat mode) */
  handleAccordionChange: (newExpanded: string[]) => void;
  /** Pagination state for DataViewProvider */
  pagination: InfinitePaginationState<TData>;
}

/**
 * Internal query result shape for processing
 */
interface InfiniteQueryResultLike<TData> {
  data?: InfiniteData<BasePaginatedResponse<TData>>;
  error?: unknown;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isError: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  isLoading: boolean;
}

// ============================================================================
// Shared State Hook
// ============================================================================

interface SharedInfinitePaginationState {
  allGroupKeys: string[];
  enabledKeys: string[];
  fetchedGroups: Set<string>;
  handleAccordionChange: (newExpanded: string[]) => void;
  isGrouped: boolean;
  limit: Limit;
  localExpanded: string[];
  maxGroups: number;
  onLimitChange: (limit: Limit) => void;
}

/**
 * Shared state management for infinite pagination hooks.
 * Handles expanded state, fetched groups tracking, and URL state.
 */
function useInfinitePaginationState<TQueryOptions extends InfiniteQueryOptions>(
  options: UseInfinitePaginationOptions<TQueryOptions>
): SharedInfinitePaginationState {
  const { limit, groupBy, maxGroups = DEFAULT_MAX_GROUPS } = options;

  // Determine mode: flat vs grouped
  const isGrouped = groupBy != null;
  const allGroupKeys = isGrouped ? groupBy.allGroupKeys : [FLAT_GROUP_KEY];
  const initialExpanded = isGrouped ? groupBy.expanded : [FLAT_GROUP_KEY];

  // For flat mode, always "expand" the single group
  // For grouped mode, use provided expanded state
  const [localExpanded, setLocalExpanded] = useState(initialExpanded);
  const isInternalChange = useRef(false);

  // Track groups that have been fetched (for cache preservation)
  const [fetchedGroups, setFetchedGroups] = useState<Set<string>>(
    () => new Set(initialExpanded)
  );

  // Sync from props on external changes
  useEffect(() => {
    if (!isInternalChange.current) {
      const newExpanded = isGrouped ? groupBy.expanded : [FLAT_GROUP_KEY];
      setLocalExpanded(newExpanded);
      setFetchedGroups((prev) => {
        const next = new Set(prev);
        for (const key of newExpanded) {
          next.add(key);
        }
        return next;
      });
    }
    isInternalChange.current = false;
  }, [isGrouped, groupBy?.expanded]);

  const [, startTransition] = useTransition();

  // URL state for expanded groups
  const [, setExpanded] = useQueryState(
    "expanded",
    parseAsExpanded.withOptions({ shallow: false })
  );

  // URL state for limit
  const [, setUrlLimit] = useQueryState(
    "limit",
    parseAsInteger.withOptions({ shallow: false })
  );

  // Determine which keys should have enabled queries
  // For flat mode: always enable "__all__"
  // For grouped mode: enable expanded groups
  const enabledKeys = isGrouped ? localExpanded : [FLAT_GROUP_KEY];

  // Limit change handler
  const onLimitChange = useCallback(
    (newLimit: Limit) => {
      startTransition(() => {
        setUrlLimit(newLimit);
      });
    },
    [setUrlLimit]
  );

  // Accordion change handler (no-op for flat mode)
  const handleAccordionChange = useCallback(
    (newExpanded: string[]) => {
      if (!isGrouped) {
        return; // No-op for flat mode
      }

      setLocalExpanded(newExpanded);
      isInternalChange.current = true;

      setFetchedGroups((prev) => {
        const next = new Set(prev);
        for (const key of newExpanded) {
          next.add(key);
        }
        return next;
      });

      startTransition(() => {
        setExpanded(newExpanded.length > 0 ? newExpanded : null);
      });
    },
    [isGrouped, setExpanded]
  );

  return {
    allGroupKeys,
    enabledKeys,
    fetchedGroups,
    handleAccordionChange,
    isGrouped,
    limit,
    localExpanded,
    maxGroups,
    onLimitChange,
  };
}

// ============================================================================
// Internal: Pagination Helpers
// ============================================================================

/**
 * Default getNextPageParam for infinite queries.
 */
const defaultGetNextPageParam = (
  lastPage: BasePaginatedResponse<unknown>
): string | undefined =>
  lastPage.hasNextPage && lastPage.endCursor
    ? String(lastPage.endCursor)
    : undefined;

const placeholderQueryFn = async () =>
  ({
    items: [],
    hasNextPage: false,
  }) as BasePaginatedResponse<unknown>;

/**
 * Creates fixed number of infinite queries to satisfy React hooks rules.
 * Always calls maxGroups hooks, using enabled flag to control which run.
 */
function useFixedInfinitePagination(
  state: SharedInfinitePaginationState,
  createQueryOptions: (groupKey: string) => InfiniteQueryOptions
): UseInfiniteQueryResult<
  InfiniteData<BasePaginatedResponse<unknown>>,
  Error
>[] {
  const { allGroupKeys, enabledKeys, fetchedGroups, maxGroups } = state;

  const queries: UseInfiniteQueryResult<
    InfiniteData<BasePaginatedResponse<unknown>>,
    Error
  >[] = [];

  for (let i = 0; i < maxGroups; i++) {
    const groupKey = allGroupKeys[i];
    const isEnabled =
      groupKey != null &&
      (enabledKeys.includes(groupKey) || fetchedGroups.has(groupKey));

    const options = groupKey
      ? createQueryOptions(groupKey)
      : { queryKey: ["__placeholder", i] as const };

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const query = useInfiniteQuery({
      queryKey: options.queryKey,
      queryFn: options.queryFn ?? placeholderQueryFn,
      getNextPageParam:
        (options.getNextPageParam as typeof defaultGetNextPageParam) ??
        defaultGetNextPageParam,
      initialPageParam: options.initialPageParam,
      enabled: isEnabled,
    });

    queries.push(query);
  }

  return queries;
}

/**
 * Creates fixed number of suspense infinite queries to satisfy React hooks rules.
 * Always calls maxGroups hooks. Suspends until data is ready.
 */
function useFixedSuspenseInfinitePagination(
  state: SharedInfinitePaginationState,
  createQueryOptions: (groupKey: string) => InfiniteQueryOptions
): UseSuspenseInfiniteQueryResult<
  InfiniteData<BasePaginatedResponse<unknown>>,
  Error
>[] {
  const { allGroupKeys, maxGroups } = state;

  const queries: UseSuspenseInfiniteQueryResult<
    InfiniteData<BasePaginatedResponse<unknown>>,
    Error
  >[] = [];

  for (let i = 0; i < maxGroups; i++) {
    const groupKey = allGroupKeys[i];

    const options = groupKey
      ? createQueryOptions(groupKey)
      : { queryKey: ["__placeholder", i] as const };

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const query = useSuspenseInfiniteQuery({
      queryKey: options.queryKey,
      queryFn: options.queryFn ?? placeholderQueryFn,
      getNextPageParam:
        (options.getNextPageParam as typeof defaultGetNextPageParam) ??
        defaultGetNextPageParam,
      initialPageParam: options.initialPageParam,
    });

    queries.push(query);
  }

  return queries;
}

// ============================================================================
// Result Processing
// ============================================================================

/**
 * Process infinite query results into pagination result
 */
function processInfiniteResults<TData>(
  queries: InfiniteQueryResultLike<TData>[],
  state: SharedInfinitePaginationState
): {
  data: TData[];
  groups: GroupInfo<TData>[];
  isLoading: boolean;
} {
  const { allGroupKeys, localExpanded } = state;

  const groups = allGroupKeys.map((groupKey, index) => {
    const query = queries[index];
    const isExpanded = localExpanded.includes(groupKey);

    const items = (query?.data?.pages?.flatMap((page) => page.items) ??
      []) as TData[];

    const lastPage = query?.data?.pages?.at(-1);
    const hasNext = lastPage?.hasNextPage ?? false;

    const group: GroupInfo<TData> = {
      key: groupKey,
      items,
      hasNext,
      totalLoaded: items.length,
      isFetchingNextPage: query?.isFetchingNextPage ?? false,
      isLoading: query?.isLoading ?? false,
      isFetching: isExpanded && (query?.isFetching ?? false),
      error: query?.error,
      isError: query?.isError ?? false,
      onNext: () => {
        if (query?.hasNextPage && !query?.isFetchingNextPage) {
          query.fetchNextPage();
        }
      },
    };

    return group;
  });

  const data = groups.flatMap((g) => g.items);
  const isLoading = queries.some((q) => q?.isFetching);

  return { data, groups, isLoading };
}

// ============================================================================
// useInfinitePagination (Non-Suspense)
// ============================================================================

/**
 * Hook for infinite scroll / load-more pagination with loading states.
 * Handles both flat and grouped modes with a single API.
 *
 * Uses `useInfiniteQuery` internally which returns loading states.
 * Use this for client-side rendering where you want to show loading spinners.
 *
 * For SSR/prefetch scenarios where data should be ready before render,
 * use `useSuspenseInfinitePagination` instead.
 *
 * @example
 * ```tsx
 * // Client-only page with loading spinner
 * function ProductListClient() {
 *   const { data, pagination } = useInfinitePagination({
 *     limit: 10,
 *     queryOptions: (groupKey) =>
 *       trpc.product.getMany.infiniteQueryOptions({ limit: 10 }),
 *   });
 *
 *   if (pagination.isLoading) return <Spinner />;
 *   return <List data={data} pagination={pagination} />;
 * }
 * ```
 */
export function useInfinitePagination<
  TQueryOptions extends InfiniteQueryOptions,
  TData = unknown,
>(
  options: UseInfinitePaginationOptions<TQueryOptions>
): InfinitePaginationResult<TData> {
  const state = useInfinitePaginationState(options);

  // Create fixed number of infinite queries
  const infiniteQueries = useFixedInfinitePagination(
    state,
    options.queryOptions
  );

  // Map to internal format
  const queryResults: InfiniteQueryResultLike<TData>[] = useMemo(
    () =>
      infiniteQueries.map((q) => ({
        data: q.data as InfiniteData<BasePaginatedResponse<TData>> | undefined,
        error: q.error,
        fetchNextPage: q.fetchNextPage,
        hasNextPage: q.hasNextPage,
        isError: q.isError,
        isFetching: q.isFetching,
        isFetchingNextPage: q.isFetchingNextPage,
        isLoading: q.isLoading,
      })),
    [infiniteQueries]
  );

  const { data, groups, isLoading } = useMemo(
    () => processInfiniteResults(queryResults, state),
    [queryResults, state]
  );

  return {
    data,
    pagination: {
      groups,
      limit: state.limit,
      onLimitChange: state.onLimitChange,
      isLoading,
    },
    handleAccordionChange: state.handleAccordionChange,
    expandedGroups: state.isGrouped ? state.localExpanded : [],
  };
}

// ============================================================================
// useSuspenseInfinitePagination (Suspense)
// ============================================================================

/**
 * Hook for infinite scroll / load-more pagination with Suspense support.
 * Handles both flat and grouped modes with a single API.
 *
 * Uses `useSuspenseInfiniteQuery` internally which suspends until data is ready.
 * Use this for SSR/prefetch scenarios where data should be available before render.
 *
 * For client-side rendering where you want to show loading spinners,
 * use `useInfinitePagination` instead.
 *
 * @example
 * ```tsx
 * // SSR page with prefetch
 * function ProductListSSR() {
 *   const { data, pagination } = useSuspenseInfinitePagination({
 *     limit: 10,
 *     queryOptions: (groupKey) =>
 *       trpc.product.getMany.infiniteQueryOptions({ limit: 10 }),
 *   });
 *
 *   // Data is always available (suspends until ready)
 *   return <List data={data} pagination={pagination} />;
 * }
 * ```
 */
export function useSuspenseInfinitePagination<
  TQueryOptions extends InfiniteQueryOptions,
  TData = unknown,
>(
  options: UseInfinitePaginationOptions<TQueryOptions>
): SuspenseInfinitePaginationResult<TData> {
  const state = useInfinitePaginationState(options);

  // Create fixed number of suspense infinite queries
  const infiniteQueries = useFixedSuspenseInfinitePagination(
    state,
    options.queryOptions
  );

  // Map to internal format - suspense queries always have data
  const queryResults: InfiniteQueryResultLike<TData>[] = useMemo(
    () =>
      infiniteQueries.map((q) => ({
        data: q.data as InfiniteData<BasePaginatedResponse<TData>>,
        error: q.error,
        fetchNextPage: q.fetchNextPage,
        hasNextPage: q.hasNextPage,
        isError: q.isError,
        isFetching: q.isFetching,
        isFetchingNextPage: q.isFetchingNextPage,
        isLoading: false, // Suspense queries are never "loading"
      })),
    [infiniteQueries]
  );

  const { data, groups, isLoading } = useMemo(
    () => processInfiniteResults(queryResults, state),
    [queryResults, state]
  );

  return {
    data,
    pagination: {
      groups,
      limit: state.limit,
      onLimitChange: state.onLimitChange,
      isLoading,
    },
    handleAccordionChange: state.handleAccordionChange,
    expandedGroups: state.isGrouped ? state.localExpanded : [],
  };
}
