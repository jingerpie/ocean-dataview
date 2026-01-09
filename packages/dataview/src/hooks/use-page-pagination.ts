"use client";

import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { useCallback, useTransition } from "react";
import type { BidirectionalPaginatedResponse } from "../types/pagination-types";

// ============================================================================
// Types
// ============================================================================

/**
 * Input options for usePagePagination hook
 */
export interface UsePagePaginationOptions<TData> {
	/** Cursor for forward pagination (from URL) */
	after?: string | null;
	/** Cursor for backward pagination (from URL) */
	before?: string | null;
	/** Items per page */
	limit: number;
	/** Start offset for display (0-indexed) */
	start?: number;
	/** Query result from useSuspenseQuery */
	data: BidirectionalPaginatedResponse<TData>;
	/** Available limit options (default: [25, 50, 100, 200]) */
	limitOptions?: number[];
}

/**
 * Output type for usePagePagination hook
 * Compatible with PaginationContext for DataViewProvider
 */
export interface PagePaginationResult {
	// Navigation
	hasNext: boolean;
	hasPrev: boolean;
	onNext: () => void;
	onPrev: () => void;

	// Limit control
	limit: number;
	onLimitChange: (newLimit: number) => void;
	limitOptions: number[];

	// Display info
	displayStart: number;
	displayEnd: number;

	// Loading state (always false with Suspense, but included for compatibility)
	isLoading: boolean;
}

// ============================================================================
// Constants
// ============================================================================

// Larger batch sizes for page-based pagination (single page shown at a time)
const DEFAULT_LIMIT_OPTIONS = [25, 50, 100, 200];

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for flat (non-grouped) page-based pagination.
 *
 * Features:
 * - Simple interface: pass cursor state from URL + query data
 * - Handles URL updates for navigation (shallow: false for server re-render)
 * - Returns PaginationContext-compatible object
 *
 * URL State Strategy:
 * - Uses after/before/limit/start params (flat pagination style)
 * - shallow: false triggers server re-render for bookmarkable URLs
 *
 * @example
 * ```tsx
 * const ProductTable = (props: PaginationProps) => {
 *   const { after, before, limit, start } = props;
 *   const trpc = useTRPC();
 *
 *   const { data } = useSuspenseQuery(
 *     trpc.product.getMany.queryOptions({
 *       after: after ?? undefined,
 *       before: before ?? undefined,
 *       limit,
 *     }),
 *   );
 *
 *   const pagination = usePagePagination({
 *     after,
 *     before,
 *     limit,
 *     start,
 *     data,
 *   });
 *
 *   return (
 *     <DataViewProvider data={data.items} pagination={pagination}>
 *       <TableView pagination="page" />
 *     </DataViewProvider>
 *   );
 * };
 * ```
 */
export function usePagePagination<TData>(
	options: UsePagePaginationOptions<TData>,
): PagePaginationResult {
	const {
		limit,
		start = 0,
		data,
		limitOptions = DEFAULT_LIMIT_OPTIONS,
	} = options;

	const [, startTransition] = useTransition();

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

	const items = data.items;

	const onNext = useCallback(() => {
		if (data.endCursor != null) {
			startTransition(() => {
				setAfter(String(data.endCursor));
				setBefore(null);
				setStart(start + limit);
			});
		}
	}, [data.endCursor, setAfter, setBefore, setStart, start, limit]);

	const onPrev = useCallback(() => {
		const newStart = Math.max(0, start - limit);
		startTransition(() => {
			if (newStart === 0) {
				setAfter(null);
				setBefore(null);
				setStart(0);
			} else if (data.startCursor != null) {
				setBefore(String(data.startCursor));
				setAfter(null);
				setStart(newStart);
			}
		});
	}, [start, limit, data.startCursor, setAfter, setBefore, setStart]);

	const onLimitChange = useCallback(
		(newLimit: number) => {
			startTransition(() => {
				setLimit(newLimit);
				setAfter(null);
				setBefore(null);
				setStart(0);
			});
		},
		[setLimit, setAfter, setBefore, setStart],
	);

	return {
		// Navigation
		hasNext: data.hasNextPage ?? false,
		hasPrev: start > 0,
		onNext,
		onPrev,

		// Limit control
		limit,
		onLimitChange,
		limitOptions,

		// Display info
		displayStart: items.length > 0 ? start + 1 : 0,
		displayEnd: start + items.length,

		// Loading state (always false with Suspense)
		isLoading: false,
	};
}
