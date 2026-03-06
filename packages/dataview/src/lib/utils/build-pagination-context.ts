import type {
  InfiniteGroupInfo,
  InfinitePaginationState,
} from "../../hooks/use-infinite-pagination";
import type {
  PageGroupInfo,
  PagePaginationState,
} from "../../hooks/use-page-pagination";
import type { PaginationContext } from "../../types/pagination";

/**
 * Union type for all pagination state types.
 * All pagination states have `groups` array (flat mode uses single "__ungrouped__" group).
 */
type PaginationOutput<TData> =
  | PagePaginationState<TData>
  | InfinitePaginationState<TData>;

/**
 * Union type for group info
 */
type GroupInfoUnion<TData> = PageGroupInfo<TData> | InfiniteGroupInfo<TData>;

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
 * All pagination states have `groups` array:
 * - Flat mode: single group with key "__ungrouped__"
 * - Grouped mode: multiple groups with actual keys
 *
 * @param pagination - The pagination output (any pagination state)
 * @param groupKey - The key of the group to build context for (use "__ungrouped__" for flat mode)
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

  // All pagination states have groups array
  const group = pagination.groups.find(
    (g: GroupInfoUnion<TData>) => g.key === groupKey
  );
  if (!group) {
    return undefined;
  }

  // Resolve hasNext from group:
  // - For sub-grouped boards: columnKey is provided, use it to look up in hasNext Record
  // - For flat boards: groupKey IS the column key, use it when columnKey is undefined
  // - For regular list/table: hasNext is a boolean, lookup key doesn't matter
  const lookupKey = columnKey ?? groupKey;
  const hasNext = resolveHasNext(group.hasNext, lookupKey);

  return {
    hasNext,
    hasPrev:
      "hasPrev" in group ? resolveHasNext(group.hasPrev, lookupKey) : false,
    onNext: group.onNext,
    onPrev: "onPrev" in group ? group.onPrev : () => undefined,
    isFetching: group.isFetching,
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
