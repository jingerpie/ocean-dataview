// biome-ignore lint/performance/noBarrelFile: Intentional public API barrel file
export { useAdvanceFilterBuilder } from "./use-advance-filter-builder";
export { useCallbackRef } from "./use-callback-ref";
export { useChartTransform } from "./use-chart-transform";
export { useDebouncedCallback } from "./use-debounced-callback";
export { useDisplayProperties } from "./use-display-properties";
export { useFilterParams } from "./use-filter-params";
export type {
  GroupConfig,
  GroupedDataItem,
  UseGroupConfigOptions,
  UseGroupConfigResult,
} from "./use-group-config";
export { useGroupConfig } from "./use-group-config";
export { useGroupParams } from "./use-group-params";
export { useInteractiveLegend } from "./use-interactive-legend";
export { useSearchParams } from "./use-search-params";
export { useSimpleFilterChip } from "./use-simple-filter-chip";
export { useSortBuilder } from "./use-sort-builder";
export { useSortParams } from "./use-sort-params";
export type {
  UseToolbarStateOptions,
  UseToolbarStateReturn,
} from "./use-toolbar-state";
export { useToolbarState } from "./use-toolbar-state";
export type { UseViewSetupOptions, UseViewSetupResult } from "./use-view-setup";
export { useViewSetup } from "./use-view-setup";

// ============================================================================
// Pagination Hooks - 2 unified hooks for all pagination use cases
// ============================================================================

// useInfinitePagination - Infinite scroll / load-more (flat + grouped)
export type {
  GroupByOptions,
  GroupInfo,
  InfinitePaginationResult,
  InfinitePaginationState,
  InfiniteQueryOptions,
  UseInfinitePaginationOptions,
} from "./use-infinite-pagination";
export { useInfinitePagination } from "./use-infinite-pagination";

// usePagePagination - Page navigation (flat + grouped)
export type {
  PageGroupByOptions,
  PageGroupInfo,
  PagePaginationResult,
  PagePaginationState,
  PageQueryOptions,
  UsePagePaginationOptions,
} from "./use-page-pagination";
export { usePagePagination } from "./use-page-pagination";
