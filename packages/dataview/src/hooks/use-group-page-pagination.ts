"use client";

import { parseAsCursors, parseAsExpanded } from "@sparkyidea/shared/lib";
import type { Cursors, CursorValue, Limit } from "@sparkyidea/shared/types";
import { useQueries } from "@tanstack/react-query";
import { parseAsInteger, useQueryState } from "nuqs";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import type {
  BidirectionalPaginatedResponse,
  InferItemsFromQueryOptions,
} from "../types/pagination-types";

// ============================================================================
// Types
// ============================================================================

/**
 * Query options for page-based query.
 * Compatible with TRPC's queryOptions return type.
 * Uses loose typing to accept TRPC's return type which has more context parameters.
 */
export interface GroupPageQueryOptions {
  queryKey: readonly unknown[];
  // biome-ignore lint/suspicious/noExplicitAny: TRPC returns complex types
  queryFn?: any;
}

/**
 * Input options for useGroupPagePagination hook.
 * TQueryOptions is inferred from createQueryOptions callback.
 * TData is automatically inferred from the query response's items array.
 */
export interface UseGroupPagePaginationOptions<
  TQueryOptions extends GroupPageQueryOptions,
  _TData = InferItemsFromQueryOptions<TQueryOptions>,
> {
  /** All group keys in stable order */
  allGroupKeys: string[];
  /** Currently expanded groups */
  expanded: string[];
  /** Cursors object per group (from URL props) */
  cursors?: Cursors;
  /** Items per page (from server props) */
  limit: Limit;
  /** Factory to create query options for each group */
  createQueryOptions: (groupKey: string, cursor?: CursorValue) => TQueryOptions;
}

/**
 * Per-group pagination info
 */
export interface GroupInfo<TData> {
  key: string;
  value: string;
  items: TData[];
  isLoading: boolean;
  isFetching: boolean;
  /**
   * Whether there are more items to load.
   * - boolean: from getMany (single pagination unit)
   * - Record<string, boolean>: from getManyByGroup (per-group pagination)
   */
  hasNext: boolean | Record<string, boolean>;
  hasPrev: boolean;
  onNext: () => void;
  onPrev: () => void;
  displayStart: number;
  displayEnd: number;
}

/**
 * Pagination state for grouped views
 */
export interface GroupPagePaginationState<TData> {
  groups: GroupInfo<TData>[];
  limit: Limit;
  onLimitChange: (limit: Limit) => void;
  isLoading: boolean;
}

/**
 * Output type for useGroupPagePagination hook
 */
export interface GroupPagePaginationResult<TData> {
  /** Flattened data from all groups */
  data: TData[];
  /** Pagination state for DataViewProvider */
  pagination: GroupPagePaginationState<TData>;
  /** Handler for accordion expand/collapse */
  handleAccordionChange: (newExpanded: string[]) => void;
  /** Current expanded groups (local state for optimistic UI) */
  expandedGroups: string[];
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for grouped page-based pagination.
 *
 * Features:
 * - Per-group pagination with Prev/Next buttons
 * - Accordion expansion state management
 * - URL state for bookmarkable grouped views (shallow: false)
 * - Creates queries internally (handles React hooks rules)
 * - Automatic type inference from createQueryOptions callback
 *
 * Note: Group counts should be passed to DataViewProvider via the `counts` prop.
 * This hook handles pagination state; counts are managed separately via context.
 *
 * @example
 * ```tsx
 * const ProductGroupTable = ({ expanded: expandedProp, cursors, limit }: Props) => {
 *   const trpc = useTRPC();
 *
 *   const { data: groupCounts } = useSuspenseQuery(
 *     trpc.product.getGroup.queryOptions({ groupBy: "familyGroup" }),
 *   );
 *
 *   const expanded = expandedProp ?? DEFAULT_EXPANDED;
 *   const allGroupKeys = Object.keys(groupCounts);
 *
 *   const { data, pagination, handleAccordionChange, expandedGroups } = useGroupPagePagination({
 *     allGroupKeys,
 *     expanded,
 *     cursors,
 *     limit,
 *     createQueryOptions: (groupKey, cursor) =>
 *       trpc.product.getMany.queryOptions({
 *         filters: [{ property: "familyGroup", condition: "eq", value: groupKey }],
 *         cursor,
 *         limit,
 *       }),
 *   });
 *
 *   return (
 *     <DataViewProvider data={data} counts={{ group: groupCounts }} pagination={pagination}>
 *       <TableView
 *         view={{
 *           group: {
 *             groupBy: "familyGroup",
 *             expandedGroups,
 *             onExpandedChange: handleAccordionChange,
 *           },
 *         }}
 *         pagination="page"
 *       />
 *     </DataViewProvider>
 *   );
 * };
 * ```
 */
export function useGroupPagePagination<
  TQueryOptions extends GroupPageQueryOptions,
  TData = InferItemsFromQueryOptions<TQueryOptions>,
>(
  options: UseGroupPagePaginationOptions<TQueryOptions, TData>
): GroupPagePaginationResult<TData> {
  const {
    allGroupKeys,
    expanded,
    cursors = {},
    limit,
    createQueryOptions,
  } = options;

  // Local state for optimistic accordion UI (prevents bouncing)
  // Follows tablecn pattern: maintain local state, sync from props only on external changes
  const [localExpanded, setLocalExpanded] = useState(expanded);
  const isInternalChange = useRef(false);

  // Track groups that have been fetched (expanded at least once)
  // This ensures queries stay enabled and data is preserved when collapsed
  const [fetchedGroups, setFetchedGroups] = useState<Set<string>>(
    () => new Set(expanded)
  );

  // Sync from props only on external changes (e.g., URL navigation, programmatic updates)
  // Skip sync if we triggered the change ourselves
  useEffect(() => {
    if (!isInternalChange.current) {
      setLocalExpanded(expanded);
      // Add newly expanded groups to fetched set
      setFetchedGroups((prev) => {
        const next = new Set(prev);
        for (const key of expanded) {
          next.add(key);
        }
        return next;
      });
    }
    isInternalChange.current = false;
  }, [expanded]);

  // Create queries internally using useQueries
  // Keep query enabled if currently expanded OR was previously fetched (preserves cache)
  const queries = useQueries({
    queries: allGroupKeys.map((groupKey) => {
      const cursor = cursors[groupKey];
      const isEnabled =
        localExpanded.includes(groupKey) || fetchedGroups.has(groupKey);

      const queryOpts = createQueryOptions(groupKey, cursor);

      return {
        queryKey: queryOpts.queryKey,
        queryFn: queryOpts.queryFn,
        enabled: isEnabled,
      };
    }),
  });

  const [, startTransition] = useTransition();

  // URL state setters (shallow: false triggers server re-render)
  const [, setExpanded] = useQueryState(
    "expanded",
    parseAsExpanded.withOptions({ shallow: false })
  );
  const [, setCursors] = useQueryState(
    "cursors",
    parseAsCursors.withDefault({}).withOptions({ shallow: false })
  );

  // Write-only URL state for limit changes
  const [, setUrlLimit] = useQueryState(
    "limit",
    parseAsInteger.withOptions({ shallow: false })
  );

  // Build groups array with items and pagination info
  // Use localExpanded for UI state (optimistic UI)
  // Note: counts are managed via context, not in this hook
  const groups = useMemo(() => {
    return allGroupKeys.map((groupKey, index) => {
      const query = queries[index];
      const isExpanded = localExpanded.includes(groupKey);
      const queryData = query?.data as
        | BidirectionalPaginatedResponse<TData>
        | undefined;
      // Return cached items even when collapsed (query stays enabled via fetchedGroups)
      const items: TData[] = queryData?.items ?? [];
      const cursorState = cursors[groupKey];
      const groupStart = cursorState?.start ?? 0;

      const group: GroupInfo<TData> = {
        key: groupKey,
        value: groupKey,
        isLoading: query?.isLoading ?? false,
        isFetching: isExpanded && (query?.isFetching ?? false),
        items,
        hasNext: queryData?.hasNextPage ?? false,
        hasPrev: groupStart > 0,
        displayStart: items.length > 0 ? groupStart + 1 : 0,
        displayEnd: groupStart + items.length,

        onNext: () => {
          const endCursor = queryData?.endCursor;
          if (endCursor == null) {
            return;
          }
          startTransition(() => {
            setCursors({
              ...cursors,
              [groupKey]: {
                after: String(endCursor),
                start: groupStart + limit,
              },
            });
          });
        },

        onPrev: () => {
          const newStart = Math.max(0, groupStart - limit);
          startTransition(() => {
            if (newStart === 0) {
              // Remove cursor for this group
              const { [groupKey]: _, ...rest } = cursors;
              setCursors(Object.keys(rest).length > 0 ? rest : {});
            } else {
              const startCursor = queryData?.startCursor;
              if (startCursor == null) {
                return;
              }
              setCursors({
                ...cursors,
                [groupKey]: {
                  before: String(startCursor),
                  start: newStart,
                },
              });
            }
          });
        },
      };

      return group;
    });
  }, [allGroupKeys, queries, localExpanded, cursors, limit, setCursors]);

  // Flatten all items
  const data = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  // Limit change handler
  const onLimitChange = useCallback(
    (newLimit: Limit) => {
      startTransition(() => {
        setUrlLimit(newLimit);
        setCursors({}); // Reset all cursors when limit changes
      });
    },
    [setUrlLimit, setCursors]
  );

  // Accordion change handler
  // Immediately updates local state for optimistic UI, then syncs to URL
  const handleAccordionChange = useCallback(
    (newExpanded: string[]) => {
      // Optimistic UI: update local state immediately
      setLocalExpanded(newExpanded);
      isInternalChange.current = true;

      // Track newly expanded groups for cache preservation
      setFetchedGroups((prev) => {
        const next = new Set(prev);
        for (const key of newExpanded) {
          next.add(key);
        }
        return next;
      });

      const removed = localExpanded.find((g) => !newExpanded.includes(g));

      startTransition(() => {
        // Clear cursor for collapsed group
        if (removed) {
          const { [removed]: _, ...rest } = cursors;
          setCursors(Object.keys(rest).length > 0 ? rest : {});
        }
        setExpanded(newExpanded.length > 0 ? newExpanded : null);
      });
    },
    [localExpanded, cursors, setExpanded, setCursors]
  );

  // Check if any group is loading
  const isLoading = queries.some((q) => q?.isFetching);

  return {
    data,
    pagination: {
      groups,
      limit,
      onLimitChange,
      isLoading,
    },
    handleAccordionChange,
    expandedGroups: localExpanded,
  };
}
