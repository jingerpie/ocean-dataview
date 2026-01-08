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

// ============================================================================
// Pagination Hooks - 4 main hooks for all pagination use cases
// ============================================================================

// 4. useGroupInfinitePagination - Grouped infinite scroll / load-more
export type {
	GroupInfiniteCounts,
	GroupInfiniteInfo,
	GroupInfinitePaginatedResponse,
	GroupInfinitePaginationResult,
	GroupInfinitePaginationState,
	GroupInfiniteQueryOptions,
	UseGroupInfinitePaginationOptions,
} from "./use-group-infinite-pagination";
export { useGroupInfinitePagination } from "./use-group-infinite-pagination";

// 2. useGroupPagePagination - Grouped page-based pagination (per-group Prev/Next)
export type {
	GroupCounts,
	GroupInfo,
	GroupPagePaginationResult,
	GroupPagePaginationState,
	GroupPageQueryOptions,
	GroupPaginatedResponse,
	UseGroupPagePaginationOptions,
} from "./use-group-page-pagination";
export { useGroupPagePagination } from "./use-group-page-pagination";

// 3. useInfinitePagination - Flat infinite scroll / load-more
export type {
	InfinitePaginatedResponse,
	InfinitePaginationResult,
	InfinitePaginationState,
	InfiniteQueryState,
	UseInfinitePaginationOptions,
} from "./use-infinite-pagination";
export { useInfinitePagination } from "./use-infinite-pagination";
// 1. usePagePagination - Flat page-based pagination (Prev/Next)
export type {
	PagePaginationResult,
	PaginatedResponse,
	UsePagePaginationOptions,
} from "./use-page-pagination";
export { usePagePagination } from "./use-page-pagination";
