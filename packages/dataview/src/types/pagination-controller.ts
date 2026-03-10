/**
 * Controller types for data view hooks.
 *
 * These controller interfaces define the shape of config objects returned by controller hooks.
 * They contain query factories - actual URL state is managed by QueryBridge.
 */

import type {
  GroupConfigInput,
  Limit,
  SortQuery,
  WhereNode,
} from "@sparkyidea/shared/types";
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
 * Infinite query options for group pagination.
 * Compatible with both manual query options and tRPC's infiniteQueryOptions.
 * The actual type is flexible to accommodate different query library return types.
 */
export interface InfiniteGroupQueryOptions {
  queryKey: readonly unknown[];
  // biome-ignore lint/suspicious/noExplicitAny: Must accept various query library return types
  [key: string]: any;
}

/**
 * Params for group query options factory.
 * Mirrors data query params for consistency (filter, search affect group counts).
 */
export interface GroupQueryOptionsFactoryParams {
  filter: WhereNode[] | null;
  groupConfig: GroupConfigInput;
  /** Whether to hide groups with 0 items (defaults to false) */
  hideEmpty: boolean;
  search: string;
}

/**
 * Query options factory for fetching group counts with pagination.
 * Called by QueryBridge when group mode is active.
 * Returns InfiniteGroupQueryOptions for cursor-based group pagination.
 */
export type GroupQueryOptionsFactory = (
  params: GroupQueryOptionsFactoryParams
) => InfiniteGroupQueryOptions;

/**
 * Params for column query options factory.
 * Mirrors group query params for consistency.
 */
export interface ColumnQueryOptionsFactoryParams {
  columnConfig: GroupConfigInput;
  filter: WhereNode[] | null;
  /** Whether to hide columns with 0 items (defaults to false) */
  hideEmpty: boolean;
  search: string;
}

/**
 * Query options factory for fetching column counts (board-specific).
 * Called by QueryBridge when column mode is active.
 */
export type ColumnQueryOptionsFactory = (
  params: ColumnQueryOptionsFactoryParams
) => BaseQueryOptions;

// ============================================================================
// Page Controller
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
 * Config object returned by usePageController.
 *
 * Contains query factories. Defaults are passed to DataViewProvider.
 */
export interface PageController<TQueryOptions> {
  /** Factory for fetching column counts (board-specific, enables column mode) */
  readonly columnQuery?: ColumnQueryOptionsFactory;

  /** Factory for fetching data items */
  readonly dataQuery: PageQueryOptionsFactory<TQueryOptions>;

  /** Factory for fetching group counts (enables grouped mode) */
  readonly groupQuery?: GroupQueryOptionsFactory;

  readonly type: "page";
}

// ============================================================================
// Infinite Controller
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
 * Config object returned by useInfiniteController.
 *
 * Contains query factories. Defaults are passed to DataViewProvider.
 */
export interface InfiniteController<TQueryOptions> {
  /** Factory for fetching column counts (board-specific, enables column mode) */
  readonly columnQuery?: ColumnQueryOptionsFactory;

  /** Factory for fetching data items */
  readonly dataQuery: InfiniteQueryOptionsFactory<TQueryOptions>;

  /** Factory for fetching group counts (enables grouped mode) */
  readonly groupQuery?: GroupQueryOptionsFactory;

  readonly type: "infinite";
}

/**
 * Union type for any controller.
 */
export type Controller<TQueryOptions> =
  | PageController<TQueryOptions>
  | InfiniteController<TQueryOptions>;
