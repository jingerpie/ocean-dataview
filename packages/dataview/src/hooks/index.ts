export { useDisplayProperties } from "./use-display-properties";
export { useFilterParams } from "./use-filter-params";
export type {
	GroupConfig,
	GroupedDataItem,
	UseGroupConfigOptions,
	UseGroupConfigResult,
} from "./use-group-config";
export { useGroupConfig } from "./use-group-config";
export { useInteractiveLegend } from "./use-interactive-legend";
export { useSearchParams } from "./use-search-params";
export { useSortParams } from "./use-sort-params";
export type {
	UseViewSetupOptions,
	UseViewSetupResult,
	ViewGroupConfig,
} from "./use-view-setup";
export { useViewSetup } from "./use-view-setup";

// ============================================================================
// Pagination Hooks - 4 main hooks for all pagination use cases
// ============================================================================

// Shared pagination types
// Legacy type aliases for backwards compatibility
// These are re-exported from their original hook files
export type {
	BasePaginatedResponse,
	BasePaginatedResponse as GroupInfinitePaginatedResponse,
	BasePaginatedResponse as InfinitePaginatedResponse,
	BidirectionalPaginatedResponse,
	BidirectionalPaginatedResponse as GroupPaginatedResponse,
	BidirectionalPaginatedResponse as PaginatedResponse,
	GroupCounts,
	GroupCounts as GroupInfiniteCounts,
	InferItemsFromQueryOptions,
} from "./pagination-types";
// 4. useGroupInfinitePagination - Grouped infinite scroll / load-more
export type {
	GroupInfiniteInfo,
	GroupInfinitePaginationResult,
	GroupInfinitePaginationState,
	GroupInfiniteQueryOptions,
	UseGroupInfinitePaginationOptions,
} from "./use-group-infinite-pagination";
export { useGroupInfinitePagination } from "./use-group-infinite-pagination";
// 2. useGroupPagePagination - Grouped page-based pagination (per-group Prev/Next)
export type {
	GroupInfo,
	GroupPagePaginationResult,
	GroupPagePaginationState,
	GroupPageQueryOptions,
	UseGroupPagePaginationOptions,
} from "./use-group-page-pagination";
export { useGroupPagePagination } from "./use-group-page-pagination";
// 3. useInfinitePagination - Flat infinite scroll / load-more
export type {
	InfinitePaginationResult,
	InfinitePaginationState,
	InfiniteQueryState,
	UseInfinitePaginationOptions,
} from "./use-infinite-pagination";
export { useInfinitePagination } from "./use-infinite-pagination";
// 1. usePagePagination - Flat page-based pagination (Prev/Next)
export type {
	PagePaginationResult,
	UsePagePaginationOptions,
} from "./use-page-pagination";
export { usePagePagination } from "./use-page-pagination";
