import { createParser } from "nuqs/server";
import type { SortQuery } from "../../types/filter.type";
import { decodeTupleStrings, splitRespectingParens } from "../url-dsl/decoder";
import { encodeTuple } from "../url-dsl/encoder";

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

/** Server-side parser for sort */
export const sortServerParser = createParser({
  parse: sortValidator,
  serialize: (value: SortQuery[]) => encodeSort(value),
}).withDefault([]);

/** Client-side parser for sort */
export const parseAsSort = createParser({
  parse: (value: string): SortQuery[] | null => sortValidator(value),
  serialize: (value: SortQuery[]) => encodeSort(value),
});
