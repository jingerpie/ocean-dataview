// Export all property types

// Export action types
export type { BulkAction } from "./action.type";
// Export chart types
// biome-ignore lint/performance/noBarrelFile: Intentional public API barrel file
export * from "./chart.type";
// Export pagination types
export {
  LIMIT_OPTIONS,
  type Limit,
  type PaginationContext,
} from "./pagination";
export type {
  BasePaginatedResponse,
  BidirectionalPaginatedResponse,
  GroupCountInfo,
  GroupCounts,
  InferItemsFromQueryOptions,
  ViewCounts,
} from "./pagination-types";
export * from "./property.type";

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
