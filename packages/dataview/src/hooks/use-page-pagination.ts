"use client";

import { parseAsCursors } from "@ocean-dataview/shared/lib";
import {
	ALL_GROUP,
	type CursorState,
	getCursor,
	removeCursor,
	setCursor,
} from "@ocean-dataview/shared/types";
import { parseAsInteger, useQueryState } from "nuqs";
import { useCallback, useTransition } from "react";
import type { BidirectionalPaginatedResponse } from "../types/pagination-types";

// ============================================================================
// Types
// ============================================================================

/**
 * Input options for usePagePagination hook
 */
export interface UsePagePaginationOptions<TData> {
	/** Cursor state array (from URL) - uses ALL_GROUP for flat pagination */
	cursors?: CursorState[];
	/** Items per page */
	limit: number;
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
 * - Uses unified cursors array with ALL_GROUP key for flat pagination
 * - shallow: false triggers server re-render for bookmarkable URLs
 *
 * @example
 * ```tsx
 * const ProductTable = ({ cursors, limit }: Props) => {
 *   const trpc = useTRPC();
 *   const cursor = getCursor(cursors, ALL_GROUP);
 *   const { after, before } = getCursorParams(cursor);
 *
 *   const { data } = useSuspenseQuery(
 *     trpc.product.getMany.queryOptions({ after, before, limit }),
 *   );
 *
 *   const pagination = usePagePagination({ cursors, limit, data });
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
		cursors = [],
		limit,
		data,
		limitOptions = DEFAULT_LIMIT_OPTIONS,
	} = options;

	const [, startTransition] = useTransition();

	// Get current cursor state for flat pagination
	const cursorState = getCursor(cursors, ALL_GROUP);
	const start = cursorState?.start ?? 0;

	// URL setters (shallow: false triggers server re-render)
	const [, setCursors] = useQueryState(
		"cursors",
		parseAsCursors.withDefault([]).withOptions({ shallow: false }),
	);
	const [, setLimit] = useQueryState(
		"limit",
		parseAsInteger.withOptions({
			shallow: false,
			clearOnDefault: true,
		}),
	);

	const items = data.items;

	const onNext = useCallback(() => {
		if (data.endCursor != null) {
			startTransition(() => {
				setCursors(
					setCursor(cursors, {
						group: ALL_GROUP,
						after: String(data.endCursor),
						start: start + limit,
					}),
				);
			});
		}
	}, [data.endCursor, setCursors, cursors, start, limit]);

	const onPrev = useCallback(() => {
		const newStart = Math.max(0, start - limit);
		startTransition(() => {
			if (newStart === 0) {
				// Back to first page - remove cursor entirely
				setCursors(removeCursor(cursors, ALL_GROUP));
			} else if (data.startCursor != null) {
				setCursors(
					setCursor(cursors, {
						group: ALL_GROUP,
						before: String(data.startCursor),
						start: newStart,
					}),
				);
			}
		});
	}, [start, limit, data.startCursor, setCursors, cursors]);

	const onLimitChange = useCallback(
		(newLimit: number) => {
			startTransition(() => {
				setLimit(newLimit);
				setCursors(removeCursor(cursors, ALL_GROUP)); // Reset to first page
			});
		},
		[setLimit, setCursors, cursors],
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
