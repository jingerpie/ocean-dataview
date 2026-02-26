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
export type { GroupingMode, GroupingParams } from "./use-grouping-params";
export { useGroupingParams } from "./use-grouping-params";
export { useInteractiveLegend } from "./use-interactive-legend";
export { useSearchParams } from "./use-search-params";
export { useSimpleFilterChip } from "./use-simple-filter-chip";
export { useSortBuilder } from "./use-sort-builder";
export { useSortParams } from "./use-sort-params";
export { useSubGroupParams } from "./use-subgroup-params";
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

// useInfinitePagination (Legacy) - Direct data return pattern
export type {
  GroupByOptions,
  GroupInfo,
  InfinitePaginationResult,
  InfinitePaginationState as LegacyInfinitePaginationState,
  InfiniteQueryOptions as LegacyInfiniteQueryOptions,
  UseInfinitePaginationOptions as LegacyUseInfinitePaginationOptions,
} from "./use-infinite-pagination";
export { useInfinitePagination as useInfinitePaginationLegacy } from "./use-infinite-pagination";
// useInfinitePagination (New) - Infinite scroll with merged DataViewProvider (primary API)
export type {
  InfiniteGroupInfo,
  InfinitePaginationState,
  InfiniteQueryOptions,
  MergedInfiniteDataViewProviderProps,
  UseInfinitePaginationOptions,
  UseInfinitePaginationResult,
} from "./use-infinite-pagination-new";
export {
  FLAT_GROUP_KEY as INFINITE_FLAT_GROUP_KEY,
  useInfinitePagination,
} from "./use-infinite-pagination-new";

// usePagePagination - Page navigation with merged DataViewProvider (primary API)
export type {
  MergedDataViewProviderProps,
  PageGroupInfo,
  PagePaginationState,
  PageQueryOptions,
  UsePagePaginationOptions,
  UsePagePaginationResult,
} from "./use-page-pagination";
export { FLAT_GROUP_KEY, usePagePagination } from "./use-page-pagination";

// ============================================================================
// Internal Exports (used by pagination hooks internally)
// ============================================================================

// Page pagination internals
export { useGroupPaginationContext } from "../lib/providers/group-pagination-provider";
// Infinite pagination internals
export { useInfinitePaginationContext } from "../lib/providers/infinite-pagination-provider";
export type {
  GroupPaginationControls,
  GroupQueryState,
  UseGroupQueryOptions,
  UseGroupQueryResult,
} from "./use-group-query";
export { useGroupQuery } from "./use-group-query";
export type {
  InfiniteGroupPaginationControls,
  InfiniteGroupQueryState,
  UseInfiniteGroupQueryOptions,
  UseInfiniteGroupQueryResult,
} from "./use-infinite-group-query";
export { useInfiniteGroupQuery } from "./use-infinite-group-query";
