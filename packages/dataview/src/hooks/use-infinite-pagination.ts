"use client";

import type { Limit } from "@sparkyidea/shared/types";
import type { InfiniteData } from "@tanstack/react-query";
import { parseAsInteger, useQueryState } from "nuqs";
import { useCallback, useMemo } from "react";
import type { BasePaginatedResponse } from "../types/pagination-types";

// ============================================================================
// Types
// ============================================================================

/**
 * Infinite query state (from useSuspenseInfiniteQuery or useInfiniteQuery)
 * Uses loose typing to accept TRPC's query result type
 */
export interface InfiniteQueryState {
  // biome-ignore lint/suspicious/noExplicitAny: TRPC returns complex types
  data: InfiniteData<any>;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isFetching: boolean;
  isLoading: boolean;
  error?: unknown;
  isError: boolean;
}

/**
 * Infer item type from infinite query's data pages.
 * Extracts TData from InfiniteData<{ items: TData[], ... }>.
 */
type InferItemsFromInfiniteQuery<T> = T extends {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: InfiniteData<infer TPage>;
}
  ? TPage extends { items: (infer U)[] }
    ? U
    : never
  : never;

/**
 * Input options for useInfinitePagination hook.
 * TQuery is inferred from infiniteQuery parameter.
 * TData is automatically inferred from the query data's items array.
 */
export interface UseInfinitePaginationOptions<
  TQuery extends InfiniteQueryState,
  _TData = InferItemsFromInfiniteQuery<TQuery>,
> {
  /** Infinite query result from useSuspenseInfiniteQuery */
  infiniteQuery: TQuery;
  /** Items per page (from server props) */
  limit: Limit;
}

/**
 * Pagination state for infinite views
 */
export interface InfinitePaginationState {
  // Navigation
  hasNext: boolean;
  hasPrev: false;
  onNext: () => void;
  onPrev: () => void;

  // Limit control
  limit: Limit;
  onLimitChange: (limit: Limit) => void;

  // Infinite-specific
  totalLoaded: number;
  isFetchingNextPage: boolean;

  // Loading states
  isLoading: boolean;
  isFetching: boolean;

  // Error state
  error: unknown;
  isError: boolean;
}

/**
 * Output type for useInfinitePagination hook
 */
export interface InfinitePaginationResult<TData> {
  /** Flattened items from all pages */
  items: TData[];
  /** Pagination state for DataViewProvider */
  pagination: InfinitePaginationState;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for flat infinite scroll / load-more pagination.
 *
 * Features:
 * - Takes infinite query result from useSuspenseInfiniteQuery
 * - Flattens pages into single items array
 * - Reads limit from URL first, falls back to context defaults
 * - Automatic type inference from infiniteQuery parameter
 *
 * URL State Strategy:
 * - Reads `limit` from URL (null if absent)
 * - Falls back to `defaults.limit` from DataViewContext
 * - When limit changes, writes to URL (shallow: false for server re-render)
 *
 * @example
 * ```tsx
 * const ProductGallery = ({ limit }: Props) => {
 *   const trpc = useTRPC();
 *
 *   const infiniteQuery = useSuspenseInfiniteQuery(
 *     trpc.product.getMany.infiniteQueryOptions(
 *       { limit, sort: [{ property: "updatedAt", direction: "desc" }] },
 *       { getNextPageParam: (lastPage) => lastPage.hasNextPage ? lastPage.endCursor : undefined },
 *     ),
 *   );
 *
 *   const { items, pagination } = useInfinitePagination({ infiniteQuery });
 *
 *   return (
 *     <DataViewProvider
 *       data={items}
 *       pagination={pagination}
 *       defaults={{ limit }}
 *     >
 *       <GalleryView pagination="loadMore" />
 *     </DataViewProvider>
 *   );
 * };
 * ```
 */
export function useInfinitePagination<
  TQuery extends InfiniteQueryState,
  TData = InferItemsFromInfiniteQuery<TQuery>,
>(
  options: UseInfinitePaginationOptions<TQuery, TData>
): InfinitePaginationResult<TData> {
  const { infiniteQuery, limit } = options;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    isLoading,
    error,
    isError,
  } = infiniteQuery;

  // Write-only URL state for limit changes
  const [, setUrlLimit] = useQueryState(
    "limit",
    parseAsInteger.withOptions({ shallow: false })
  );

  // Flatten all pages into single array
  const items = useMemo(() => {
    return data.pages.flatMap(
      (page: BasePaginatedResponse<TData>) => page.items
    );
  }, [data.pages]);

  const onNext = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    items,
    pagination: {
      // Navigation
      hasNext: hasNextPage ?? false,
      hasPrev: false,
      onNext,
      onPrev: () => undefined,

      // Limit control
      limit,
      onLimitChange: setUrlLimit as (limit: Limit) => void,

      // Infinite-specific
      totalLoaded: items.length,
      isFetchingNextPage,

      // Loading states
      isLoading,
      isFetching,

      // Error state
      error,
      isError,
    },
  };
}
