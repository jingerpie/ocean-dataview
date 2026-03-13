import {
  columnServerParser,
  cursorsServerParser,
  expandedServerParser,
  filterServerParser,
  groupServerParser,
  limitServerParser,
  sortServerParser,
} from "@sparkyidea/dataview/parsers";
import { getTableColumns, type Table } from "drizzle-orm";
import { createParser, createSearchParamsCache } from "nuqs/server";
import { z } from "zod";
import { searchQuerySchema, whereNodeSchema } from "../types/filter.type";
import type { Limit } from "../types/pagination.type";
import { cursorValueSchema } from "../types/pagination.type";

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

// ============================================================================
// TRPC Zod Schema (for input validation)
// ============================================================================

/**
 * Creates a Zod schema for TRPC input validation.
 * Extracts column names from the Drizzle table for type-safe property validation.
 *
 * NOTE: Uses simple schema without .catch()/.transform() chains to preserve
 * TypeScript inference for infiniteQueryOptions compatibility.
 */
export const createSearchParamsSchema = (table: Table) => {
  const columnNames = Object.keys(getTableColumns(table)) as [
    string,
    ...string[],
  ];

  const sortEntrySchema = z.object({
    property: z.enum(columnNames),
    direction: z.enum(["asc", "desc"]),
  });

  return z.object({
    // Cursor for page-based (CursorValue) or infinite scroll (string)
    // getCursorParams() handles both formats
    cursor: z.union([cursorValueSchema, z.string()]).optional(),
    limit: z.number().int().min(1).max(100).optional().default(25),
    search: searchQuerySchema.nullish(),
    filter: z.array(whereNodeSchema).nullish(),
    sort: z.array(sortEntrySchema).optional().default([]),
  });
};
