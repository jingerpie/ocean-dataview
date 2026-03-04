/**
 * Controller types for pagination hooks.
 *
 * These controller interfaces define the shape of config objects returned by pagination hooks.
 * They contain defaults and configuration - actual URL state is managed by QueryBridge.
 */

import type { Limit, SortQuery, WhereNode } from "@sparkyidea/shared/types";
import type { GroupConfigInput } from "@sparkyidea/shared/utils/parsers/group";
import type { CursorValue } from "./pagination-types";

// ============================================================================
// Base Query Options (minimal interface for useQuery compatibility)
// ============================================================================

/**
 * Minimal query options interface compatible with TRPC's queryOptions.
 * Used for group queries where we only need basic query capabilities.
 */
export interface BaseQueryOptions {
  queryFn?: unknown;
  queryKey: readonly unknown[];
}

// ============================================================================
// Group Query Options Factory
// ============================================================================

/**
 * Query options factory for fetching group counts.
 * Called by QueryBridge when group mode is active.
 * Returns BaseQueryOptions (minimal interface) since group queries have different return types.
 */
export type GroupQueryOptionsFactory = (
  groupConfig: GroupConfigInput
) => BaseQueryOptions;

// ============================================================================
// Page Pagination Controller
// ============================================================================

/**
 * Query options factory params for page-based pagination.
 */
export interface PageQueryOptionsFactoryParams {
  cursor?: CursorValue;
  filter: WhereNode[] | null;
  /** The current group config (null for flat mode) */
  groupConfig: GroupConfigInput | null;
  /** The group key for this query ("__ungrouped__" for flat mode) */
  groupKey: string;
  limit: Limit;
  search: string;
  sort: SortQuery[];
}

/**
 * Query options factory for page-based pagination.
 */
export type PageQueryOptionsFactory<TQueryOptions> = (
  params: PageQueryOptionsFactoryParams
) => TQueryOptions;

/**
 * Config object returned by usePagePagination.
 *
 * Contains query configuration only. Defaults are passed to DataViewProvider.
 */
export interface PagePaginationController<TQueryOptions> {
  /** Factory for fetching group counts (enables grouped mode) */
  readonly groupQueryOptionsFactory?: GroupQueryOptionsFactory;

  /** Factory for fetching data items */
  readonly queryOptionsFactory: PageQueryOptionsFactory<TQueryOptions>;

  readonly type: "page";
}

// ============================================================================
// Infinite Pagination Controller
// ============================================================================

/**
 * Query options factory params for infinite pagination.
 */
export interface InfiniteQueryOptionsFactoryParams {
  filter: WhereNode[] | null;
  /** The current group config (null for flat mode) */
  groupConfig: GroupConfigInput | null;
  /** The group key for this query ("__ungrouped__" for flat mode) */
  groupKey: string;
  limit: Limit;
  search: string;
  sort: SortQuery[];
}

/**
 * Query options factory for infinite pagination.
 */
export type InfiniteQueryOptionsFactory<TQueryOptions> = (
  params: InfiniteQueryOptionsFactoryParams
) => TQueryOptions;

/**
 * Config object returned by useInfinitePagination.
 *
 * Contains query configuration only. Defaults are passed to DataViewProvider.
 */
export interface InfinitePaginationController<TQueryOptions> {
  /** Factory for fetching group counts (enables grouped mode) */
  readonly groupQueryOptionsFactory?: GroupQueryOptionsFactory;

  /** Factory for fetching data items */
  readonly queryOptionsFactory: InfiniteQueryOptionsFactory<TQueryOptions>;

  readonly type: "infinite";
}

/**
 * Union type for any pagination controller.
 */
export type PaginationController<TQueryOptions> =
  | PagePaginationController<TQueryOptions>
  | InfinitePaginationController<TQueryOptions>;
