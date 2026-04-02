/**
 * Sort configuration for a property.
 *
 * Property is typed as `string` for runtime flexibility.
 * Use `satisfies` for type-safe property name validation at definition time.
 *
 * @example
 * // Type-safe definition with satisfies
 * const defaultSort = [
 *   { property: "name", direction: "asc" }
 * ] satisfies SortQuery[];
 *
 * // Or with explicit keyof constraint
 * const sort: { property: keyof Product; direction: "asc" | "desc" } = { property: "name", direction: "asc" };
 */
export interface SortQuery {
  /** Custom sort order for status/select properties - pre-computed by client */
  customOrder?: string[];
  direction: "asc" | "desc";
  property: string;
}
