import { z } from "zod";

// ============================================================================
// Limit Types
// ============================================================================

/**
 * Standard limit values for pagination.
 * Used across all pagination hooks and components.
 */
export const LIMIT_OPTIONS = [10, 25, 50, 100, 200] as const;

/**
 * Valid limit values for pagination.
 */
export type Limit = (typeof LIMIT_OPTIONS)[number];

// ============================================================================
// Cursor Types
// ============================================================================

/**
 * Cursor value for pagination state.
 * - Flat pagination: used directly as `cursor` param
 * - Grouped pagination: used as values in `cursors` object map
 */
export const cursorValueSchema = z.object({
  after: z.string().optional(), // forward cursor
  before: z.string().optional(), // backward cursor
  start: z
    .number()
    .optional()
    .transform((v) => v ?? 0), // display offset, defaults to 0
});

export type CursorValue = z.infer<typeof cursorValueSchema>;

/**
 * Cursors as object/map for grouped pagination: { [groupKey]: CursorValue }
 * Example: { "Electronics": { after: "..." }, "Clothing": { after: "..." } }
 *
 * Note: Flat pagination uses `cursor` (single CursorValue) instead.
 */
export const cursorsSchema = z.record(z.string(), cursorValueSchema);

export type Cursors = z.infer<typeof cursorsSchema>;

/**
 * Extract after/before for API call.
 * Handles both formats:
 * - CursorValue object: extracts after/before from object
 * - string: treats as forward cursor (after) - for infinite queries
 */
export function getCursorParams(cursor: CursorValue | string | undefined): {
  after: string | undefined;
  before: string | undefined;
} {
  if (typeof cursor === "string") {
    return { after: cursor, before: undefined };
  }
  return {
    after: cursor?.after,
    before: cursor?.before,
  };
}

// ============================================================================
// Pagination Context
// ============================================================================

/**
 * Unified pagination context for cursor-based pagination.
 * Used by pagination components (PagePagination, LoadMorePagination, InfiniteScrollPagination).
 */
export interface PaginationContext {
  /** Display end offset for "Showing X-Y" */
  displayEnd?: number;

  // Item range display ("X-Y of Total")
  /** Display start offset for "Showing X-Y" */
  displayStart?: number;

  // Error state
  /** Error from the request */
  error?: Error | null;
  /** Indicates if total count is capped (e.g., "100+") */
  hasMoreThanMax?: boolean;
  // Navigation
  /** Whether there is a next page */
  hasNext?: boolean;
  /** Whether there is a previous page */
  hasPrev?: boolean;
  /** Whether the request errored */
  isError?: boolean;
  /**
   * isFetching: true when any request is in flight (initial or refetch)
   * Use to show subtle refresh indicators.
   */
  isFetching?: boolean;
  /**
   * isFetchingNextPage: true specifically when loading next page (infinite only)
   * Use for load-more/infinite-scroll spinners.
   */
  isFetchingNextPage?: boolean;

  // Limit/Page size
  /** Number of items per page/batch */
  limit?: Limit;
  /** Callback to change limit/batch size */
  onLimitChange?: (limit: Limit) => void;
  /** Callback to navigate to next page */
  onNext?: () => void;
  /** Callback to navigate to previous page */
  onPrev?: () => void;
  /** Total count of items in current group/view */
  totalCount?: number;
}
