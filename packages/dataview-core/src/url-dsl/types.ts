/**
 * URL DSL Types
 *
 * Defines the grammar and types for human-readable URL encoding.
 */

// ============================================================================
// Reserved Characters
// ============================================================================

/** Characters with special meaning in the DSL */
export const RESERVED_CHARS = {
  DOT: ".",
  COMMA: ",",
  OPEN_PAREN: "(",
  CLOSE_PAREN: ")",
  COLON: ":",
} as const;

/**
 * Special markers for type preservation.
 * Uses CSV-style quoting for escaping special characters.
 */
export const ESCAPE_SEQUENCES = {
  /** Prefix to preserve string type for numeric-looking values */
  STRING: "$s",
} as const;

// ============================================================================
// Value Types
// ============================================================================

/** Primitive values that can be encoded */
export type DSLPrimitive = string | number | boolean | null | undefined;

/** Fixed-position array (encoded with dots) */
export type DSLTuple = DSLPrimitive[];

/** Array of primitives or tuples */
export type DSLArray = DSLPrimitive[] | DSLTuple[];
