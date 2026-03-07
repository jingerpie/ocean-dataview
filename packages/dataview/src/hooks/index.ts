// biome-ignore lint/performance/noBarrelFile: Intentional public API barrel file
export { useAdvanceFilterBuilder } from "./use-advance-filter-builder";
export { useCallbackRef } from "./use-callback-ref";
export { useChartTransform } from "./use-chart-transform";
export { useColumnParams } from "./use-column-params";
export { useDebouncedCallback } from "./use-debounced-callback";
export { useDisplayProperties } from "./use-display-properties";
export { useFilterParams } from "./use-filter-params";
export type {
  GroupConfig,
  GroupedDataItem,
  UseGroupConfigOptions,
  UseGroupConfigResult,
} from "./use-group-config";

/** Unified group info type (use this when code works with both page and infinite pagination) */
export type GroupInfo<TData> =
  | import("./use-page-controller").PageGroupInfo<TData>
  | import("./use-infinite-controller").InfiniteGroupInfo<TData>;
// Base query options type (used by both pagination types)
export type { BaseQueryOptions } from "../types/pagination-controller";
export { useGroupConfig } from "./use-group-config";
export { useGroupParams } from "./use-group-params";
export type { GroupingMode, GroupingParams } from "./use-grouping-params";
export { useGroupingParams } from "./use-grouping-params";
// ============================================================================
// Controller Hooks - 2 unified hooks for all data view use cases
// ============================================================================
// useInfiniteController - Infinite scroll pagination (returns controller)
export type {
  InfiniteGroupInfo,
  InfinitePaginationState,
  InfiniteQueryOptions,
  InfiniteQueryOptionsFactoryParams,
  UseInfiniteControllerOptions,
  UseInfiniteControllerResult,
} from "./use-infinite-controller";
export { useInfiniteController } from "./use-infinite-controller";
export { useInteractiveLegend } from "./use-interactive-legend";
export { useIntersectionObserver } from "./use-intersection-observer";
// usePageController - Page navigation pagination (returns controller)
export type {
  PageGroupInfo,
  PagePaginationState,
  PageQueryOptionsFactoryParams,
  UsePageControllerOptions,
  UsePageControllerResult,
} from "./use-page-controller";
export { usePageController } from "./use-page-controller";
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
// Internal Exports (used by pagination hooks internally)
// ============================================================================

// Query controller context (used by useGroupQuery and useInfiniteGroupQuery)
export { useQueryControllerContext } from "../lib/providers/query-bridge";
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
