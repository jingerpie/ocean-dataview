"use client";

import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { useCallback } from "react";

// ============================================================================
// Types
// ============================================================================

/**
 * Props passed from server (parsed URL params)
 */
export interface PaginationProps {
	after: string | null;
	before: string | null;
	limit: number;
	start: number;
}

/**
 * Query result shape from API (flexible cursor types)
 */
export interface PaginationQueryResult<TData> {
	items: TData[];
	startCursor: string | number | null;
	endCursor: string | number | null;
	hasNextPage?: boolean;
	hasPreviousPage?: boolean;
}

/**
 * Input for pagination controls hook
 */
export interface UsePaginationControlsInput<TData> {
	/** Props from server (parsed URL params) */
	props: PaginationProps;
	/** Query result from useSuspenseQuery */
	queryData: PaginationQueryResult<TData>;
	/** Available limit options */
	limitOptions?: number[];
}

/**
 * Pagination state and controls (URL setters only)
 */
export interface PaginationControls {
	/** Items per page */
	limit: number;
	/** Has next page */
	hasNext: boolean;
	/** Has previous page */
	hasPrev: boolean;
	/** Display start (1-indexed) for "Showing X-Y" */
	displayStart?: number;
	/** Display end for "Showing X-Y" */
	displayEnd?: number;
	/** Next page callback (updates URL) */
	onNext: () => void;
	/** Previous page callback (updates URL) */
	onPrev: () => void;
	/** Limit change callback (updates URL) */
	onLimitChange: (limit: number) => void;
	/** Limit options */
	limitOptions?: number[];
}

/**
 * Output for flat (non-grouped) pagination.
 * Compatible with DataViewProvider pagination prop.
 */
export interface FlatPaginationOutput<TData> {
	/** All items */
	items: TData[];
	/** Items per page */
	limit: number;
	/** Loading state (always false for flat pagination with Suspense) */
	isLoading: boolean;
	/** Has next page */
	hasNext: boolean;
	/** Has previous page */
	hasPrev: boolean;
	/** Display start (1-indexed) for "Showing X-Y" */
	displayStart?: number;
	/** Display end for "Showing X-Y" */
	displayEnd?: number;
	/** Callback for next page */
	onNext: () => void;
	/** Callback for previous page */
	onPrev: () => void;
	/** Callback when limit changes */
	onLimitChange: (limit: number) => void;
	/** Limit options */
	limitOptions?: number[];
}

// ============================================================================
// Implementation
// ============================================================================

/**
 * Hook for pagination URL controls (setters only, no reading).
 *
 * Key design:
 * - Receives props from server (parsed URL params)
 * - Receives query data from useSuspenseQuery
 * - Returns pagination controls that update URL with shallow: false
 *
 * @example
 * ```tsx
 * // Props come from server
 * interface Props {
 *   after: string | null;
 *   before: string | null;
 *   limit: number;
 *   start: number;
 * }
 *
 * const ProductTable = (props: Props) => {
 *   const { data } = useSuspenseQuery(
 *     trpc.product.getMany.queryOptions({
 *       after: props.after ?? undefined,
 *       before: props.before ?? undefined,
 *       limit: props.limit,
 *     }),
 *   );
 *
 *   const pagination = usePaginationControls({
 *     props,
 *     queryData: data,
 *     limitOptions: [10, 25, 50, 100],
 *   });
 *
 *   return <PagePagination {...pagination} />;
 * };
 * ```
 */
export function usePaginationControls<TData>(
	input: UsePaginationControlsInput<TData>,
): FlatPaginationOutput<TData> {
	const { props, queryData, limitOptions } = input;
	const { limit, start } = props;

	// URL setters (shallow: false triggers server re-render)
	const [, setAfter] = useQueryState(
		"after",
		parseAsString.withOptions({
			shallow: false,
			clearOnDefault: true,
		}),
	);
	const [, setBefore] = useQueryState(
		"before",
		parseAsString.withOptions({
			shallow: false,
			clearOnDefault: true,
		}),
	);
	const [, setLimit] = useQueryState(
		"limit",
		parseAsInteger.withOptions({
			shallow: false,
			clearOnDefault: true,
		}),
	);
	const [, setStart] = useQueryState(
		"start",
		parseAsInteger.withOptions({
			shallow: false,
			clearOnDefault: true,
		}),
	);

	const items = queryData.items;

	const onNext = useCallback(() => {
		if (queryData.endCursor != null) {
			setAfter(String(queryData.endCursor));
			setBefore(null);
			setStart(start + limit);
		}
	}, [queryData.endCursor, setAfter, setBefore, setStart, start, limit]);

	const onPrev = useCallback(() => {
		const newStart = Math.max(0, start - limit);
		if (newStart === 0) {
			setAfter(null);
			setBefore(null);
			setStart(0);
		} else if (queryData.startCursor != null) {
			setBefore(String(queryData.startCursor));
			setAfter(null);
			setStart(newStart);
		}
	}, [start, limit, queryData.startCursor, setAfter, setBefore, setStart]);

	const onLimitChange = useCallback(
		(newLimit: number) => {
			setLimit(newLimit);
			setAfter(null);
			setBefore(null);
			setStart(0);
		},
		[setLimit, setAfter, setBefore, setStart],
	);

	return {
		items,
		limit,
		isLoading: false, // Always false with Suspense
		hasNext: queryData.hasNextPage ?? false,
		hasPrev: start > 0,
		displayStart: items.length > 0 ? start + 1 : undefined,
		displayEnd: items.length > 0 ? start + items.length : undefined,
		onNext,
		onPrev,
		onLimitChange,
		limitOptions,
	};
}
