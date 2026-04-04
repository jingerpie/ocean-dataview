"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useCallback, useDeferredValue, useMemo } from "react";
import { useQueryControllerContext } from "../lib/providers/query-bridge";
import type { Limit } from "../types/pagination";
import type { BidirectionalPaginatedResponse } from "../types/pagination-types";

export interface UseGroupQueryOptions {
  /** The group key to query for */
  groupKey: string;
}

export interface GroupQueryState {
  /** True when a request is in flight (including background refetch) */
  isFetching: boolean;
}

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

export function useGroupQuery<TData = unknown>(
  options: UseGroupQueryOptions
): UseGroupQueryResult<TData> {
  const { groupKey } = options;

  const state = useQueryControllerContext();

  // Guard: This hook requires a PageController
  if (state.type !== "page") {
    throw new Error(
      "useGroupQuery requires a PageController (type: 'page'). " +
        `Received controller type: '${state.type}'. ` +
        "Use useInfiniteGroupQuery for infinite pagination, or switch to usePageController."
    );
  }

  const {
    cursors,
    filter,
    group,
    limit,
    dataQuery,
    search,
    setCursor,
    setLimit,
    sort,
  } = state;

  const cursor = cursors[groupKey];
  const cursorStart = cursor?.start ?? 0;

  // Defer query parameters to prevent re-suspending on changes
  const deferredCursor = useDeferredValue(cursor);
  const deferredFilter = useDeferredValue(filter);
  const deferredSort = useDeferredValue(sort);
  const deferredSearch = useDeferredValue(search);
  const deferredLimit = useDeferredValue(limit);
  const deferredGroup = useDeferredValue(group);

  const queryOptions = useMemo(
    () =>
      dataQuery({
        cursor: deferredCursor,
        filter: deferredFilter,
        group:
          deferredGroup && groupKey !== "__ungrouped__"
            ? { groupBy: deferredGroup, groupKey }
            : null,
        limit: deferredLimit,
        search: deferredSearch,
        sort: deferredSort,
      }),
    [
      dataQuery,
      deferredCursor,
      deferredFilter,
      deferredGroup,
      groupKey,
      deferredLimit,
      deferredSearch,
      deferredSort,
    ]
  );

  const query = useSuspenseQuery({
    ...(queryOptions as {
      queryKey: readonly unknown[];
      queryFn: () => Promise<unknown>;
    }),
  });

  const responseData = query.data as
    | BidirectionalPaginatedResponse<TData>
    | undefined;
  const data: TData[] = responseData?.items ?? [];

  const deferredCursorStart = deferredCursor?.start ?? 0;
  const hasNext = (responseData?.hasNextPage ?? false) as boolean;
  const hasPrev = deferredCursorStart > 0;

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

  const onPrev = useCallback(() => {
    const newStart = Math.max(0, cursorStart - limit);
    if (newStart === 0) {
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

  const displayStart = data.length > 0 ? deferredCursorStart + 1 : 0;
  const displayEnd = deferredCursorStart + data.length;

  const onLimitChange = useCallback(
    (newLimit: Limit) => {
      setLimit(newLimit);
    },
    [setLimit]
  );

  return {
    data,
    isFetching: query.isFetching,
    hasNext,
    hasPrev,
    onNext,
    onPrev,
    displayStart,
    displayEnd,
    limit,
    onLimitChange,
  };
}
