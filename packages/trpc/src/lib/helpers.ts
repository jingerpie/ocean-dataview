/**
 * Database utility functions
 * Based on: https://gist.github.com/rphlmr/0d1722a794ed5a16da0fdf6652902b15
 */
import { type AnyColumn, sql } from "drizzle-orm";

/**
 * SQL function to check if a column is empty
 * Handles: null, empty string, empty array [], empty object {}
 *
 * @example
 * ```typescript
 * const where = and(
 *   isEmpty(user.email),
 *   not(isEmpty(user.name))
 * );
 * ```
 */
export function isEmpty<TColumn extends AnyColumn>(column: TColumn) {
  return sql<boolean>`
    case
      when ${column} is null then true
      when ${column} = '' then true
      when ${column}::text = '[]' then true
      when ${column}::text = '{}' then true
      else false
    end
  `;
}

/**
 * Get first item from array or null
 */
export function takeFirstOrNull<TData>(data: TData[]) {
  return data[0] ?? null;
}

/**
 * Get first item from array or throw error
 */
export function takeFirstOrThrow<TData>(data: TData[], errorMessage?: string) {
  const first = takeFirstOrNull(data);
  if (!first) {
    throw new Error(errorMessage ?? "Item not found");
  }
  return first;
}
