"use client";

import { parseAsCursor } from "@sparkyidea/shared/lib";
import type { CursorValue } from "@sparkyidea/shared/types";
import { parseAsInteger, useQueryState } from "nuqs";
import { useCallback, useTransition } from "react";
import type { Limit } from "../types/pagination";
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
  /** Query result from useSuspenseQuery */
  data: BidirectionalPaginatedResponse<TData>;
  /** Items per page (from server props) */
  limit: Limit;
}

/**
 * Output type for usePagePagination hook
 * Compatible with PaginationContext for DataViewProvider
 */
export interface PagePaginationResult {
  displayEnd: number;

  // Display info
  displayStart: number;
  // Navigation
  /**
   * Whether there are more items to load.
   * - boolean: from getMany (single pagination unit)
   * - Record<string, boolean>: from getManyByGroup (per-group pagination)
   */
  hasNext: boolean | Record<string, boolean>;
  hasPrev: boolean;

  // Loading state (always false with Suspense, but included for compatibility)
  isLoading: boolean;

  // Limit control
  limit: Limit;
  onLimitChange: (newLimit: Limit) => void;
  onNext: () => void;
  onPrev: () => void;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for flat (non-grouped) page-based pagination.
 *
 * Features:
 * - Simple interface: pass cursor from URL + query data
 * - Reads limit from URL first, falls back to context defaults
 * - Handles URL updates for navigation (shallow: false for server re-render)
 * - Returns PaginationContext-compatible object
 *
 * URL State Strategy:
 * - Reads `limit` from URL (null if absent)
 * - Falls back to `defaults.limit` from DataViewContext
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
 *   const pagination = usePagePagination({ cursor, data });
 *
 *   return (
 *     <DataViewProvider
 *       data={data.items}
 *       pagination={pagination}
 *       defaults={{ limit }}
 *     >
 *       <TableView pagination="page" />
 *     </DataViewProvider>
 *   );
 * };
 * ```
 */
export function usePagePagination<TData>(
  options: UsePagePaginationOptions<TData>
): PagePaginationResult {
  const { cursor, limit, data } = options;

  const [, startTransition] = useTransition();

  // Get current start offset
  const start = cursor?.start ?? 0;

  // URL state for cursor
  const [, setCursor] = useQueryState(
    "cursor",
    parseAsCursor.withOptions({ shallow: false })
  );

  // Write-only URL state for limit changes
  const [, setUrlLimit] = useQueryState(
    "limit",
    parseAsInteger.withOptions({ shallow: false })
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
    (newLimit: Limit) => {
      startTransition(() => {
        setUrlLimit(newLimit);
        // Reset to first page
        setCursor(null);
      });
    },
    [setUrlLimit, setCursor]
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

    // Display info
    displayStart: items.length > 0 ? start + 1 : 0,
    displayEnd: start + items.length,

    // Loading state (always false with Suspense)
    isLoading: false,
  };
}
