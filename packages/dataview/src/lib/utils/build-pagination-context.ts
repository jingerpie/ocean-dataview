import type { GroupInfinitePaginationState } from "../../hooks/use-group-infinite-pagination";
import type { GroupPagePaginationState } from "../../hooks/use-group-page-pagination";
import type { InfinitePaginationState } from "../../hooks/use-infinite-pagination";
import type { PagePaginationResult } from "../../hooks/use-page-pagination";
import type { PaginationContext } from "../../types/pagination";

/**
 * Flat pagination output types (from new hooks)
 */
type FlatPaginationOutput = PagePaginationResult | InfinitePaginationState;

/**
 * Grouped pagination output types (from new hooks)
 */
type GroupedPaginationOutput<TData> =
	| GroupPagePaginationState<TData>
	| GroupInfinitePaginationState<TData>;

/**
 * Type guard to check if pagination is grouped (has groups array)
 */
function isGroupedPagination<TData>(
	pagination: FlatPaginationOutput | GroupedPaginationOutput<TData>
): pagination is GroupedPaginationOutput<TData> {
	return "groups" in pagination && Array.isArray(pagination.groups);
}

/**
 * Union type for pagination - supports both flat and grouped pagination
 */
type PaginationOutput<TData> =
	| FlatPaginationOutput
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
	groupKey: string
): PaginationContext | undefined {
	if (!pagination) {
		return undefined;
	}

	// Handle grouped pagination
	if (isGroupedPagination(pagination)) {
		const group = pagination.groups.find((g) => g.key === groupKey);
		if (!group) {
			return undefined;
		}

		return {
			hasNext: group.hasNext,
			hasPrev: "hasPrev" in group ? group.hasPrev : false,
			onNext: group.onNext,
			onPrev: "onPrev" in group ? group.onPrev : () => undefined,
			isLoading: group.isLoading,
			limit: pagination.limit,
			onLimitChange: pagination.onLimitChange,
			limitOptions: pagination.limitOptions,
			displayStart: "displayStart" in group ? group.displayStart : 1,
			displayEnd: (() => {
				if ("displayEnd" in group) {
					return group.displayEnd;
				}
				if ("totalLoaded" in group) {
					return group.totalLoaded;
				}
				return 0;
			})(),
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
		displayStart: "displayStart" in pagination ? pagination.displayStart : 1,
		displayEnd: (() => {
			if ("displayEnd" in pagination) {
				return pagination.displayEnd;
			}
			if ("totalLoaded" in pagination) {
				return pagination.totalLoaded;
			}
			return 0;
		})(),
	};
}
