"use client";

import { parseAsCursors, parseAsExpanded } from "@ocean-dataview/shared/lib";
import {
	type CursorState,
	getCursor,
	removeCursor,
	setCursor,
} from "@ocean-dataview/shared/types";
import { parseAsInteger, useQueryState } from "nuqs";
import { useCallback, useMemo } from "react";
import type {
	GroupedPaginationOutput,
	GroupInfo,
	GroupQueryResult,
} from "./use-group-pagination";

// ============================================================================
// Types
// ============================================================================

/**
 * Group counts format from API
 */
export interface GroupCounts {
	[key: string]: { count: number; hasMore: boolean };
}

/**
 * Minimal query result type for useGroupData
 */
export interface GroupQueryState<TData> {
	data?: GroupQueryResult<TData>;
	isFetching?: boolean;
}

/**
 * Input for useGroupData hook
 */
export interface UseGroupDataInput<TData> {
	/** Result from useQueries - queries for ALL groups */
	groupQueries: GroupQueryState<TData>[];
	/** All group keys in stable order */
	allGroupKeys: string[];
	/** Currently expanded groups (from props) */
	expanded: string[];
	/** Cursor state per group (from props) */
	cursors: CursorState[];
	/** Group counts from API */
	groupCounts: GroupCounts;
	/** Items per page */
	limit?: number;
	/** Limit options */
	limitOptions?: number[];
}

/**
 * Output from useGroupData hook
 */
export interface UseGroupDataOutput<TData> {
	/** Flattened data from expanded groups */
	data: TData[];
	/** Pagination state for all groups (compatible with DataViewProvider) */
	pagination: GroupedPaginationOutput<TData>;
	/** Handler for accordion expand/collapse (updates URL) */
	handleAccordionChange: (groups: string[]) => void;
}

// ============================================================================
// Implementation
// ============================================================================

/**
 * Hook for processing group query results into data + pagination.
 *
 * Key design:
 * - Receives query results from useQueries (called by component)
 * - Builds data and pagination state from results
 * - Handles URL updates for accordion changes (shallow: false)
 * - Reusable across table, list, gallery, board views
 *
 * @example
 * ```tsx
 * const ProductGroupTable = ({ expanded, limit }: Props) => {
 *   const trpc = useTRPC();
 *
 *   const { data: groupCounts } = useSuspenseQuery(
 *     trpc.product.getGroup.queryOptions({ groupBy: "familyGroup" }),
 *   );
 *
 *   const allGroupKeys = Object.keys(groupCounts);
 *
 *   const groupQueries = useQueries({
 *     queries: allGroupKeys.map((groupKey) => ({
 *       ...trpc.product.getMany.queryOptions({
 *         filters: [{ propertyId: "familyGroup", operator: "eq", value: groupKey }],
 *         limit,
 *       }),
 *       enabled: expanded.includes(groupKey),
 *     })),
 *   });
 *
 *   const { data, pagination, handleAccordionChange } = useGroupData({
 *     groupQueries,
 *     allGroupKeys,
 *     expanded,
 *     groupCounts,
 *     groupBy: "familyGroup",
 *     limit,
 *   });
 *
 *   return (
 *     <DataViewProvider data={data} pagination={pagination}>
 *       <TableView
 *         view={{
 *           group: {
 *             expandedGroups: expanded,
 *             onExpandedChange: handleAccordionChange,
 *           },
 *         }}
 *       />
 *     </DataViewProvider>
 *   );
 * };
 * ```
 */
export function useGroupData<TData>(
	input: UseGroupDataInput<TData>,
): UseGroupDataOutput<TData> {
	const {
		groupQueries,
		allGroupKeys,
		expanded,
		cursors,
		groupCounts,
		limit = 25,
		limitOptions,
	} = input;

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
		parseAsInteger.withOptions({ shallow: false }),
	);

	// Build groups array with items and pagination info
	const groups = useMemo(() => {
		return allGroupKeys.map((groupKey, index) => {
			const query = groupQueries[index];
			const isExpanded = expanded.includes(groupKey);
			const countInfo = groupCounts[groupKey] ?? { count: 0, hasMore: false };
			const items = isExpanded ? (query?.data?.items ?? []) : [];
			const cursorState = getCursor(cursors, groupKey);
			const groupStart = cursorState?.start ?? 0;
			const queryData = query?.data;

			const group: GroupInfo<TData> = {
				key: groupKey,
				value: groupKey,
				count: countInfo.count,
				hasMore: countInfo.hasMore,
				displayCount: countInfo.hasMore ? "99+" : String(countInfo.count),
				isLoading: isExpanded && (query?.isFetching ?? false),
				items,
				hasNext: queryData?.hasNextPage ?? false,
				hasPrev: groupStart > 0,
				displayStart: items.length > 0 ? groupStart + 1 : undefined,
				displayEnd: items.length > 0 ? groupStart + items.length : undefined,

				// URL setters for per-group pagination
				onNext: () => {
					const endCursor = queryData?.endCursor;
					if (endCursor == null) return;
					setCursors(
						setCursor(cursors, {
							group: groupKey,
							after: String(endCursor),
							start: groupStart + limit,
						}),
					);
				},

				onPrev: () => {
					const newStart = Math.max(0, groupStart - limit);
					if (newStart === 0) {
						// Going back to first page - remove cursor entry
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
				},
			};

			return group;
		});
	}, [
		allGroupKeys,
		groupQueries,
		expanded,
		cursors,
		groupCounts,
		limit,
		setCursors,
	]);

	// Build flattened data from query results
	const data = useMemo(() => {
		return groups.flatMap((group) => group.items);
	}, [groups]);

	// Limit change handler
	const onLimitChange = useCallback(
		(newLimit: number) => {
			setLimit(newLimit);
			setCursors([]); // Reset all cursors when limit changes
		},
		[setLimit, setCursors],
	);

	// Build pagination state (compatible with DataViewProvider)
	const pagination = useMemo<GroupedPaginationOutput<TData>>(() => {
		const isLoading = groupQueries.some((q) => q?.isFetching);

		return {
			items: data,
			limit,
			isLoading,
			groups,
			onLimitChange,
			limitOptions,
		};
	}, [data, limit, groups, groupQueries, onLimitChange, limitOptions]);

	const handleAccordionChange = useCallback(
		(newGroups: string[]) => {
			// Find which group was toggled
			const added = newGroups.find((g) => !expanded.includes(g));
			const removed = expanded.find((g) => !newGroups.includes(g));
			const changedGroup = added ?? removed;

			if (changedGroup) {
				const newExpanded = added
					? [...expanded, changedGroup]
					: expanded.filter((g) => g !== changedGroup);

				// Clear cursor for collapsed group
				if (removed) {
					setCursors(removeCursor(cursors, removed));
				}

				setExpanded(newExpanded.length > 0 ? newExpanded : null);
			}
		},
		[expanded, cursors, setExpanded, setCursors],
	);

	return { data, pagination, handleAccordionChange };
}
