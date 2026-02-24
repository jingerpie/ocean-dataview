import { getTableColumns, type Table } from "drizzle-orm";
import { createParser, createSearchParamsCache } from "nuqs/server";
import { z } from "zod";
import { searchQuerySchema, whereNodeSchema } from "../types/filter.type";
import {
  cursorValueSchema,
  LIMIT_OPTIONS,
  type Limit,
} from "../types/pagination.type";
import { validateFilter } from "../utils/filter-validation";
import { filterServerParser } from "../utils/parsers/filter";
import { groupServerParser } from "../utils/parsers/group";
import {
  cursorServerParser,
  cursorsServerParser,
  expandedServerParser,
} from "../utils/parsers/pagination";
import { sortServerParser } from "../utils/parsers/sort";
import { validateSort } from "../utils/sort-validation";

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
 */
export const paginationParams = createSearchParamsCache({
  cursor: cursorServerParser,
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
 * Uses .catch() for graceful degradation - invalid values fall back to defaults.
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
    cursor: z.union([cursorValueSchema, z.string()]).nullish().catch(null),
    limit: z.number().int().min(1).max(200).catch(25),
    search: searchQuerySchema.nullish().catch(null),
    filter: z
      .array(whereNodeSchema)
      .nullish()
      .catch(null)
      .transform((f) => (f ? validateFilter(f) : null)),
    sort: z
      .array(sortEntrySchema)
      .default([])
      .catch([])
      .transform(validateSort),
  });
};
