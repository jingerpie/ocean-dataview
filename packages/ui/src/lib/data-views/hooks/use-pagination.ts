"use client";

import { parseAsCursors } from "@ocean-dataview/shared/lib";
import {
	getCursor,
	getCursorParams,
	removeCursor,
	setCursor,
} from "@ocean-dataview/shared/types";
import { useQueries } from "@tanstack/react-query";
import { parseAsInteger, useQueryState } from "nuqs";
import { useCallback, useEffect, useMemo, useRef } from "react";

// ============================================================================
// Types
// ============================================================================

/**
 * Count format as returned by API
 * Example: { ACTIVE: { count: 99, hasMore: true }, ENDED: { count: 45, hasMore: false } }
 */
export interface CountsFormat {
	[key: string]: { count: number; hasMore: boolean };
}

/**
 * Query result shape from API
 */
export interface GroupQueryResult<TData> {
	items: TData[];
	startCursor: string | null;
	endCursor: string | null;
	hasNextPage?: boolean;
	hasPreviousPage?: boolean;
}

/**
 * Group information with cursor-based pagination
 */
export interface GroupInfo<TData> {
	/** Group key */
	key: string;
	/** Display value */
	value: string;
	/** Count for this group (capped at 100) */
	count: number;
	/** Whether there are more than 100 items */
	hasMore: boolean;
	/** Display count ("99+" or actual number) */
	displayCount: string;
	/** Loading state for this group */
	isLoading: boolean;
	/** Items in this group */
	items: TData[];
	/** Has next page */
	hasNext: boolean;
	/** Has previous page */
	hasPrev: boolean;
	/** Display start offset for "Showing X-Y" (1-indexed) */
	displayStart?: number;
	/** Display end offset for "Showing X-Y" */
	displayEnd?: number;
	/** Callback for next page */
	onNext: () => void;
	/** Callback for previous page */
	onPrev: () => void;
}

/**
 * Output for grouped cursor-based pagination
 */
export interface GroupedPaginationOutput<TData> {
	/** All items from expanded groups */
	items: TData[];
	/** Items per page */
	limit: number;
	/** Loading state */
	isLoading: boolean;
	/** Group array with pagination info */
	groups: GroupInfo<TData>[];
	/** Callback when limit changes */
	onLimitChange: (limit: number) => void;
	/** Limit options */
	limitOptions?: number[];
	/** Mode indicator */
	mode: "grouped";
}

/**
 * Base query options shape accepted by useQueries
 * Flexible enough to accept TRPC queryOptions or TanStack Query options
 * Uses Record type to be compatible with various query option structures
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type QueryOptionsLike = Record<string, any> & {
	queryKey: readonly unknown[];
};

/**
 * Input for grouped cursor-based pagination
 */
export interface GroupedPaginationInput {
	/** Which groups are currently expanded (controlled by parent) */
	expandedGroups: string[];
	/** Counts from API per group. Pass undefined while loading, data when ready. */
	counts: CountsFormat | undefined;
	/** Property to group by */
	groupBy: string;
	/**
	 * Factory function to create query options for a group.
	 * Returns TRPC queryOptions (or any TanStack Query options).
	 */
	createQueryOptions: (
		groupKey: string,
		after: string | undefined,
		before: string | undefined,
		limit: number,
	) => QueryOptionsLike;
	/** Default limit (static, doesn't change at runtime) */
	defaultLimit?: number;
	/** Limit options */
	limitOptions?: number[];
}

/**
 * Smart pagination output
 */
export interface SmartPaginationOutput<TData> {
	/** Merged data from all fetched sources */
	data: TData[];
	/** Pagination info */
	pagination: GroupedPaginationOutput<TData>;
	/** Global loading state */
	isLoading: boolean;
}

// ============================================================================
// Implementation
// ============================================================================

/**
 * Hook for cursor-based grouped pagination with declarative fetching.
 *
 * Key design:
 * - Uses `useQueries` with `enabled` flag based on `expandedGroups`
 * - No manual fetch tracking (refs) - TanStack Query handles lifecycle
 * - Auto-refetch when cache expires and group is re-expanded
 * - nuqs with `shallow: false` for URL state
 *
 * @example
 * ```tsx
 * const { expandedGroups, handleAccordionChange } = useGroupExpansion({
 *   defaultExpanded: ["PENDING"],
 * });
 *
 * const { data, pagination } = usePagination({
 *   expandedGroups,
 *   counts: groupCounts,
 *   createQueryOptions: (groupKey, after, before, limit) =>
 *     trpc.listing.getMany.queryOptions({
 *       filters: [{ propertyId: "status", operator: "eq", value: groupKey }],
 *       after,
 *       before,
 *       limit,
 *     }),
 * });
 * ```
 */
export function usePagination<TData>(
	input: GroupedPaginationInput,
): SmartPaginationOutput<TData> {
	const {
		expandedGroups,
		counts,
		createQueryOptions,
		defaultLimit = 25,
	} = input;

	// Derive loading state from counts being undefined
	const isCountsLoading = counts === undefined;

	// ========================================================================
	// URL State Management
	// ========================================================================

	const [cursors, setCursors] = useQueryState(
		"cursors",
		parseAsCursors.withDefault([]).withOptions({
			shallow: false,
			clearOnDefault: true,
		}),
	);

	const [limit, setLimit] = useQueryState(
		"limit",
		parseAsInteger.withDefault(defaultLimit).withOptions({
			shallow: false,
			clearOnDefault: true,
		}),
	);

	// ========================================================================
	// Declarative Data Fetching with useQueries
	// ========================================================================

	const groupKeys = useMemo(() => {
		if (!counts) return []; // undefined → empty array, no queries fire
		return Object.keys(counts);
	}, [counts]);

	const queries = useQueries({
		queries: groupKeys.map((groupKey) => {
			const cursorState = getCursor(cursors, groupKey);
			const { after, before } = getCursorParams(cursorState);
			const baseOptions = createQueryOptions(groupKey, after, before, limit);

			return {
				...baseOptions,
				// Only fetch when group is expanded
				enabled:
					expandedGroups.includes(groupKey) && (baseOptions.enabled ?? true),
				staleTime: 30_000,
			};
		}),
	});

	// ========================================================================
	// Previous Items Cache (for smooth pagination)
	// ========================================================================

	const previousItemsRef = useRef<Record<string, TData[]>>({});

	// Clear cache when group is collapsed (prevents stale data on re-expand)
	useEffect(() => {
		const expandedSet = new Set(expandedGroups);

		for (const key of Object.keys(previousItemsRef.current)) {
			if (!expandedSet.has(key)) {
				delete previousItemsRef.current[key];
			}
		}
	}, [expandedGroups]);

	// ========================================================================
	// URL State Helpers
	// ========================================================================

	const onLimitChange = useCallback(
		(newLimit: number) => {
			setLimit(newLimit);
			setCursors([]);
		},
		[setLimit, setCursors],
	);

	// ========================================================================
	// Build Groups Array
	// ========================================================================

	const groups = useMemo(() => {
		if (!counts) return [];

		return groupKeys.map((key, index) => {
			const { count, hasMore } = counts[key] ?? { count: 0, hasMore: false };
			const cursorState = getCursor(cursors, key);
			const groupStart = cursorState?.start ?? 0;

			const query = queries[index];
			const queryData = query?.data as GroupQueryResult<TData> | undefined;

			// Cache successful fetches
			if (queryData?.items?.length) {
				previousItemsRef.current[key] = queryData.items;
			}

			// Use cached items as fallback during fetch (Shopify-style smooth pagination)
			const groupItems =
				queryData?.items ?? previousItemsRef.current[key] ?? [];

			const startCursor = queryData?.startCursor ?? null;
			const endCursor = queryData?.endCursor ?? null;

			const displayStart = groupItems.length > 0 ? groupStart + 1 : undefined;
			const displayEnd =
				groupItems.length > 0 ? groupStart + groupItems.length : undefined;

			return {
				key,
				value: key,
				count,
				hasMore,
				displayCount: hasMore ? "99+" : String(count),
				// Use isFetching for pagination loading (true during fetch, but items still populated)
				isLoading: query?.isFetching ?? false,
				items: groupItems,
				hasNext: queryData?.hasNextPage ?? !!endCursor,
				hasPrev: groupStart > 0,
				displayStart,
				displayEnd,

				onNext: () => {
					if (!endCursor) return;
					setCursors(
						setCursor(cursors, {
							group: key,
							after: endCursor,
							start: groupStart + limit,
						}),
					);
				},

				onPrev: () => {
					const newStart = Math.max(0, groupStart - limit);

					if (newStart === 0) {
						setCursors(removeCursor(cursors, key));
					} else {
						if (!startCursor) return;
						setCursors(
							setCursor(cursors, {
								group: key,
								before: startCursor,
								start: newStart,
							}),
						);
					}
				},
			};
		});
	}, [groupKeys, counts, cursors, queries, limit, setCursors]);

	// ========================================================================
	// Build Output
	// ========================================================================

	const allData = useMemo(() => {
		return groups.flatMap((g) => g.items);
	}, [groups]);

	const anyGroupFetching = queries.some((q) => q.isFetching);

	const pagination: GroupedPaginationOutput<TData> = {
		items: allData,
		limit,
		isLoading: isCountsLoading || anyGroupFetching,
		groups,
		onLimitChange,
		limitOptions: input.limitOptions,
		mode: "grouped",
	};

	return {
		data: allData,
		pagination,
		isLoading: pagination.isLoading,
	};
}
