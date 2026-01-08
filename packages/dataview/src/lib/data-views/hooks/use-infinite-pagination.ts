"use client";

import type { InfiniteData } from "@tanstack/react-query";
import { parseAsInteger, useQueryState } from "nuqs";
import { useCallback, useMemo } from "react";
import type { BasePaginatedResponse } from "./pagination-types";

// ============================================================================
// Types
// ============================================================================

/**
 * Infinite query state (from useSuspenseInfiniteQuery or useInfiniteQuery)
 * Uses loose typing to accept TRPC's query result type
 */
export interface InfiniteQueryState {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
	TData = InferItemsFromInfiniteQuery<TQuery>,
> {
	/** Infinite query result from useSuspenseInfiniteQuery */
	infiniteQuery: TQuery;
	/** Default limit (for URL state) */
	defaultLimit?: number;
	/** Available limit options (default: [10, 25, 50, 100]) */
	limitOptions?: number[];
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
	limit: number;
	onLimitChange: (limit: number) => void;
	limitOptions: number[];

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
// Constants
// ============================================================================

const DEFAULT_LIMIT = 25;
// Smaller batch sizes for infinite scroll (data accumulates client-side)
const DEFAULT_LIMIT_OPTIONS = [10, 25, 50, 100];

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for flat infinite scroll / load-more pagination.
 *
 * Features:
 * - Takes infinite query result from useSuspenseInfiniteQuery
 * - Flattens pages into single items array
 * - URL state for limit only (shallow: false - server re-render for new limit)
 * - Automatic type inference from infiniteQuery parameter
 *
 * URL State Strategy:
 * - Only `limit` is stored in URL (shallow: false for server re-render)
 * - Accumulated data lives in React Query cache
 * - When limit changes, server re-renders with new prop for query
 *
 * @example
 * ```tsx
 * const ProductGallery = ({ limit: initialLimit }: Props) => {
 *   const trpc = useTRPC();
 *
 *   const infiniteQuery = useSuspenseInfiniteQuery(
 *     trpc.product.getMany.infiniteQueryOptions(
 *       { limit: initialLimit, sort: [{ propertyId: "updatedAt", desc: true }] },
 *       { getNextPageParam: (lastPage) => lastPage.endCursor ?? undefined },
 *     ),
 *   );
 *
 *   // Type is inferred from infiniteQuery result
 *   const { items, pagination } = useInfinitePagination({
 *     infiniteQuery,
 *     defaultLimit: initialLimit,
 *   });
 *
 *   return (
 *     <DataViewProvider data={items} pagination={pagination}>
 *       <GalleryView pagination="loadMore" />
 *     </DataViewProvider>
 *   );
 * };
 * ```
 */
// biome-ignore lint/correctness/noUnusedVariables: TData is used in options and return type
export function useInfinitePagination<
	TQuery extends InfiniteQueryState,
	TData = InferItemsFromInfiniteQuery<TQuery>,
>(
	options: UseInfinitePaginationOptions<TQuery, TData>,
): InfinitePaginationResult<TData> {
	const {
		infiniteQuery,
		defaultLimit = DEFAULT_LIMIT,
		limitOptions = DEFAULT_LIMIT_OPTIONS,
	} = options;

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

	// Only limit in URL - cursor state lives in React Query cache
	// shallow: false - needs server re-render to update props for query
	const [limit, setLimit] = useQueryState(
		"limit",
		parseAsInteger.withDefault(defaultLimit).withOptions({
			shallow: false,
			clearOnDefault: true,
		}),
	);

	// Flatten all pages into single array
	const items = useMemo(() => {
		return data.pages.flatMap(
			(page: BasePaginatedResponse<TData>) => page.items,
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
			onPrev: () => {},

			// Limit control
			limit,
			onLimitChange: setLimit,
			limitOptions,

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
