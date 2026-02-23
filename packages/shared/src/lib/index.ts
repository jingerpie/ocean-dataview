// biome-ignore lint/performance/noBarrelFile: Shared lib public API
export {
  type ProductGroupableColumn,
  productGroupableColumns,
} from "./groupable-columns";
export {
  // TRPC zod schema
  createSearchParamsSchema,
  // Types
  type GroupByConfigInput,
  type GroupConfigInput,
  groupPaginationParams, // grouped pagination
  // Server-side NUQS parsers
  paginationParams, // flat pagination
  // Client-side parsers
  parseAsCursor, // flat pagination
  parseAsCursors, // grouped pagination
  parseAsExpanded, // expanded groups (view-level)
  parseAsFilter, // new filter (recursive AND/OR)
  parseAsGroupBy, // groupBy config
  parseAsSort,
} from "./search-params";
