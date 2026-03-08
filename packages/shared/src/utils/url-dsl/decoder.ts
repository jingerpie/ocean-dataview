/**
 * URL DSL Decoder
 *
 * Decodes human-readable URL strings to JavaScript values.
 */

import { ESCAPE_SEQUENCES, RESERVED_CHARS } from "./types";

// ============================================================================
// Regex Patterns (top-level for performance)
// ============================================================================

const NUMBER_REGEX = /^-?\d+(\.\d+)?$/;
const AND_EXPR_REGEX = /^and\((.+)\)$/;
const OR_EXPR_REGEX = /^or\((.+)\)$/;

// ============================================================================
// Unescape Utilities
// ============================================================================

/**
 * Unescape a string value from URL DSL.
 * Uses CSV-style unquoting for values wrapped in double quotes.
 *
 * Examples:
 *   hello         → hello
 *   "v1.0.0"      → v1.0.0
 *   "Smith, John" → Smith, John
 *   "say ""hi"""  → say "hi"
 *
 * Returns the unescaped value and whether it was explicitly marked as string.
 */
export function unescapeValue(value: string): {
  value: string;
  isExplicitString: boolean;
} {
  let result = value;
  let isExplicitString = false;

  // Check for explicit string marker
  if (result.startsWith(ESCAPE_SEQUENCES.STRING)) {
    isExplicitString = true;
    result = result.slice(ESCAPE_SEQUENCES.STRING.length);
  }

  // Check for quoted value (CSV-style)
  if (result.startsWith('"') && result.endsWith('"')) {
    // Remove surrounding quotes
    result = result.slice(1, -1);
    // Unescape doubled quotes
    result = result.replace(/""/g, '"');
    // Quoted values are always treated as strings
    isExplicitString = true;
  }

  return { value: result, isExplicitString };
}

// ============================================================================
// Type Inference
// ============================================================================

/**
 * Parse a primitive value with type inference.
 * Order: boolean → number → string
 */
export function parsePrimitive(value: string): string | number | boolean {
  if (value === "") {
    return "";
  }

  const { value: unescaped, isExplicitString } = unescapeValue(value);

  // If explicitly marked as string, return as-is
  if (isExplicitString) {
    return unescaped;
  }

  // Boolean
  if (unescaped === "true") {
    return true;
  }
  if (unescaped === "false") {
    return false;
  }

  // Number (integers and decimals, including negative)
  if (NUMBER_REGEX.test(unescaped)) {
    const num = Number(unescaped);
    if (!Number.isNaN(num) && Number.isFinite(num)) {
      return num;
    }
  }

  // String
  return unescaped;
}

// ============================================================================
// Splitting Utilities
// ============================================================================

/**
 * Split string by separator, respecting parentheses depth and quoted values.
 * Used for splitting by comma while preserving nested expressions.
 *
 * Commas inside quoted strings ("Smith, John") are not treated as separators.
 * Parentheses inside quoted strings don't affect depth counting.
 */
export function splitRespectingParens(
  value: string,
  separator: string
): string[] {
  const results: string[] = [];
  let current = "";
  let depth = 0;
  let inQuotes = false;

  for (let i = 0; i < value.length; i++) {
    const char = value[i];

    if (char === '"') {
      // Check for escaped quote ("")
      if (inQuotes && value[i + 1] === '"') {
        current += '""';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
        current += char;
      }
    } else if (inQuotes) {
      current += char;
    } else if (char === "(") {
      depth++;
      current += char;
    } else if (char === ")") {
      depth--;
      current += char;
    } else if (char === separator && depth === 0) {
      results.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  if (current) {
    results.push(current);
  }

  return results;
}

/**
 * Split string by dot separator, respecting quoted values.
 * Dots inside quoted strings ("v1.0.0") are not treated as separators.
 */
export function splitByDot(value: string): string[] {
  const results: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < value.length; i++) {
    const char = value[i];

    if (char === '"') {
      // Check for escaped quote ("")
      if (inQuotes && value[i + 1] === '"') {
        current += '""';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
        current += char;
      }
    } else if (char === "." && !inQuotes) {
      results.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  if (current) {
    results.push(current);
  }

  return results;
}

// ============================================================================
// Array/Tuple Decoding
// ============================================================================

/**
 * Decode a comma-separated array.
 * Example: "a,b,c" → ["a", "b", "c"]
 */
export function decodeArray(value: string): (string | number | boolean)[] {
  if (!value) {
    return [];
  }
  return splitRespectingParens(value, RESERVED_CHARS.COMMA).map(parsePrimitive);
}

/**
 * Decode a comma-separated string array (no type inference).
 * Example: "group-a,group-b" → ["group-a", "group-b"]
 */
export function decodeStringArray(value: string): string[] {
  if (!value) {
    return [];
  }
  return splitRespectingParens(value, RESERVED_CHARS.COMMA).map(
    (v) => unescapeValue(v).value
  );
}

/**
 * Decode a dot-separated tuple.
 * Example: "name.asc" → ["name", "asc"]
 */
export function decodeTuple(value: string): (string | number | boolean)[] {
  if (!value) {
    return [];
  }
  return splitByDot(value).map(parsePrimitive);
}

/**
 * Decode a dot-separated tuple as strings (no type inference).
 * Example: "name.asc" → ["name", "asc"]
 */
export function decodeTupleStrings(value: string): string[] {
  if (!value) {
    return [];
  }
  return splitByDot(value).map((v) => unescapeValue(v).value);
}

/**
 * Decode an array of tuples.
 * Example: "name.asc,price.desc" → [["name", "asc"], ["price", "desc"]]
 */
export function decodeTupleArray(
  value: string
): (string | number | boolean)[][] {
  if (!value) {
    return [];
  }
  return splitRespectingParens(value, RESERVED_CHARS.COMMA).map(decodeTuple);
}

/**
 * Check if a value is an array value (wrapped in parentheses).
 * Example: "(a,b,c)" → true, "a,b,c" → false
 */
export function isArrayValue(value: string): boolean {
  return value.startsWith("(") && value.endsWith(")");
}

/**
 * Decode an array value with parentheses wrapper.
 * Example: "(a,b,c)" → ["a", "b", "c"]
 * Used for filter values that are arrays (e.g., isAnyOf condition).
 */
export function decodeArrayValue(
  value: string
): (string | number | boolean)[] | null {
  if (!isArrayValue(value)) {
    return null;
  }
  // Remove parentheses and decode inner content
  const inner = value.slice(1, -1);
  return decodeArray(inner);
}

// ============================================================================
// Expression Decoding
// ============================================================================

interface ExpressionMatch {
  content: string;
  fullMatch: string;
  type: "and" | "or";
}

/**
 * Check if value starts with an expression (and/or).
 */
export function matchExpression(value: string): ExpressionMatch | null {
  const andMatch = value.match(AND_EXPR_REGEX);
  if (andMatch?.[1]) {
    return { type: "and", content: andMatch[1], fullMatch: value };
  }

  const orMatch = value.match(OR_EXPR_REGEX);
  if (orMatch?.[1]) {
    return { type: "or", content: orMatch[1], fullMatch: value };
  }

  return null;
}

/**
 * Parse a logical expression recursively.
 * Returns { and: [...] } or { or: [...] } or the parsed item.
 */
export function parseExpression<T>(
  value: string,
  parseItem: (item: string) => T
):
  | T
  | {
      and: (
        | T
        | { and: unknown[]; or?: never }
        | { or: unknown[]; and?: never }
      )[];
    }
  | {
      or: (
        | T
        | { and: unknown[]; or?: never }
        | { or: unknown[]; and?: never }
      )[];
    } {
  const match = matchExpression(value);

  if (!match) {
    return parseItem(value);
  }

  const items = splitRespectingParens(match.content, RESERVED_CHARS.COMMA);
  const parsed = items.map((item) => parseExpression(item, parseItem));

  if (match.type === "and") {
    return { and: parsed };
  }
  return { or: parsed };
}

// ============================================================================
// Options Decoding
// ============================================================================

/**
 * Decode colon-separated options.
 * Example: ":sort:desc:hideEmpty" → { sort: "desc", hideEmpty: true }
 */
export function decodeOptions(
  value: string
): Record<string, string | number | boolean> {
  if (!value?.startsWith(RESERVED_CHARS.COLON)) {
    return {};
  }

  const options: Record<string, string | number | boolean> = {};
  const parts = value.slice(1).split(RESERVED_CHARS.COLON);

  let i = 0;
  while (i < parts.length) {
    const part = parts[i];
    if (part === undefined) {
      i++;
      continue;
    }
    const key = unescapeValue(part).value;

    // Check if next part is a value (contains no colon and isn't a known key pattern)
    const nextPart = parts[i + 1];
    if (nextPart !== undefined) {
      // Simple heuristic: if it looks like a value, treat it as key:value
      const parsed = parsePrimitive(nextPart);
      if (typeof parsed !== "string" || !nextPart.includes(":")) {
        options[key] = parsed;
        i += 2;
        continue;
      }
    }

    // Boolean flag (no value)
    options[key] = true;
    i++;
  }

  return options;
}
