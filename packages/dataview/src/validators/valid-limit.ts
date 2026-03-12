import { LIMIT_OPTIONS, type Limit } from "../types/pagination";

const LIMIT_SET = new Set<number>(LIMIT_OPTIONS);

/**
 * Default limit value when validation fails.
 */
const DEFAULT_LIMIT: Limit = 25;

/**
 * Validate limit value against allowed options.
 * Returns default (25) if invalid.
 *
 * @example
 * ```ts
 * validateLimit(50)   // → 50
 * validateLimit(999)  // → 25 (invalid, returns default)
 * validateLimit(null) // → 25
 * ```
 */
export function validateLimit(
  value: number | null,
  defaultLimit: Limit = DEFAULT_LIMIT
): Limit {
  if (value === null) {
    return defaultLimit;
  }
  return LIMIT_SET.has(value) ? (value as Limit) : defaultLimit;
}
