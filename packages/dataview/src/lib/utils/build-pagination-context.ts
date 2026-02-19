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
 * Resolves hasNext to a boolean value.
 * - If hasNext is boolean, returns it directly
 * - If hasNext is Record<string, boolean>, looks up by groupKey
 *
 * @param hasNext - The hasNext value (boolean or Record)
 * @param groupKey - The key to look up if hasNext is a Record
 * @returns boolean indicating if there are more items
 */
function resolveHasNext(
  hasNext: boolean | Record<string, boolean>,
  groupKey?: string
): boolean {
  if (typeof hasNext === "boolean") {
    return hasNext;
  }
  // Record<string, boolean> - look up by key
  return groupKey ? (hasNext[groupKey] ?? false) : false;
}

/**
 * Builds a PaginationContext for a specific group from pagination output.
 * Used by views (List, Gallery, Table, Board) to provide pagination controls per-group.
 *
 * For grouped pagination: returns context for the specific group
 * For flat pagination: returns context directly (groupKey used for hasNext lookup)
 *
 * @param pagination - The pagination output (flat or grouped)
 * @param groupKey - The key of the group to build context for
 * @param columnKey - Optional column key for per-group hasNext in sub-grouped boards
 * @returns PaginationContext if available, undefined otherwise
 */
export function buildPaginationContext<TData>(
  pagination: PaginationOutput<TData> | undefined,
  groupKey: string,
  columnKey?: string
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

    // For sub-grouped boards: use columnKey to resolve per-column hasNext
    // For regular grouped views: use group.hasNext directly
    const hasNext = resolveHasNext(group.hasNext, columnKey);

    return {
      hasNext,
      hasPrev:
        "hasPrev" in group ? resolveHasNext(group.hasPrev, columnKey) : false,
      onNext: group.onNext,
      onPrev: "onPrev" in group ? group.onPrev : () => undefined,
      isLoading: group.isLoading,
      isFetching: "isFetching" in group ? group.isFetching : undefined,
      isFetchingNextPage:
        "isFetchingNextPage" in group ? group.isFetchingNextPage : undefined,
      limit: pagination.limit,
      onLimitChange: pagination.onLimitChange,
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
  // For flat boards: groupKey is the column key for hasNext lookup
  const hasNext = resolveHasNext(pagination.hasNext, groupKey);

  return {
    hasNext,
    hasPrev: resolveHasNext(pagination.hasPrev, groupKey),
    onNext: pagination.onNext,
    onPrev: pagination.onPrev,
    isLoading: pagination.isLoading,
    isFetching: "isFetching" in pagination ? pagination.isFetching : undefined,
    isFetchingNextPage:
      "isFetchingNextPage" in pagination
        ? pagination.isFetchingNextPage
        : undefined,
    limit: pagination.limit,
    onLimitChange: pagination.onLimitChange,
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
