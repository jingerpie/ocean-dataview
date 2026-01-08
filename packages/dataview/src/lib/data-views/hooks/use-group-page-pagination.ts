"use client";

import { parseAsCursors, parseAsExpanded } from "@ocean-dataview/shared/lib";
import {
	type CursorState,
	getCursor,
	getCursorParams,
	removeCursor,
	setCursor,
} from "@ocean-dataview/shared/types";
import { useQueries } from "@tanstack/react-query";
import { parseAsInteger, useQueryState } from "nuqs";
import { useCallback, useMemo, useTransition } from "react";

// ============================================================================
// Types
// ============================================================================

/**
 * Standard paginated response shape from API
 */
export interface GroupPaginatedResponse<TData> {
	items: TData[];
	startCursor?: string | null;
	endCursor?: string | null;
	hasNextPage?: boolean;
	hasPreviousPage?: boolean;
}

/**
 * Group counts format from API
 */
export interface GroupCounts {
	[key: string]: { count: number; hasMore: boolean };
}

/**
 * Query options for page-based query.
 * Compatible with TRPC's queryOptions return type.
 * Uses loose typing to accept TRPC's return type which has more context parameters.
 */
export interface GroupPageQueryOptions {
	queryKey: readonly unknown[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	queryFn?: any;
}

/**
 * Input options for useGroupPagePagination hook
 */
export interface UseGroupPagePaginationOptions<TData> {
	/** All group keys in stable order */
	allGroupKeys: string[];
	/** Currently expanded groups */
	expanded: string[];
	/** Group counts from API */
	groupCounts: GroupCounts;
	/** Cursor state per group (from URL props) */
	cursors?: CursorState[];
	/** Items per page */
	limit: number;
	/** Factory to create query options for each group */
	createQueryOptions: (
		groupKey: string,
		cursorParams: { after?: string; before?: string },
	) => GroupPageQueryOptions;
	/** Available limit options (default: [25, 50, 100, 200]) */
	limitOptions?: number[];
}

/**
 * Per-group pagination info
 */
export interface GroupInfo<TData> {
	key: string;
	value: string;
	items: TData[];
	count: number;
	hasMore: boolean;
	displayCount: string;
	isLoading: boolean;
	isFetching: boolean;
	hasNext: boolean;
	hasPrev: boolean;
	onNext: () => void;
	onPrev: () => void;
	displayStart: number;
	displayEnd: number;
}

/**
 * Pagination state for grouped views
 */
export interface GroupPagePaginationState<TData> {
	groups: GroupInfo<TData>[];
	limit: number;
	onLimitChange: (limit: number) => void;
	limitOptions: number[];
	isLoading: boolean;
}

/**
 * Output type for useGroupPagePagination hook
 */
export interface GroupPagePaginationResult<TData> {
	/** Flattened data from all groups */
	data: TData[];
	/** Pagination state for DataViewProvider */
	pagination: GroupPagePaginationState<TData>;
	/** Handler for accordion expand/collapse */
	handleAccordionChange: (newExpanded: string[]) => void;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_LIMIT_OPTIONS = [25, 50, 100, 200];

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for grouped page-based pagination.
 *
 * Features:
 * - Per-group pagination with Prev/Next buttons
 * - Accordion expansion state management
 * - URL state for bookmarkable grouped views (shallow: false)
 * - Creates queries internally (handles React hooks rules)
 *
 * @example
 * ```tsx
 * const ProductGroupTable = ({ expanded: expandedProp, cursors, limit }: Props) => {
 *   const trpc = useTRPC();
 *
 *   const { data: groupCounts } = useSuspenseQuery(
 *     trpc.product.getGroup.queryOptions({ groupBy: "familyGroup" }),
 *   );
 *
 *   const expanded = expandedProp ?? DEFAULT_EXPANDED;
 *   const allGroupKeys = Object.keys(groupCounts);
 *
 *   const { data, pagination, handleAccordionChange } = useGroupPagePagination<Product>({
 *     allGroupKeys,
 *     expanded,
 *     cursors,
 *     groupCounts,
 *     limit,
 *     createQueryOptions: (groupKey, { after, before }) => ({
 *       queryKey: ["product", "getMany", groupKey, { after, before, limit }],
 *       queryFn: async () => {
 *         const api = getApiClient();
 *         return api.product.getMany.query({
 *           filters: [{ propertyId: "familyGroup", operator: "eq", value: groupKey }],
 *           after,
 *           before,
 *           limit,
 *         });
 *       },
 *     }),
 *   });
 *
 *   return (
 *     <DataViewProvider data={data} pagination={pagination}>
 *       <TableView
 *         view={{
 *           group: {
 *             groupBy: "familyGroup",
 *             expandedGroups: expanded,
 *             onExpandedChange: handleAccordionChange,
 *           },
 *         }}
 *         pagination="page"
 *       />
 *     </DataViewProvider>
 *   );
 * };
 * ```
 */
export function useGroupPagePagination<TData>(
	options: UseGroupPagePaginationOptions<TData>,
): GroupPagePaginationResult<TData> {
	const {
		allGroupKeys,
		expanded,
		cursors = [],
		groupCounts,
		limit,
		createQueryOptions,
		limitOptions = DEFAULT_LIMIT_OPTIONS,
	} = options;

	// Create queries internally using useQueries
	const queries = useQueries({
		queries: allGroupKeys.map((groupKey) => {
			const cursor = getCursor(cursors, groupKey);
			const cursorParams = getCursorParams(cursor);
			const isEnabled = expanded.includes(groupKey);

			const options = createQueryOptions(groupKey, cursorParams);

			return {
				queryKey: options.queryKey,
				queryFn: options.queryFn,
				enabled: isEnabled,
			};
		}),
	});

	const [, startTransition] = useTransition();

	// URL setters (shallow: false triggers server re-render)
	const [, setExpanded] = useQueryState(
		"expanded",
		parseAsExpanded.withOptions({ shallow: false }),
	);
	const [, setCursors] = useQueryState(
		"cursors",
		parseAsCursors.withDefault([]).withOptions({ shallow: false }),
	);
	const [, setLimit] = useQueryState(
		"limit",
		parseAsInteger.withOptions({ shallow: false, clearOnDefault: true }),
	);

	// Build groups array with items and pagination info
	const groups = useMemo(() => {
		return allGroupKeys.map((groupKey, index) => {
			const query = queries[index];
			const isExpanded = expanded.includes(groupKey);
			const countInfo = groupCounts[groupKey] ?? { count: 0, hasMore: false };
			const queryData = query?.data as
				| GroupPaginatedResponse<TData>
				| undefined;
			const items: TData[] = isExpanded ? (queryData?.items ?? []) : [];
			const cursorState = getCursor(cursors, groupKey);
			const groupStart = cursorState?.start ?? 0;

			const group: GroupInfo<TData> = {
				key: groupKey,
				value: groupKey,
				count: countInfo.count,
				hasMore: countInfo.hasMore,
				displayCount: countInfo.hasMore ? "99+" : String(countInfo.count),
				isLoading: query?.isLoading ?? false,
				isFetching: isExpanded && (query?.isFetching ?? false),
				items,
				hasNext: queryData?.hasNextPage ?? false,
				hasPrev: groupStart > 0,
				displayStart: items.length > 0 ? groupStart + 1 : 0,
				displayEnd: groupStart + items.length,

				onNext: () => {
					const endCursor = queryData?.endCursor;
					if (endCursor == null) return;
					startTransition(() => {
						setCursors(
							setCursor(cursors, {
								group: groupKey,
								after: String(endCursor),
								start: groupStart + limit,
							}),
						);
					});
				},

				onPrev: () => {
					const newStart = Math.max(0, groupStart - limit);
					startTransition(() => {
						if (newStart === 0) {
							setCursors(removeCursor(cursors, groupKey));
						} else {
							const startCursor = queryData?.startCursor;
							if (startCursor == null) return;
							setCursors(
								setCursor(cursors, {
									group: groupKey,
									before: String(startCursor),
									start: newStart,
								}),
							);
						}
					});
				},
			};

			return group;
		});
	}, [
		allGroupKeys,
		queries,
		expanded,
		cursors,
		groupCounts,
		limit,
		setCursors,
	]);

	// Flatten all items
	const data = useMemo(() => groups.flatMap((g) => g.items), [groups]);

	// Limit change handler
	const onLimitChange = useCallback(
		(newLimit: number) => {
			startTransition(() => {
				setLimit(newLimit);
				setCursors([]); // Reset all cursors when limit changes
			});
		},
		[setLimit, setCursors],
	);

	// Accordion change handler
	const handleAccordionChange = useCallback(
		(newExpanded: string[]) => {
			const removed = expanded.find((g) => !newExpanded.includes(g));

			startTransition(() => {
				// Clear cursor for collapsed group
				if (removed) {
					setCursors(removeCursor(cursors, removed));
				}
				setExpanded(newExpanded.length > 0 ? newExpanded : null);
			});
		},
		[expanded, cursors, setExpanded, setCursors],
	);

	// Check if any group is loading
	const isLoading = queries.some((q) => q?.isFetching);

	return {
		data,
		pagination: {
			groups,
			limit,
			onLimitChange,
			limitOptions,
			isLoading,
		},
		handleAccordionChange,
	};
}
