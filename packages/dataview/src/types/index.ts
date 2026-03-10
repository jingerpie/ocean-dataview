// biome-ignore-all lint/performance/noBarrelFile: Intentional public API barrel file

// Export group config types (canonical names from @sparkyidea/shared/types)
export type {
  CheckboxGroupByConfig,
  ColumnConfigInput,
  DateGroupByConfig,
  GroupByConfig,
  GroupConfigInput,
  GroupOptions,
  MultiSelectGroupByConfig,
  NumberGroupByConfig,
  ParsedGroupConfig,
  SelectGroupByConfig,
  StatusGroupByConfig,
  TextGroupByConfig,
} from "@sparkyidea/shared/types";
export { toParsedGroupConfig } from "@sparkyidea/shared/types";
// Export action types
export type { BulkAction } from "./action.type";
// Export chart types
export * from "./chart.type";
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
  PaginatedGroupResponse,
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
