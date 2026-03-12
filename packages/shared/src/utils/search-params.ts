import {
  columnServerParser,
  cursorsServerParser,
  expandedServerParser,
  filterServerParser,
  groupServerParser,
  limitServerParser,
  sortServerParser,
} from "@sparkyidea/dataview/parsers";
import type { Limit } from "@sparkyidea/dataview/types";
import { createParser, createSearchParamsCache } from "nuqs/server";

// ============================================================================
// Types
// ============================================================================

export interface DataViewParserOptions {
  /** Default limit value (default: 25) */
  limitDefault?: Limit;
}

// ============================================================================
// Default Search Parser
// ============================================================================

const defaultSearchParser = createParser({
  parse: (v) => v ?? "",
  serialize: (v) => v,
}).withDefault("");

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a search params cache for DataView pages.
 *
 * Uses pure parsers from dataview (no validation during parse).
 * Validation is done separately using validateFilter/validateSort after parsing.
 *
 * @example
 * ```ts
 * export const paginationParams = createDataViewParamsCache();
 *
 * // In your component:
 * const { filter, sort } = paginationParams.parse(params);
 * const validatedFilter = validateFilter(filter, properties);
 * const validatedSort = validateSort(sort, properties);
 * ```
 */
export function createDataViewParamsCache(options?: DataViewParserOptions) {
  return createSearchParamsCache({
    column: columnServerParser,
    cursors: cursorsServerParser,
    expanded: expandedServerParser,
    filter: filterServerParser,
    group: groupServerParser,
    limit: limitServerParser.withDefault(options?.limitDefault ?? 25),
    search: defaultSearchParser,
    sort: sortServerParser.withDefault([]),
  });
}

/**
 * Type helper to extract parsed params type from a cache.
 */
export type InferParamsType<
  T extends ReturnType<typeof createSearchParamsCache>,
> = Awaited<ReturnType<T["parse"]>>;
