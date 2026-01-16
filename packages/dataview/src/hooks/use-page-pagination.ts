"use client";

import { parseAsCursor } from "@ocean-dataview/shared/lib";
import type { CursorValue } from "@ocean-dataview/shared/types";
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
	/** Cursor value (from URL) for flat pagination */
	cursor?: CursorValue | null;
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
 * - Simple interface: pass cursor from URL + query data
 * - Handles URL updates for navigation (shallow: false for server re-render)
 * - Returns PaginationContext-compatible object
 *
 * URL State Strategy:
 * - Uses single cursor param for flat pagination
 * - shallow: false triggers server re-render for bookmarkable URLs
 *
 * @example
 * ```tsx
 * const ProductTable = ({ cursor, limit }: Props) => {
 *   const trpc = useTRPC();
 *
 *   const { data } = useSuspenseQuery(
 *     trpc.product.getMany.queryOptions({ cursor, limit }),
 *   );
 *
 *   const pagination = usePagePagination({ cursor, limit, data });
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
	options: UsePagePaginationOptions<TData>
): PagePaginationResult {
	const { cursor, limit, data, limitOptions = DEFAULT_LIMIT_OPTIONS } = options;

	const [, startTransition] = useTransition();

	// Get current start offset
	const start = cursor?.start ?? 0;

	// URL setters (shallow: false triggers server re-render)
	const [, setCursor] = useQueryState(
		"cursor",
		parseAsCursor.withOptions({ shallow: false })
	);
	const [, setLimit] = useQueryState(
		"limit",
		parseAsInteger.withOptions({
			shallow: false,
			clearOnDefault: true,
		})
	);

	const items = data.items;

	const onNext = useCallback(() => {
		if (data.endCursor != null) {
			startTransition(() => {
				setCursor({
					after: String(data.endCursor),
					start: start + limit,
				});
			});
		}
	}, [data.endCursor, setCursor, start, limit]);

	const onPrev = useCallback(() => {
		const newStart = Math.max(0, start - limit);
		startTransition(() => {
			if (newStart === 0) {
				// Back to first page - remove cursor entirely
				setCursor(null);
			} else if (data.startCursor != null) {
				setCursor({
					before: String(data.startCursor),
					start: newStart,
				});
			}
		});
	}, [start, limit, data.startCursor, setCursor]);

	const onLimitChange = useCallback(
		(newLimit: number) => {
			startTransition(() => {
				setLimit(newLimit);
				// Reset to first page
				setCursor(null);
			});
		},
		[setLimit, setCursor]
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
