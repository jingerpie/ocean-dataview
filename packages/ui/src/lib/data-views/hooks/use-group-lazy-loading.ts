"use client";

import { parseAsInteger, useQueryState } from "nuqs";
import { useCallback, useEffect, useMemo, useState } from "react";

export interface GroupState<TData> {
	items: TData[];
	currentPage: number;
	totalItems: number;
	hasMore: boolean;
	isLoading: boolean;
	isExpanded: boolean;
	// Computed fields for pagination
	totalPages: number;
	hasNext: boolean;
	hasPrev: boolean;
}

interface GroupSummary {
	key: string;
	value: string;
	count: number;
}

interface UseGroupLazyLoadingOptions<TData> {
	groupBy: string;
	defaultExpanded?: string[];
	defaultPageSize?: number;
	onFetchGroupItems: (params: {
		groupBy: string;
		groupValue: string;
		page: number;
		pageSize: number;
	}) => Promise<{
		items: TData[];
		totalItems: number;
		hasMore: boolean;
	}>;
	onFetchGroupSummary: (params: { groupBy: string }) => Promise<{
		groups: GroupSummary[];
	}>;
}

export interface UseGroupLazyLoadingResult<TData> {
	/** Group summaries with counts */
	groups: GroupSummary[];
	/** State for each group (items, pagination, loading) */
	groupStates: Map<string, GroupState<TData>>;
	/** Current page size for loading */
	pageSize: number;
	/** Loading state for initial group summary fetch */
	isLoadingSummary: boolean;
	/** Error from summary or item fetches */
	error: Error | null;
	/** Callback when a group is expanded */
	handleGroupExpand: (groupValue: string) => void;
	/** Callback to load more items for a specific group (infinite scroll) */
	handleLoadMore: (groupValue: string) => void;
	/** Callback to navigate to a specific page for a group (page-based) */
	handlePageChange: (groupValue: string, page: number) => void;
	/** Callback to change page size */
	handlePageSizeChange: (newPageSize: number) => void;
	/** Get remaining count for a specific group */
	getRemainingCount: (groupValue: string) => number;
}

/**
 * Hook for lazy-loading grouped data with per-group pagination
 *
 * Features:
 * - Fetches group summaries (counts) on mount
 * - Lazy loads items when group is expanded
 * - Supports "Load More" for each group
 * - Handles defaultExpanded (pre-fetches those groups)
 * - Configurable page size with URL state persistence
 */
export function useGroupLazyLoading<TData>({
	groupBy,
	defaultExpanded,
	defaultPageSize = 25,
	onFetchGroupItems,
	onFetchGroupSummary,
}: UseGroupLazyLoadingOptions<TData>): UseGroupLazyLoadingResult<TData> {
	// Page size stored in URL state
	const [pageSize, setPageSize] = useQueryState(
		"groupPageSize",
		parseAsInteger.withDefault(defaultPageSize),
	);

	// Group summaries (lightweight - just counts)
	const [groups, setGroups] = useState<GroupSummary[]>([]);
	const [isLoadingSummary, setIsLoadingSummary] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	// Per-group state (items, pagination, loading)
	const [groupStates, setGroupStates] = useState<
		Map<string, GroupState<TData>>
	>(new Map());

	// Determine which groups should be expanded on mount
	// Since defaultExpanded is now always an array
	const initiallyExpanded = useMemo(() => {
		return defaultExpanded ?? [];
	}, [defaultExpanded]);

	// Fetch group summary on mount
	useEffect(() => {
		let cancelled = false;

		async function fetchSummary() {
			try {
				setIsLoadingSummary(true);
				setError(null);

				const result = await onFetchGroupSummary({ groupBy });

				if (!cancelled) {
					setGroups(result.groups);
				}
			} catch (err) {
				if (!cancelled) {
					setError(
						err instanceof Error
							? err
							: new Error("Failed to fetch group summary"),
					);
				}
			} finally {
				if (!cancelled) {
					setIsLoadingSummary(false);
				}
			}
		}

		fetchSummary();

		return () => {
			cancelled = true;
		};
	}, [groupBy, onFetchGroupSummary]);

	// Fetch items for a specific group
	const fetchGroupItems = useCallback(
		async (
			groupValue: string,
			page: number,
			mode: "append" | "replace" = "append",
		) => {
			try {
				// Set loading state
				setGroupStates((prev) => {
					const newMap = new Map(prev);
					const existing = newMap.get(groupValue);
					const totalPages =
						existing?.totalItems && pageSize
							? Math.ceil(existing.totalItems / pageSize)
							: 1;
					newMap.set(groupValue, {
						items: existing?.items || [],
						currentPage: page,
						totalItems: existing?.totalItems || 0,
						hasMore: existing?.hasMore ?? true,
						isLoading: true,
						isExpanded: true,
						totalPages,
						hasNext: page < totalPages,
						hasPrev: page > 1,
					});
					return newMap;
				});

				// Fetch from API
				const result = await onFetchGroupItems({
					groupBy,
					groupValue,
					page,
					pageSize,
				});

				// Update with results
				setGroupStates((prev) => {
					const newMap = new Map(prev);
					const existing = newMap.get(groupValue);

					// Append or replace based on mode
					const items =
						mode === "append" && page > 1 && existing?.items
							? [...existing.items, ...result.items]
							: result.items;

					const totalPages = Math.ceil(result.totalItems / pageSize);

					newMap.set(groupValue, {
						items,
						currentPage: page,
						totalItems: result.totalItems,
						hasMore: result.hasMore,
						isLoading: false,
						isExpanded: true,
						totalPages,
						hasNext: page < totalPages,
						hasPrev: page > 1,
					});
					return newMap;
				});
			} catch (err) {
				setError(
					err instanceof Error ? err : new Error("Failed to fetch group items"),
				);

				// Clear loading state on error
				setGroupStates((prev) => {
					const newMap = new Map(prev);
					const existing = newMap.get(groupValue);
					if (existing) {
						newMap.set(groupValue, {
							...existing,
							isLoading: false,
						});
					}
					return newMap;
				});
			}
		},
		[groupBy, pageSize, onFetchGroupItems],
	);

	// Pre-fetch items for defaultExpanded groups
	useEffect(() => {
		if (groups.length === 0 || initiallyExpanded.length === 0) return;

		// Fetch items for each initially expanded group
		initiallyExpanded.forEach((groupValue) => {
			const existing = groupStates.get(groupValue);
			// Only fetch if not already loaded
			if (!existing || !existing.isExpanded) {
				fetchGroupItems(groupValue, 1);
			}
		});
	}, [groups, initiallyExpanded, fetchGroupItems, groupStates.get]);

	// Handle group expansion
	const handleGroupExpand = useCallback(
		(groupValue: string) => {
			const existing = groupStates.get(groupValue);

			// If already loaded, just mark as expanded
			if (existing && existing.items.length > 0) {
				setGroupStates((prev) => {
					const newMap = new Map(prev);
					newMap.set(groupValue, {
						...existing,
						isExpanded: true,
					});
					return newMap;
				});
				return;
			}

			// Otherwise, fetch first page
			fetchGroupItems(groupValue, 1);
		},
		[groupStates, fetchGroupItems],
	);

	// Handle load more for a specific group (infinite scroll - appends items)
	const handleLoadMore = useCallback(
		(groupValue: string) => {
			const existing = groupStates.get(groupValue);
			if (!existing) return;

			const nextPage = existing.currentPage + 1;
			fetchGroupItems(groupValue, nextPage, "append");
		},
		[groupStates, fetchGroupItems],
	);

	// Handle page change for a specific group (page navigation - replaces items)
	const handlePageChange = useCallback(
		(groupValue: string, page: number) => {
			fetchGroupItems(groupValue, page, "replace");
		},
		[fetchGroupItems],
	);

	// Handle page size change
	const handlePageSizeChange = useCallback(
		(newPageSize: number) => {
			setPageSize(newPageSize);

			// Reset all loaded groups (they'll need to re-fetch with new page size)
			setGroupStates((prev) => {
				const newMap = new Map<string, GroupState<TData>>();
				// Keep only expanded state, clear items
				prev.forEach((state, key) => {
					if (state.isExpanded) {
						const totalPages = Math.ceil(state.totalItems / newPageSize);
						newMap.set(key, {
							items: [],
							currentPage: 0,
							totalItems: state.totalItems,
							hasMore: true,
							isLoading: false,
							isExpanded: true,
							totalPages,
							hasNext: totalPages > 1,
							hasPrev: false,
						});
					}
				});
				return newMap;
			});

			// Re-fetch expanded groups with new page size
			groupStates.forEach((state, groupValue) => {
				if (state.isExpanded) {
					setTimeout(() => fetchGroupItems(groupValue, 1), 0);
				}
			});
		},
		[setPageSize, groupStates, fetchGroupItems],
	);

	// Get remaining count for a specific group
	const getRemainingCount = useCallback(
		(groupValue: string) => {
			const state = groupStates.get(groupValue);
			if (!state) return 0;
			return state.totalItems - state.items.length;
		},
		[groupStates],
	);

	return {
		groups,
		groupStates,
		pageSize,
		isLoadingSummary,
		error,
		handleGroupExpand,
		handleLoadMore,
		handlePageChange,
		handlePageSizeChange,
		getRemainingCount,
	};
}
