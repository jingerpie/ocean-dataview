"use client";

import type { Limit } from "@sparkyidea/shared/types";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useGroupPaginationContext } from "../lib/providers/group-pagination-provider";
import type { BidirectionalPaginatedResponse } from "../types/pagination-types";

// ============================================================================
// Types
// ============================================================================

/**
 * Options for useGroupQuery hook.
 */
export interface UseGroupQueryOptions {
  /**
   * Whether to enable the query.
   * Defaults to true if group is expanded.
   */
  enabled?: boolean;
  /** The group key to query for */
  groupKey: string;
}

/**
 * Query state information for UI rendering.
 */
export interface GroupQueryState {
  /** True when a request is in flight (including background refetch) */
  isFetching: boolean;
  /** True only during initial load (no cached data) */
  isPending: boolean;

  /** True when showing stale data while refetching */
  isPlaceholderData: boolean;
}

/**
 * Pagination controls for a group.
 */
export interface GroupPaginationControls {
  /** 1-indexed end of current page (0 if empty) */
  displayEnd: number;

  /** 1-indexed start of current page (0 if empty) */
  displayStart: number;
  /** Whether there's a next page */
  hasNext: boolean;

  /** Whether there's a previous page */
  hasPrev: boolean;

  /** Navigate to next page */
  onNext: () => void;

  /** Navigate to previous page */
  onPrev: () => void;
}

/**
 * Result of useGroupQuery hook.
 */
export interface UseGroupQueryResult<TData>
  extends GroupQueryState,
    GroupPaginationControls {
  /** Data items for this group */
  data: TData[];

  /** Current page limit */
  limit: Limit;

  /** Handler to change page limit */
  onLimitChange: (limit: Limit) => void;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * useGroupQuery - Per-group query hook with keepPreviousData.
 *
 * This hook is the key to eliminating skeleton flash on filter/sort/search changes.
 * Each group accordion owns its useQuery with `placeholderData: keepPreviousData`,
 * which keeps showing stale data with reduced opacity while refetching.
 *
 * Must be used within a GroupPaginationProvider.
 *
 * @example
 * ```tsx
 * function GroupAccordionSection({ groupKey }: { groupKey: string }) {
 *   const {
 *     data,
 *     isPending,
 *     isPlaceholderData,
 *     hasNext,
 *     hasPrev,
 *     onNext,
 *     onPrev,
 *   } = useGroupQuery({ groupKey });
 *
 *   // Show skeleton only on initial load (no cached data)
 *   if (isPending && data.length === 0) {
 *     return <Skeleton />;
 *   }
 *
 *   // Show stale data with opacity while refetching
 *   return (
 *     <div style={{ opacity: isPlaceholderData ? 0.7 : 1 }}>
 *       <DataTable data={data} />
 *       <Pagination hasNext={hasNext} hasPrev={hasPrev} onNext={onNext} onPrev={onPrev} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useGroupQuery<TData = unknown>(
  options: UseGroupQueryOptions
): UseGroupQueryResult<TData> {
  const { groupKey, enabled: enabledOption } = options;

  // Get context from provider
  // Note: context is loosely typed to allow TRPC's complex query options
  const {
    cursors,
    expandedGroups,
    limit,
    queryOptionsFactory,
    setCursor,
    setLimit,
  } = useGroupPaginationContext();

  // Get cursor for this group
  const cursor = cursors[groupKey];
  const cursorStart = cursor?.start ?? 0;

  // Determine if query should be enabled
  const isExpanded = expandedGroups.includes(groupKey);
  const enabled = enabledOption ?? isExpanded;

  // Build query options
  const queryOptions = useMemo(
    () => queryOptionsFactory(groupKey, cursor),
    [queryOptionsFactory, groupKey, cursor]
  );

  // Execute query with keepPreviousData
  const query = useQuery({
    ...queryOptions,
    placeholderData: keepPreviousData,
    enabled,
  });

  // Extract data
  const responseData = query.data as
    | BidirectionalPaginatedResponse<TData>
    | undefined;
  const data: TData[] = responseData?.items ?? [];

  // Pagination state (page-based pagination always uses boolean, not Record)
  const hasNext = (responseData?.hasNextPage ?? false) as boolean;
  const hasPrev = cursorStart > 0;

  // Navigate to next page
  const onNext = useCallback(() => {
    const endCursor = responseData?.endCursor;
    if (endCursor == null) {
      return;
    }
    setCursor(groupKey, {
      after: String(endCursor),
      start: cursorStart + limit,
    });
  }, [responseData?.endCursor, setCursor, groupKey, cursorStart, limit]);

  // Navigate to previous page
  const onPrev = useCallback(() => {
    const newStart = Math.max(0, cursorStart - limit);
    if (newStart === 0) {
      // Reset to first page - remove cursor
      setCursor(groupKey, null);
    } else {
      const startCursor = responseData?.startCursor;
      if (startCursor == null) {
        return;
      }
      setCursor(groupKey, {
        before: String(startCursor),
        start: newStart,
      });
    }
  }, [cursorStart, limit, setCursor, groupKey, responseData?.startCursor]);

  // Display range (1-indexed)
  const displayStart = data.length > 0 ? cursorStart + 1 : 0;
  const displayEnd = cursorStart + data.length;

  // Limit change handler
  const onLimitChange = useCallback(
    (newLimit: Limit) => {
      setLimit(newLimit);
    },
    [setLimit]
  );

  return {
    // Data
    data,

    // Query state
    isPending: query.isPending,
    isFetching: query.isFetching,
    isPlaceholderData: query.isPlaceholderData,

    // Pagination controls
    hasNext,
    hasPrev,
    onNext,
    onPrev,
    displayStart,
    displayEnd,

    // Limit
    limit,
    onLimitChange,
  };
}
