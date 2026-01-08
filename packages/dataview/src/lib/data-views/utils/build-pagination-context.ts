import type { GroupedPaginationOutput } from "../hooks/use-group-pagination";
import type { FlatPaginationOutput } from "../hooks/use-pagination-controls";
import type { PaginationContext } from "../types/pagination";

/**
 * Type guard to check if pagination is grouped (has groups array)
 */
function isGroupedPagination<TData>(
	pagination: FlatPaginationOutput<TData> | GroupedPaginationOutput<TData>,
): pagination is GroupedPaginationOutput<TData> {
	return "groups" in pagination && Array.isArray(pagination.groups);
}

/**
 * Union type for pagination - supports both flat and grouped pagination
 */
type PaginationOutput<TData> =
	| FlatPaginationOutput<TData>
	| GroupedPaginationOutput<TData>;

/**
 * Builds a PaginationContext for a specific group from pagination output.
 * Used by views (List, Gallery, Table) to provide pagination controls per-group.
 *
 * For grouped pagination: returns context for the specific group
 * For flat pagination: returns context directly (groupKey is ignored)
 *
 * @param pagination - The pagination output (flat or grouped)
 * @param groupKey - The key of the group to build context for (ignored for flat)
 * @returns PaginationContext if available, undefined otherwise
 */
export function buildPaginationContext<TData>(
	pagination: PaginationOutput<TData> | undefined,
	groupKey: string,
): PaginationContext | undefined {
	if (!pagination) return undefined;

	// Handle grouped pagination
	if (isGroupedPagination(pagination)) {
		const group = pagination.groups.find((g) => g.key === groupKey);
		if (!group) return undefined;

		return {
			hasNext: group.hasNext,
			hasPrev: group.hasPrev,
			onNext: group.onNext,
			onPrev: group.onPrev,
			isLoading: group.isLoading,
			limit: pagination.limit,
			onLimitChange: pagination.onLimitChange,
			limitOptions: pagination.limitOptions,
			displayStart: group.displayStart,
			displayEnd: group.displayEnd,
		};
	}

	// Handle flat pagination
	return {
		hasNext: pagination.hasNext,
		hasPrev: pagination.hasPrev,
		onNext: pagination.onNext,
		onPrev: pagination.onPrev,
		isLoading: pagination.isLoading,
		limit: pagination.limit,
		onLimitChange: pagination.onLimitChange,
		limitOptions: pagination.limitOptions,
		displayStart: pagination.displayStart,
		displayEnd: pagination.displayEnd,
	};
}
