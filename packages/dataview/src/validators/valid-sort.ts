import type { DataViewProperty, PropertyMeta } from "../types/property.type";
import type { SortQuery } from "../types/sort.type";

// ============================================================================
// Property Extraction
// ============================================================================

/** Property types that cannot be sorted */
const NON_SORTABLE_TYPES = new Set(["formula", "button"]);

/** Minimal property shape for validation (works with both DataViewProperty and PropertyMeta) */
type PropertyLike = Pick<PropertyMeta, "enableSort" | "id" | "type">;

/**
 * Extract sortable property IDs from properties.
 * Excludes formula and button types which aren't sortable.
 * Respects enableSort: false on individual properties.
 */
function getSortablePropertyIds(
  properties: readonly PropertyLike[]
): Set<string> {
  return new Set(
    properties
      .filter((p) => !NON_SORTABLE_TYPES.has(p.type) && p.enableSort !== false)
      .map((p) => p.id)
  );
}

// ============================================================================
// Pure Validation Function
// ============================================================================

/**
 * Validate sort against property schema.
 * Filters out sort items referencing invalid properties.
 * Returns null when all items are invalid (so url ?? defaults still works).
 *
 * Accepts both DataViewProperty[] and PropertyMeta[] for flexibility.
 *
 * @example
 * ```ts
 * const sort = parseAsSort(url);
 * const validatedSort = validateSort(sort, productProperties);
 * ```
 */
export function validateSort<T>(
  sort: SortQuery[] | null,
  properties: readonly DataViewProperty<T>[] | readonly PropertyMeta[]
): SortQuery[] | null {
  if (!sort) {
    return null;
  }
  const validPropertyIds = getSortablePropertyIds(properties);
  const filtered = sort.filter((s) => validPropertyIds.has(s.property));
  return filtered.length > 0 ? filtered : null;
}
