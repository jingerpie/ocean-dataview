import { getTableColumns, type Table } from "drizzle-orm";
import {
  createParser,
  createSearchParamsCache,
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
} from "../types/filter.type";
import {
  type Cursors,
  type CursorValue,
  cursorValueSchema,
  LIMIT_OPTIONS,
  type Limit,
} from "../types/pagination.type";
import { validateFilter } from "../utils/filter-validation";
import { validateSort } from "../utils/sort-validation";

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

// ============================================================================
// GroupBy URL Transformation Helpers
// ============================================================================

/**
 * GroupBy URL format (compact positional arrays):
 *   ["select", property]
 *   ["status", property, showAs]
 *   ["date", property, showAs, startWeekOn?]
 *   ["checkbox", property]
 *   ["multiSelect", property]
 *   ["text", property, showAs?]
 *   ["number", property, min, max, step]
 *
 * Code format (discriminated union):
 *   { bySelect: { property } }
 *   { byStatus: { property, showAs } }
 *   etc.
 */

export type GroupByConfigInput =
  | { bySelect: { property: string } }
  | { byStatus: { property: string; showAs: "option" | "group" } }
  | {
      byDate: {
        property: string;
        showAs: "day" | "week" | "month" | "year" | "relative";
        startWeekOn?: "monday" | "sunday";
      };
    }
  | { byCheckbox: { property: string } }
  | { byMultiSelect: { property: string } }
  | { byText: { property: string; showAs?: "exact" | "alphabetical" } }
  | {
      byNumber: {
        property: string;
        showAs?: { range: [number, number]; step: number };
      };
    };

/**
 * Transform URL positional array to GroupByConfig object.
 * Structural validation only - tRPC validates business logic.
 */
const transformUrlToGroupConfig = (url: unknown): GroupByConfigInput | null => {
  if (!Array.isArray(url) || url.length < 2) {
    return null;
  }

  const [type, property, ...rest] = url;

  if (typeof type !== "string" || typeof property !== "string") {
    return null;
  }

  switch (type) {
    case "select":
      return { bySelect: { property } };

    case "status": {
      const showAs = (rest[0] as "option" | "group") ?? "option";
      return { byStatus: { property, showAs } };
    }

    case "date": {
      const showAs =
        (rest[0] as "day" | "week" | "month" | "year" | "relative") ?? "day";
      const startWeekOn = rest[1] as "monday" | "sunday" | undefined;
      return startWeekOn
        ? { byDate: { property, showAs, startWeekOn } }
        : { byDate: { property, showAs } };
    }

    case "checkbox":
      return { byCheckbox: { property } };

    case "multiSelect":
      return { byMultiSelect: { property } };

    case "text": {
      const showAs = (rest[0] as "exact" | "alphabetical") ?? "exact";
      return { byText: { property, showAs } };
    }

    case "number": {
      const [min, max, step] = rest;
      if (
        typeof min === "number" &&
        typeof max === "number" &&
        typeof step === "number"
      ) {
        return {
          byNumber: { property, showAs: { range: [min, max], step } },
        };
      }
      // No range specified - exact number grouping
      return { byNumber: { property } };
    }

    default:
      return null;
  }
};

/**
 * Transform GroupByConfig object to URL positional array.
 */
const transformGroupConfigToUrl = (config: GroupByConfigInput): unknown[] => {
  if ("bySelect" in config) {
    return ["select", config.bySelect.property];
  }
  if ("byStatus" in config) {
    return ["status", config.byStatus.property, config.byStatus.showAs];
  }
  if ("byDate" in config) {
    const { property, showAs, startWeekOn } = config.byDate;
    return startWeekOn
      ? ["date", property, showAs, startWeekOn]
      : ["date", property, showAs];
  }
  if ("byCheckbox" in config) {
    return ["checkbox", config.byCheckbox.property];
  }
  if ("byMultiSelect" in config) {
    return ["multiSelect", config.byMultiSelect.property];
  }
  if ("byText" in config) {
    const { property, showAs } = config.byText;
    return showAs && showAs !== "exact"
      ? ["text", property, showAs]
      : ["text", property];
  }
  if ("byNumber" in config) {
    const { property, showAs } = config.byNumber;
    if (showAs) {
      return ["number", property, ...showAs.range, showAs.step];
    }
    return ["number", property];
  }
  return [];
};

/**
 * GroupBy validator - structural check only, tRPC validates property names.
 */
const groupByValidator = (value: unknown): GroupByConfigInput | null => {
  return transformUrlToGroupConfig(value);
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

// ============================================================================
// 2. Server-side NUQS Parsers (for URL params in RSC)
// ============================================================================

/**
 * Parse limit from URL, validating against allowed values.
 * Returns null for invalid values (handled by .withDefault).
 */
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

const sharedParsers = {
  limit: parseAsLimit.withDefault(25),
  filter: parseAsJson(filterValidator),
  sort: parseAsJson(sortValidator).withDefault([]),
  search: createParser({
    parse: (v) => (typeof v === "string" ? v : ""),
    serialize: (v) => v,
  }).withDefault(""),
  group: parseAsJson(groupByValidator),
  subGroup: parseAsJson(groupByValidator),
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
  expanded: parseAsJson(expandedValidator).withDefault([]),
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

export const parseAsGroupBy = createParser({
  parse: (value: string): GroupByConfigInput | null => {
    try {
      const parsed = JSON.parse(value);
      return groupByValidator(parsed);
    } catch {
      return null;
    }
  },
  serialize: (value: GroupByConfigInput) =>
    JSON.stringify(transformGroupConfigToUrl(value)),
});
