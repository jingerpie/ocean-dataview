import type { GroupedPaginationOutput } from "../hooks/use-pagination";
import type { PaginationContext } from "../types/pagination";

/**
 * Builds a PaginationContext for a specific group from GroupedPaginationOutput.
 * Used by views (List, Gallery, Table) to provide pagination controls per-group.
 *
 * @param pagination - The grouped pagination output from usePagination hook
 * @param groupKey - The key of the group to build context for
 * @returns PaginationContext if group exists, undefined otherwise
 */
export function buildPaginationContext<TData>(
	pagination: GroupedPaginationOutput<TData> | undefined,
	groupKey: string,
): PaginationContext | undefined {
	if (pagination?.mode !== "grouped") return undefined;

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
