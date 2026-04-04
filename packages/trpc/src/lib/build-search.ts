import type { SearchWhereClause, WhereRule } from "@sparkyidea/dataview/types";

/**
 * Builds a SearchWhereClause from a search string and searchable fields.
 *
 * Creates `iLike` rules for each searchable field wrapped in OR.
 * Returns null if search is empty or no fields provided.
 */
export function buildSearchFilter(
  search: string,
  searchFields: string[]
): SearchWhereClause | null {
  const trimmed = search.trim();

  if (!trimmed || searchFields.length === 0) {
    return null;
  }

  const rules: WhereRule[] = searchFields.map((field) => ({
    property: field,
    condition: "iLike",
    value: trimmed,
  }));

  return { or: rules };
}
