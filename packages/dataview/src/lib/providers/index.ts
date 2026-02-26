// Chart providers
export type { ChartViewContextValue } from "./chart-view-context";
// biome-ignore lint/performance/noBarrelFile: Intentional public API barrel file
export { ChartViewContext, useChartViewContext } from "./chart-view-context";
export type { ChartViewProviderProps } from "./chart-view-provider";
export { ChartViewProvider } from "./chart-view-provider";
export type {
  DataViewContextValue,
  GroupConfig,
  PaginationOutput,
  SubGroupConfig,
} from "./data-view-context";
export { DataViewContext, useDataViewContext } from "./data-view-context";
export type { DataViewProviderProps } from "./data-view-provider";
export { DataViewProvider } from "./data-view-provider";
// Note: GroupPaginationProvider is internal - use usePagePagination hook instead
// Internal exports for the pagination hooks
export {
  type GroupCounts,
  type GroupPaginationContextValue,
  GroupPaginationProvider,
  type GroupPaginationProviderProps,
  type QueryOptionsFactory,
  useGroupPaginationContext,
} from "./group-pagination-provider";

// Note: InfinitePaginationProvider is internal - use useInfinitePagination hook instead
export {
  type InfiniteGroupQueryOptions,
  type InfinitePaginationContextValue,
  InfinitePaginationProvider,
  type InfinitePaginationProviderProps,
  type InfiniteQueryOptionsFactory,
  useInfinitePaginationContext,
} from "./infinite-pagination-provider";
