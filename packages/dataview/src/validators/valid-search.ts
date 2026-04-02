import type { DataViewProperty, PropertyMeta } from "../types/property.type";
import type { ValidatedSearch } from "../types/search.type";

/** Property types excluded from search by default */
const NON_SEARCHABLE_TYPES = new Set([
  "formula",
  "button",
  "filesMedia",
  "checkbox",
]);

type PropertyLike = Pick<PropertyMeta, "enableSearch" | "id" | "type">;

/**
 * Extract searchable property IDs from properties.
 * Respects enableSearch: true/false overrides.
 */
function getSearchablePropertyIds(
  properties: readonly PropertyLike[]
): string[] {
  return properties
    .filter((p) => {
      if (p.enableSearch === false) {
        return false;
      }
      if (p.enableSearch === true) {
        return true;
      }
      return !NON_SEARCHABLE_TYPES.has(p.type);
    })
    .map((p) => p.id);
}

/**
 * Validate search against property schema.
 * Returns null if search is empty or no searchable properties exist.
 * Returns both the trimmed search string AND the searchable field IDs
 * so the client can send both to the server.
 *
 * @example
 * ```ts
 * const result = validateSearch("iphone", listingProperties);
 * // → { search: "iphone", searchFields: ["title", "subTitle", "brand", ...] }
 * ```
 */
export function validateSearch<T>(
  search: string | null,
  properties: readonly DataViewProperty<T>[] | readonly PropertyMeta[]
): ValidatedSearch | null {
  if (!search) {
    return null;
  }
  const trimmed = search.trim();
  if (!trimmed) {
    return null;
  }
  const searchFields = getSearchablePropertyIds(properties);
  if (searchFields.length === 0) {
    return null;
  }
  return { search: trimmed, searchFields };
}
