// Export all property types

// Export action types
export type { BulkAction } from "./action.type";
// Export chart types
// biome-ignore lint/performance/noBarrelFile: Intentional public API barrel file
export * from "./chart.type";
// Export group config types
export type {
  CheckboxGroupConfig,
  ColumnConfig,
  DateGroupConfig,
  GroupByConfig,
  GroupConfig,
  MultiSelectGroupConfig,
  NumberGroupConfig,
  SelectGroupConfig,
  SharedGroupOptions,
  StatusGroupConfig,
  TextGroupConfig,
} from "./group-types";
// Export pagination types
export {
  LIMIT_OPTIONS,
  type Limit,
  type PaginationContext,
} from "./pagination";
export type {
  BaseQueryOptions,
  Controller,
  GroupQueryOptionsFactory,
  InfiniteController,
  InfiniteQueryOptionsFactory,
  InfiniteQueryOptionsFactoryParams,
  PageController,
  PageQueryOptionsFactory,
  PageQueryOptionsFactoryParams,
} from "./pagination-controller";
export type {
  BasePaginatedResponse,
  BidirectionalPaginatedResponse,
  GroupCountInfo,
  GroupCounts,
  GroupSortValues,
  InferItemsFromQueryOptions,
  ViewCounts,
} from "./pagination-types";
export * from "./property.type";
// TanStack Table type augmentation (for ColumnMeta)
import "./table.type";

// Pagination result interface
export interface PaginationResult<T> {
  currentPage: number;
  data: T[];
  hasNext: boolean;
  hasPrev: boolean;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

// Grouped data interface
export interface GroupedData<T> {
  [key: string]: T[];
}
