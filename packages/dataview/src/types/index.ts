// biome-ignore-all lint/performance/noBarrelFile: Intentional public API barrel file

// Export action types
export type { BulkAction } from "./action.type";
// Export chart types
export * from "./chart.type";
// Export config
export { DATA_TABLE_CONFIG, type DataTableConfig } from "./config";
// Export filter types
export {
  conditionValues,
  type FilterCondition,
  isWhereExpression,
  isWhereRule,
  type Option,
  type PropertyType,
  type SearchQuery,
  type SortQuery,
  searchQuerySchema,
  type WhereExpression,
  type WhereNode,
  type WhereRule,
  whereExpressionSchema,
  whereNodeSchema,
  whereRuleSchema,
} from "./filter.type";
// Export group types
export {
  type CheckboxGroupByConfig,
  type ColumnConfigInput,
  type ColumnConfigInputSchema,
  columnConfigInputSchema,
  type DateGroupByConfig,
  type DateShowAs,
  dateShowAsSchema,
  type GroupablePropertyType,
  type GroupByConfig,
  type GroupByConfigSchema,
  type GroupConfigInput,
  type GroupConfigInputSchema,
  type GroupOptions,
  groupByConfigSchema,
  groupConfigInputSchema,
  groupOptionsSchema,
  groupSortSchema,
  type MultiSelectGroupByConfig,
  type NumberGroupByConfig,
  type NumberRange,
  numberRangeSchema,
  type ParsedGroupConfig,
  propertyTypeSchema,
  type SelectGroupByConfig,
  type StatusGroupByConfig,
  type StatusShowAs,
  statusShowAsSchema,
  type TextGroupByConfig,
  type TextShowAs,
  textShowAsSchema,
  toParsedGroupConfig,
  type WeekStartDay,
  weekStartDaySchema,
} from "./group.type";
// Export pagination types
export {
  type Cursors,
  type CursorValue,
  cursorsSchema,
  cursorValueSchema,
  getCursorParams,
  LIMIT_OPTIONS,
  type Limit,
  type PaginationContext,
} from "./pagination";

// Export controller types
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

// Export pagination response types
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

// Export property types
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
