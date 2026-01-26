import type { SortQuery } from "../types/data-table.type";

/**
 * Validate and clean sort array.
 * - Removes entries with empty/whitespace property names
 * - Deduplicates by property (keeps first occurrence)
 *
 * Mirrors validateFilter pattern for consistency.
 */
export function validateSort(sort: SortQuery[]): SortQuery[] {
  const seen = new Set<string>();

  return sort.filter((s) => {
    // Skip invalid entries
    if (typeof s.property !== "string" || s.property.trim() === "") {
      return false;
    }

    // Deduplicate - keep first occurrence
    if (seen.has(s.property)) {
      return false;
    }

    seen.add(s.property);
    return true;
  });
}
