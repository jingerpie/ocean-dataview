import type { SearchQuery, WhereRule } from "../types";

/**
 * Builds a SearchQuery from a search string and searchable fields.
 *
 * - Creates `iLike` rules for each searchable field
 * - Always returns { or: [...] } format
 * - Returns null if search is empty or no fields provided
 *
 * @example
 * ```ts
 * const search = buildSearchFilter("laptop", ["name", "description"]);
 * // Result:
 * // {
 * //   or: [
 * //     { property: "name", condition: "iLike", value: "laptop" },
 * //     { property: "description", condition: "iLike", value: "laptop" },
 * //   ]
 * // }
 * ```
 */
export function buildSearchFilter(
	search: string,
	searchFields: string[]
): SearchQuery | null {
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
