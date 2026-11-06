import type { SortQuery, WhereNode } from "../types/filter.type";
import type { ColumnConfigInput, GroupConfigInput } from "../types/group.type";
import type { Cursors, Limit } from "../types/pagination";
import type { DataViewProperty, PropertyMeta } from "../types/property.type";
import { validateColumn } from "./valid-column";
import { validateCursors } from "./valid-cursors";
import { validateFilter } from "./valid-filter";
import { validateGroup } from "./valid-group";
import { validateLimit } from "./valid-limit";
import { validateSearch } from "./valid-search";
import { validateSort } from "./valid-sort";

// biome-ignore lint/performance/noBarrelFile: Public API for validators
export { validateColumn } from "./valid-column";
export { validateCursors } from "./valid-cursors";
export { validateFilter } from "./valid-filter";
export {
  validateGroup,
  validateGroupConfig,
  validateShowAs,
} from "./valid-group";
export { validateLimit } from "./valid-limit";
export { validateSearch } from "./valid-search";
export { validateSort } from "./valid-sort";

// ============================================================================
// Combined Validation
// ============================================================================

/**
 * Input for combined validation.
 */
export interface Input {
  column?: ColumnConfigInput | null;
  cursors?: Cursors | null;
  filter?: WhereNode[] | null;
  group?: GroupConfigInput | null;
  limit?: number | null;
  search?: string | null;
  sort?: SortQuery[] | null;
}

/**
 * Validate all data view state against property schema.
 * Combines validateFilter, validateSort, validateSearch, validateGroup, validateColumn, validateCursors, and validateLimit.
 *
 * Cursors are validated against the validated group (order matters).
 *
 * Accepts both DataViewProperty[] and PropertyMeta[] for flexibility.
 *
 * @example
 * ```ts
 * const validated = validate(
 *   { filter, sort, group, column, cursors, limit, search },
 *   properties
 * );
 * // validated.search → { search: "iphone", searchFields: ["title", "brand"] } | null
 * ```
 */
export function validate<T>(
  input: Input,
  properties: readonly DataViewProperty<T>[] | readonly PropertyMeta[],
  defaultLimit: Limit = 25
) {
  const group = validateGroup(input.group ?? null, properties);

  return {
    column: validateColumn(input.column ?? null, properties),
    cursors: validateCursors(input.cursors ?? null, group),
    filter: validateFilter(input.filter ?? null, properties),
    group,
    limit: validateLimit(input.limit ?? null, defaultLimit),
    search: validateSearch(input.search ?? null, properties),
    sort: validateSort(input.sort ?? null, properties) ?? [],
  };
}
