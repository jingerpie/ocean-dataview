/**
 * URL DSL Encoder
 *
 * Encodes JavaScript values to human-readable URL strings.
 */

import { ESCAPE_SEQUENCES, RESERVED_CHARS } from "./types";

// ============================================================================
// Regex Patterns (top-level for performance)
// ============================================================================

const NUMBER_REGEX = /^-?\d+(\.\d+)?$/;

// ============================================================================
// Escape Utilities
// ============================================================================

/** Characters that require quoting when present in a value */
const NEEDS_QUOTING = /[.,()":]/;

/**
 * Escape a string value for use in URL DSL.
 * Uses CSV-style quoting for values containing special characters.
 *
 * Examples:
 *   hello       → hello
 *   v1.0.0      → "v1.0.0"
 *   Smith, John → "Smith, John"
 *   say "hi"    → "say ""hi"""
 */
export function escapeValue(value: string): string {
  // If value contains special characters, wrap in quotes
  if (NEEDS_QUOTING.test(value)) {
    // Escape internal quotes by doubling them
    const escaped = value.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  return value;
}

/**
 * Check if a string looks like a number.
 */
function looksLikeNumber(value: string): boolean {
  if (value === "") {
    return false;
  }
  // Match integers and decimals, including negative
  return NUMBER_REGEX.test(value);
}

// ============================================================================
// Primitive Encoding
// ============================================================================

/**
 * Encode a primitive value to string.
 */
export function encodePrimitive(
  value: string | number | boolean | null | undefined,
  preserveStringType = false
): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (typeof value === "number") {
    return String(value);
  }

  // String
  const escaped = escapeValue(value);

  // Preserve string type for values that look like numbers or booleans
  if (
    preserveStringType &&
    (looksLikeNumber(value) || value === "true" || value === "false")
  ) {
    return ESCAPE_SEQUENCES.STRING + escaped;
  }

  return escaped;
}

// ============================================================================
// Array/Tuple Encoding
// ============================================================================

/**
 * Encode a tuple (fixed-position array) using dot separator.
 * Example: ["name", "asc"] → "name.asc"
 */
export function encodeTuple(
  values: (string | number | boolean | null | undefined)[],
  preserveStringType = false
): string {
  return values
    .filter((v) => v !== null && v !== undefined)
    .map((v) => encodePrimitive(v, preserveStringType))
    .join(RESERVED_CHARS.DOT);
}

/**
 * Encode an array of tuples using comma separator.
 * Example: [["name", "asc"], ["price", "desc"]] → "name.asc,price.desc"
 */
export function encodeTupleArray(
  tuples: (string | number | boolean | null | undefined)[][],
  preserveStringType = false
): string {
  return tuples
    .map((t) => encodeTuple(t, preserveStringType))
    .join(RESERVED_CHARS.COMMA);
}

/**
 * Encode a simple array using comma separator.
 * Example: ["a", "b", "c"] → "a,b,c"
 */
export function encodeArray(
  values: (string | number | boolean | null | undefined)[],
  preserveStringType = false
): string {
  return values
    .filter((v) => v !== null && v !== undefined)
    .map((v) => encodePrimitive(v, preserveStringType))
    .join(RESERVED_CHARS.COMMA);
}

/**
 * Encode an array value with parentheses wrapper.
 * Example: ["a", "b", "c"] → "(a,b,c)"
 * Used for filter values that are arrays (e.g., isAnyOf condition).
 */
export function encodeArrayValue(
  values: (string | number | boolean | null | undefined)[],
  preserveStringType = false
): string {
  const inner = encodeArray(values, preserveStringType);
  return `${RESERVED_CHARS.OPEN_PAREN}${inner}${RESERVED_CHARS.CLOSE_PAREN}`;
}

// ============================================================================
// Expression Encoding
// ============================================================================

/**
 * Encode a logical expression (and/or).
 * Example: { and: [rule1, rule2] } → "and(rule1,rule2)"
 */
export function encodeExpression(
  expr: { and?: unknown[]; or?: unknown[] },
  encodeItem: (item: unknown) => string
): string {
  if (expr.and) {
    const items = expr.and.map(encodeItem).join(RESERVED_CHARS.COMMA);
    return `and${RESERVED_CHARS.OPEN_PAREN}${items}${RESERVED_CHARS.CLOSE_PAREN}`;
  }

  if (expr.or) {
    const items = expr.or.map(encodeItem).join(RESERVED_CHARS.COMMA);
    return `or${RESERVED_CHARS.OPEN_PAREN}${items}${RESERVED_CHARS.CLOSE_PAREN}`;
  }

  return "";
}

// ============================================================================
// Options Encoding
// ============================================================================

/**
 * Encode key-value options using colon separator.
 * Example: { sort: "desc", hideEmpty: true } → ":sort:desc:hideEmpty"
 */
export function encodeOptions(
  options: Record<string, string | number | boolean | null | undefined>
): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(options)) {
    if (value === null || value === undefined) {
      continue;
    }
    if (typeof value === "boolean") {
      if (value) {
        parts.push(escapeValue(key));
      }
    } else {
      parts.push(
        `${escapeValue(key)}${RESERVED_CHARS.COLON}${encodePrimitive(value)}`
      );
    }
  }

  if (parts.length === 0) {
    return "";
  }
  return RESERVED_CHARS.COLON + parts.join(RESERVED_CHARS.COLON);
}
