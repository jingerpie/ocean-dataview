"use client";

import { useQuery } from "@tanstack/react-query";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import type { QueryOptionsLike } from "./use-group-pagination";

// ============================================================================
// Types
// ============================================================================

/**
 * Query result shape from API
 */
export interface QueryResult<TData> {
	items: TData[];
	startCursor: string | null;
	endCursor: string | null;
	hasNextPage?: boolean;
	hasPreviousPage?: boolean;
}

/**
 * Input for cursor-based pagination
 */
export interface PaginationInput {
	/** Factory to create query options with cursor params */
	createQueryOptions: (
		after: string | undefined,
		before: string | undefined,
		limit: number,
	) => QueryOptionsLike;
	/** Default items per page */
	defaultLimit?: number;
	/** Available limit options */
	limitOptions?: number[];
}

/**
 * Pagination state and controls
 */
export interface PaginationState {
	/** Items per page */
	limit: number;
	/** Loading state */
	isLoading: boolean;
	/** Has next page */
	hasNext: boolean;
	/** Has previous page */
	hasPrev: boolean;
	/** Display start (1-indexed) for "Showing X-Y" */
	displayStart?: number;
	/** Display end for "Showing X-Y" */
	displayEnd?: number;
	/** Next page callback */
	onNext: () => void;
	/** Previous page callback */
	onPrev: () => void;
	/** Limit change callback */
	onLimitChange: (limit: number) => void;
	/** Limit options */
	limitOptions?: number[];
}

/**
 * Pagination hook output
 */
export interface PaginationOutput<TData> {
	/** Data items from current page */
	data: TData[];
	/** Pagination state and controls */
	pagination: PaginationState;
	/** Loading state */
	isLoading: boolean;
}

// ============================================================================
// Implementation
// ============================================================================

/**
 * Hook for simple cursor-based pagination.
 *
 * Key design:
 * - Single query (not grouped)
 * - URL state for cursor navigation
 * - Automatic start tracking for "Showing X-Y"
 *
 * @example
 * ```tsx
 * const { data, pagination } = usePagination<Product>({
 *   createQueryOptions: (after, before, limit) =>
 *     trpc.product.getMany.queryOptions({
 *       after,
 *       before,
 *       limit,
 *       sort: [{ propertyId: "createdAt", desc: true }],
 *     }),
 *   defaultLimit: 25,
 *   limitOptions: [10, 25, 50, 100],
 * });
 *
 * return (
 *   <TableProvider data={data} properties={productProperties}>
 *     <TableView />
 *     <PagePagination {...pagination} />
 *   </TableProvider>
 * );
 * ```
 */
export function usePagination<TData>(
	input: PaginationInput,
): PaginationOutput<TData> {
	const { createQueryOptions, defaultLimit = 25, limitOptions } = input;

	// URL state for cursor
	const [after, setAfter] = useQueryState(
		"after",
		parseAsString.withOptions({
			shallow: false,
			clearOnDefault: true,
		}),
	);
	const [before, setBefore] = useQueryState(
		"before",
		parseAsString.withOptions({
			shallow: false,
			clearOnDefault: true,
		}),
	);
	const [limit, setLimit] = useQueryState(
		"limit",
		parseAsInteger.withDefault(defaultLimit).withOptions({
			shallow: false,
			clearOnDefault: true,
		}),
	);
	const [start, setStart] = useQueryState(
		"start",
		parseAsInteger.withDefault(0).withOptions({
			shallow: false,
			clearOnDefault: true,
		}),
	);

	// Single query
	const queryOptions = createQueryOptions(
		after ?? undefined,
		before ?? undefined,
		limit,
	);
	const { data, isFetching } = useQuery(queryOptions);

	const queryData = data as QueryResult<TData> | undefined;
	const items = queryData?.items ?? [];

	const pagination: PaginationState = {
		limit,
		isLoading: isFetching,
		hasNext: queryData?.hasNextPage ?? false,
		hasPrev: start > 0,
		displayStart: items.length > 0 ? start + 1 : undefined,
		displayEnd: items.length > 0 ? start + items.length : undefined,
		onNext: () => {
			if (queryData?.endCursor) {
				setAfter(queryData.endCursor);
				setBefore(null);
				setStart(start + limit);
			}
		},
		onPrev: () => {
			const newStart = Math.max(0, start - limit);
			if (newStart === 0) {
				setAfter(null);
				setBefore(null);
				setStart(0);
			} else if (queryData?.startCursor) {
				setBefore(queryData.startCursor);
				setAfter(null);
				setStart(newStart);
			}
		},
		onLimitChange: (newLimit) => {
			setLimit(newLimit);
			setAfter(null);
			setBefore(null);
			setStart(0);
		},
		limitOptions,
	};

	return {
		data: items,
		pagination,
		isLoading: isFetching,
	};
}
