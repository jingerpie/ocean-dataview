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
// Response Types
// ============================================================================

/**
 * Base paginated response shape from API.
 * Used by infinite pagination (forward-only navigation).
 */
export interface BasePaginatedResponse<TData> {
  endCursor?: string | number | null;
  hasNextPage?: boolean;
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
