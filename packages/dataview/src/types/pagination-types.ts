/**
 * Shared types for pagination hooks.
 *
 * This file contains common type definitions used across all pagination hooks:
 * - usePagePagination (flat page-based)
 * - useInfinitePagination (flat infinite scroll)
 * - useGroupPagePagination (grouped page-based)
 * - useGroupInfinitePagination (grouped infinite scroll)
 */

// ============================================================================
// Cursor Types
// ============================================================================

/**
 * Cursor value for a single group.
 * Contains information for navigating to a specific position in the result set.
 */
export interface CursorValue {
  /** Cursor string for forward pagination */
  after?: string;
  /** Cursor string for backward pagination */
  before?: string;
  /** 0-indexed start position for display calculations */
  start: number;
}

/**
 * Map of group keys to cursor values.
 * Used by page-based pagination to track cursor state per group.
 */
export type Cursors = Record<string, CursorValue>;

// ============================================================================
// Response Types
// ============================================================================

/**
 * Base paginated response shape from API.
 * Used by infinite pagination (forward-only navigation).
 *
 * For getManyByGroup queries, hasNextPage and endCursor are Record<string, ...>
 * where keys are group keys (column keys for board views).
 */
export interface BasePaginatedResponse<TData> {
  endCursor?: string | number | null | Record<string, string | number | null>;
  hasNextPage?: boolean | Record<string, boolean>;
  items: TData[];
}

/**
 * Bidirectional paginated response shape from API.
 * Used by page-based pagination (Prev/Next navigation).
 */
export interface BidirectionalPaginatedResponse<TData>
  extends BasePaginatedResponse<TData> {
  hasPreviousPage?: boolean;
  startCursor?: string | null;
}

// ============================================================================
// Group Types
// ============================================================================

/**
 * Single group count info.
 */
export interface GroupCountInfo {
  count: number;
  hasMore: boolean;
}

/**
 * Group counts format from API.
 * Used by grouped pagination hooks and DataViewProvider.
 */
export interface GroupCounts {
  [key: string]: GroupCountInfo;
}

/**
 * Sort values for group ordering from server.
 */
export interface GroupSortValues {
  [key: string]: string | number;
}

/**
 * Combined counts for DataViewProvider.
 * - group: Primary grouping counts (column headers in BoardView, group headers in other views)
 * - subGroup: Secondary grouping counts (row headers in BoardView with sub-groups)
 * - groupSortValues: Sort values for ordering groups (from server-side grouping)
 */
export interface ViewCounts {
  group: GroupCounts;
  groupSortValues?: GroupSortValues;
  subGroup?: GroupCounts;
  subGroupSortValues?: GroupSortValues;
}

// ============================================================================
// Type Inference Utilities
// ============================================================================

/**
 * Infer item type from query options' queryFn return type.
 * Extracts TData from { items: TData[], ... } response shape.
 *
 * Works with both TRPC's queryOptions and infiniteQueryOptions return types.
 */
export type InferItemsFromQueryOptions<T> = T extends {
  // biome-ignore lint/suspicious/noExplicitAny: TRPC returns complex types
  queryFn?: (...args: any[]) => Promise<infer R> | infer R;
}
  ? R extends { items: (infer U)[] }
    ? U
    : never
  : never;
