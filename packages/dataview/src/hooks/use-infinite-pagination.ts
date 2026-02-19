"use client";

import { parseAsExpanded } from "@sparkyidea/shared/lib";
import type { Limit } from "@sparkyidea/shared/types";
import {
  type InfiniteData,
  type UseInfiniteQueryResult,
  useInfiniteQuery,
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

// ============================================================================
// Internal: Create Fixed Number of Queries
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

/**
 * Creates fixed number of infinite queries to satisfy React hooks rules.
 * Always calls maxGroups hooks, using enabled flag to control which run.
 */
function useFixedInfiniteQueries(
  allGroupKeys: string[],
  enabledKeys: string[],
  fetchedGroups: Set<string>,
  maxGroups: number,
  createQueryOptions: (groupKey: string) => InfiniteQueryOptions
): UseInfiniteQueryResult<
  InfiniteData<BasePaginatedResponse<unknown>>,
  Error
>[] {
  const queries: UseInfiniteQueryResult<
    InfiniteData<BasePaginatedResponse<unknown>>,
    Error
  >[] = [];

  const placeholderOptions = {
    queryKey: ["__placeholder"] as const,
    queryFn: async () =>
      ({
        items: [],
        hasNextPage: false,
      }) as BasePaginatedResponse<unknown>,
    getNextPageParam: () => undefined,
    initialPageParam: "" as string,
  };

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
      queryFn: options.queryFn ?? placeholderOptions.queryFn,
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

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Unified hook for infinite scroll / load-more pagination.
 * Handles both flat and grouped modes with a single API.
 *
 * Flat mode (groupBy undefined):
 * - Uses single "__all__" group internally
 * - queryOptions receives "__all__" as groupKey
 *
 * Grouped mode (groupBy defined):
 * - Uses provided allGroupKeys
 * - Per-group pagination with accordion expansion
 *
 * @example
 * ```tsx
 * // Flat mode
 * const { data, pagination } = useInfinitePagination({
 *   limit: 10,
 *   queryOptions: (groupKey) =>
 *     trpc.product.getMany.infiniteQueryOptions({ limit: 10 }),
 * });
 *
 * // Grouped mode
 * const { data, pagination, handleAccordionChange, expandedGroups } =
 *   useInfinitePagination({
 *     limit: 10,
 *     groupBy: {
 *       allGroupKeys: ["A", "B", "C"],
 *       expanded: ["A"],
 *     },
 *     queryOptions: (groupKey) =>
 *       trpc.product.getManyByGroup.infiniteQueryOptions({
 *         groupKeys: [groupKey],
 *         limit: 10,
 *       }),
 *   });
 * ```
 */
export function useInfinitePagination<
  TQueryOptions extends InfiniteQueryOptions,
  TData = unknown,
>(
  options: UseInfinitePaginationOptions<TQueryOptions>
): InfinitePaginationResult<TData> {
  const {
    limit,
    groupBy,
    queryOptions,
    maxGroups = DEFAULT_MAX_GROUPS,
  } = options;

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

  // URL state for expanded groups (only for grouped mode)
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

  // Create fixed number of infinite queries
  const infiniteQueries = useFixedInfiniteQueries(
    allGroupKeys,
    enabledKeys,
    fetchedGroups,
    maxGroups,
    queryOptions
  );

  // Build groups array with items and pagination info
  const groups = useMemo(() => {
    return allGroupKeys.map((groupKey, index) => {
      const query = infiniteQueries[index];
      const isExpanded = localExpanded.includes(groupKey);

      const items = (query?.data?.pages?.flatMap(
        (page) => (page as BasePaginatedResponse<TData>).items
      ) ?? []) as TData[];

      const lastPage = query?.data?.pages?.at(-1) as
        | BasePaginatedResponse<TData>
        | undefined;
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
  }, [allGroupKeys, infiniteQueries, localExpanded]);

  // Flatten all items
  const data = useMemo(() => groups.flatMap((g) => g.items), [groups]);

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

  // Check if any group is loading
  const isLoading = infiniteQueries.some((q) => q?.isFetching);

  return {
    data,
    pagination: {
      groups,
      limit,
      onLimitChange,
      isLoading,
    },
    handleAccordionChange,
    expandedGroups: isGrouped ? localExpanded : [],
  };
}

// Alias
export { useInfinitePagination as useLoadMorePagination };
