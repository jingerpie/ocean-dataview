import { getTableColumns, type Table } from "drizzle-orm";
import { createParser, createSearchParamsCache } from "nuqs/server";
import { z } from "zod";
import { searchQuerySchema, whereNodeSchema } from "../types/filter.type";
import {
  cursorValueSchema,
  LIMIT_OPTIONS,
  type Limit,
} from "../types/pagination.type";
import { filterServerParser } from "../utils/parsers/filter";
import { groupServerParser } from "../utils/parsers/group";
import {
  cursorsServerParser,
  expandedServerParser,
} from "../utils/parsers/pagination";
import { sortServerParser } from "../utils/parsers/sort";

// ============================================================================
// Server-side Limit Parser
// ============================================================================

const parseAsLimit = createParser({
  parse: (value: string): Limit | null => {
    const num = Number.parseInt(value, 10);
    if (LIMIT_OPTIONS.includes(num as Limit)) {
      return num as Limit;
    }
    return null;
  },
  serialize: (value: Limit) => String(value),
});

// ============================================================================
// Server-side Search Parser
// ============================================================================

const parseAsSearch = createParser({
  parse: (v) => (typeof v === "string" ? v : ""),
  serialize: (v) => v,
}).withDefault("");

// ============================================================================
// Server-side Search Params Caches (for RSC)
// ============================================================================

const sharedParsers = {
  limit: parseAsLimit.withDefault(25),
  filter: filterServerParser,
  sort: sortServerParser,
  search: parseAsSearch,
  group: groupServerParser,
  subGroup: groupServerParser,
};

/**
 * Flat pagination params for server-side URL parsing.
 * Uses `cursors` with `__ungrouped__` key internally.
 */
export const paginationParams = createSearchParamsCache({
  cursors: cursorsServerParser,
  ...sharedParsers,
});

/**
 * Grouped pagination params for server-side URL parsing.
 * `expanded` is a view-level concern (separate from group config).
 */
export const groupPaginationParams = createSearchParamsCache({
  cursors: cursorsServerParser,
  expanded: expandedServerParser,
  ...sharedParsers,
});

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
    // Unified cursors format for page pagination (Record<groupKey, CursorValue>)
    cursors: z.record(z.string(), cursorValueSchema).optional(),
    // Simple cursor string for infinite query pagination (backward compat)
    // infiniteQueryOptions passes pageParam as this string cursor
    cursor: z.string().optional(),
    limit: z.number().int().min(1).max(200).optional().default(25),
    search: searchQuerySchema.nullish(),
    filter: z.array(whereNodeSchema).nullish(),
    sort: z.array(sortEntrySchema).optional().default([]),
  });
};
