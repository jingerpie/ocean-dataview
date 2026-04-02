import { createParser } from "nuqs/server";
import {
  decodeTupleStrings,
  splitRespectingParens,
} from "../lib/url-dsl/decoder";
import { encodeTuple } from "../lib/url-dsl/encoder";
import type { SortQuery } from "../types/sort.type";

// ============================================================================
// DSL Format
// ============================================================================
// URL: name.asc,price.desc
// Code: [{ property: "name", direction: "asc" }, { property: "price", direction: "desc" }]

// ============================================================================
// Encoder/Decoder
// ============================================================================

/**
 * Encode sort queries to DSL format.
 * Example: [{ property: "name", direction: "asc" }] → "name.asc"
 */
export function encodeSort(sort: SortQuery[]): string {
  if (sort.length === 0) {
    return "";
  }
  return sort.map((s) => encodeTuple([s.property, s.direction])).join(",");
}

/**
 * Decode DSL format to sort queries.
 * Example: "name.asc,price.desc" → [{ property: "name", direction: "asc" }, ...]
 */
export function decodeSort(value: string): SortQuery[] | null {
  if (!value) {
    return null;
  }

  const items = splitRespectingParens(value, ",");
  const result: SortQuery[] = [];

  for (const item of items) {
    const parts = decodeTupleStrings(item);
    if (parts.length !== 2) {
      continue;
    }

    const property = parts[0];
    const direction = parts[1];
    if (!property || (direction !== "asc" && direction !== "desc")) {
      continue;
    }

    result.push({ property, direction });
  }

  return result.length > 0 ? result : null;
}

// ============================================================================
// Validator
// ============================================================================

/**
 * Validate and transform sort from URL.
 */
export function sortValidator(value: unknown): SortQuery[] | null {
  if (typeof value !== "string" || !value) {
    return null;
  }
  return decodeSort(value);
}

// ============================================================================
// Parsers
// ============================================================================

/** Server-side parser for sort (no column validation, no default) */
export const sortServerParser = createParser<SortQuery[] | null>({
  parse: sortValidator,
  serialize: (value: SortQuery[] | null) => (value ? encodeSort(value) : ""),
});

/** Client-side parser for sort (no column validation) */
export const parseAsSort = createParser<SortQuery[] | null>({
  parse: (value: string): SortQuery[] | null => sortValidator(value),
  serialize: (value: SortQuery[] | null) => (value ? encodeSort(value) : ""),
});
