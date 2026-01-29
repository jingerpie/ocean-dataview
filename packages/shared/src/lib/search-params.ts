import {
  createParser,
  createSearchParamsCache,
  parseAsInteger,
  parseAsJson,
} from "nuqs/server";
import { z } from "zod";
import {
  isWhereExpression,
  isWhereRule,
  type SortQuery,
  searchQuerySchema,
  type WhereNode,
  whereNodeSchema,
} from "../types/data-table.type";
import {
  type Cursors,
  type CursorValue,
  cursorValueSchema,
} from "../types/pagination.type";
import { validateFilter } from "../utils/filter-validation";
import { validateSort } from "../utils/sort-validation";

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_LIMIT = 25;

// ============================================================================
// Filter URL Transformation Helpers
// ============================================================================

/**
 * Transform URL node to code node.
 *
 * NUQS validators handle parsing and structural transformation only.
 * Semantic validation (enum values, business rules) happens in tRPC.
 * This avoids redundant validation across RSC and Client paths.
 *
 * URL format uses compact positional arrays for rules:
 *   [property, condition, value?]
 *
 * Code format uses objects:
 *   { property, condition, value? }
 */
const transformUrlToCode = (node: unknown): WhereNode | null => {
  // Rule: positional array [property, condition, value?]
  if (Array.isArray(node)) {
    const [property, condition, value] = node;

    // Only structural checks - let tRPC validate condition enum
    if (typeof property !== "string" || !property) {
      return null;
    }
    if (typeof condition !== "string") {
      return null;
    }

    return { property, condition, value } as WhereNode;
  }

  if (typeof node !== "object" || node === null) {
    return null;
  }

  // Expression: { and: [...] } or { or: [...] }
  if ("and" in node || "or" in node) {
    const expr = node as { and?: unknown[]; or?: unknown[] };
    if (expr.and) {
      const transformedAnd = expr.and
        .map(transformUrlToCode)
        .filter((n): n is WhereNode => n !== null);
      return { and: transformedAnd };
    }
    if (expr.or) {
      const transformedOr = expr.or
        .map(transformUrlToCode)
        .filter((n): n is WhereNode => n !== null);
      return { or: transformedOr };
    }
  }

  return null;
};

/**
 * Transform code node to URL node.
 *
 * Code format uses objects:
 *   { property, condition, value? }
 *
 * URL format uses compact positional arrays for rules:
 *   [property, condition, value?]
 */
const transformCodeToUrl = (node: WhereNode): unknown => {
  if (isWhereRule(node)) {
    // Compact array format: [property, condition, value?]
    // Omit value if null/undefined for shorter URLs
    if (node.value == null) {
      return [node.property, node.condition];
    }
    return [node.property, node.condition, node.value];
  }

  if (isWhereExpression(node)) {
    if (node.and) {
      return { and: node.and.map(transformCodeToUrl) };
    }
    if (node.or) {
      return { or: node.or.map(transformCodeToUrl) };
    }
  }

  return node;
};

// ============================================================================
// Validators (for NUQS JSON parsing)
// ============================================================================

const filterValidator = (value: unknown): WhereNode[] | null => {
  // URL format is just an array (root AND is implicit)
  if (!Array.isArray(value)) {
    return null;
  }

  // Transform URL format to code format
  const transformed = value
    .map(transformUrlToCode)
    .filter((n): n is WhereNode => n !== null);

  return transformed;
};

/**
 * Transform URL sort format to code format.
 * Permissive: drops invalid entries instead of failing entire array.
 *
 * URL format: ["property", "asc"|"desc"]
 * Code format: { property, direction: "asc" | "desc" }
 */
const sortValidator = (value: unknown): SortQuery[] | null => {
  if (!Array.isArray(value)) {
    return null;
  }

  return value
    .map((item) => {
      if (!Array.isArray(item) || item.length !== 2) {
        return null;
      }

      const [property, direction] = item;
      // Only structural checks - let tRPC validate direction enum
      if (typeof property !== "string" || typeof direction !== "string") {
        return null;
      }

      return { property, direction: direction as "asc" | "desc" };
    })
    .filter((s): s is SortQuery => s !== null);
};

/**
 * Cursor validator - structural check only, tRPC validates shape.
 */
const cursorValidator = (value: unknown): CursorValue | null => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  // Just pass through - tRPC validates the shape
  return value as CursorValue;
};

/**
 * Cursors validator - structural check only, tRPC validates shape.
 */
const cursorsValidator = (value: unknown): Cursors | null => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  // Just pass through - tRPC validates the shape
  return value as Cursors;
};

const expandedValidator = (value: unknown): string[] | null => {
  if (!Array.isArray(value)) {
    return null;
  }
  return value.every((v) => typeof v === "string") ? (value as string[]) : null;
};

// ============================================================================
// 1. TRPC Zod Schema (for input validation)
// ============================================================================

/**
 * Schema for sort entries - property is a string, not typed to entity keys.
 * Validation of property names happens at runtime when building queries.
 */
const sortEntrySchema = z.object({
  property: z.string(),
  direction: z.enum(["asc", "desc"]),
});

/**
 * Creates a Zod schema for TRPC input validation.
 * This is the single source of truth for semantic validation.
 * Uses .catch() for graceful degradation - invalid values fall back to defaults.
 */
export const createSearchParamsSchema = <T extends z.ZodRawShape>(
  _schema: z.ZodObject<T>
) => {
  return z.object({
    cursor: z.union([cursorValueSchema, z.string()]).nullish().catch(null),
    limit: z
      .number()
      .int()
      .min(1)
      .max(200)
      .catch(DEFAULT_LIMIT)
      .default(DEFAULT_LIMIT),
    search: searchQuerySchema.nullish().catch(null),
    filter: z
      .array(whereNodeSchema)
      .nullish()
      .catch(null)
      .transform((f) => (f ? validateFilter(f) : null)),
    sort: z
      .array(sortEntrySchema)
      .catch([])
      .default([])
      .transform(validateSort),
  });
};

// ============================================================================
// 2. Server-side NUQS Parsers (for URL params in RSC)
// ============================================================================

const sharedParsers = {
  limit: parseAsInteger.withDefault(DEFAULT_LIMIT),
  filter: parseAsJson(filterValidator),
  sort: parseAsJson(sortValidator).withDefault([]),
  search: createParser({
    parse: (v) => (typeof v === "string" ? v : ""),
    serialize: (v) => v,
  }).withDefault(""),
};

/**
 * Flat pagination params for server-side URL parsing.
 */
export const paginationParams = createSearchParamsCache({
  cursor: parseAsJson(cursorValidator),
  ...sharedParsers,
});

/**
 * Grouped pagination params for server-side URL parsing.
 */
export const groupPaginationParams = createSearchParamsCache({
  cursors: parseAsJson(cursorsValidator).withDefault({}),
  expanded: parseAsJson(expandedValidator),
  ...sharedParsers,
});

// ============================================================================
// 3. Client-side Parsers (for hooks with useQueryState)
// ============================================================================

export const parseAsCursor = createParser({
  parse: (value: string): CursorValue | null => {
    try {
      const parsed = JSON.parse(value);
      return cursorValidator(parsed);
    } catch {
      return null;
    }
  },
  serialize: (value: CursorValue) => JSON.stringify(value),
});

export const parseAsCursors = createParser({
  parse: (value: string): Cursors | null => {
    try {
      const parsed = JSON.parse(value);
      return cursorsValidator(parsed);
    } catch {
      return null;
    }
  },
  serialize: (value: Cursors) => JSON.stringify(value),
});

export const parseAsExpanded = createParser({
  parse: (value: string): string[] | null => {
    try {
      const parsed = JSON.parse(value);
      return expandedValidator(parsed);
    } catch {
      return null;
    }
  },
  serialize: (value: string[]) => JSON.stringify(value),
});

export const parseAsFilter = createParser({
  parse: (value: string): WhereNode[] | null => {
    try {
      const parsed = JSON.parse(value);
      return filterValidator(parsed);
    } catch {
      return null;
    }
  },
  serialize: (value: WhereNode[]) =>
    JSON.stringify(value.map(transformCodeToUrl)),
});

export const parseAsSort = createParser({
  parse: (value: string): SortQuery[] | null => {
    try {
      const parsed = JSON.parse(value);
      return sortValidator(parsed);
    } catch {
      return null;
    }
  },
  // Transform to compact positional array format: ["property", "asc"|"desc"]
  serialize: (value: SortQuery[]) =>
    JSON.stringify(value.map((s) => [s.property, s.direction])),
});
