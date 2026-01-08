"use client";

import { parseAsExpanded } from "@ocean-dataview/shared/lib";
import { useInfiniteQuery } from "@tanstack/react-query";
import { parseAsInteger, useQueryState } from "nuqs";
import { useCallback, useMemo, useTransition } from "react";

// ============================================================================
// Types
// ============================================================================

/**
 * Standard paginated response shape from API
 */
export interface GroupInfinitePaginatedResponse<TData> {
	items: TData[];
	endCursor?: string | number | null;
	hasNextPage?: boolean;
}

/**
 * Group counts format from API
 */
export interface GroupInfiniteCounts {
	[key: string]: { count: number; hasMore: boolean };
}

/**
 * Query options for infinite query.
 * Compatible with TRPC's infiniteQueryOptions return type.
 * Uses loose typing to accept TRPC's return type which has more context parameters.
 */
export interface GroupInfiniteQueryOptions {
	queryKey: readonly unknown[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	queryFn?: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	getNextPageParam?: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	initialPageParam?: any;
}

/**
 * Input options for useGroupInfinitePagination hook
 */
export interface UseGroupInfinitePaginationOptions<TData> {
	/** All group keys in stable order */
	allGroupKeys: string[];
	/** Currently expanded groups */
	expanded: string[];
	/** Group counts from API */
	groupCounts: GroupInfiniteCounts;
	/** Items per page/batch */
	limit: number;
	/** Factory to create query options for each group */
	createQueryOptions: (groupKey: string) => GroupInfiniteQueryOptions;
	/** Max groups to support (default: 10) */
	maxGroups?: number;
	/** Available limit options (default: [10, 25, 50, 100]) */
	limitOptions?: number[];
}

/**
 * Per-group infinite pagination info
 */
export interface GroupInfiniteInfo<TData> {
	key: string;
	value: string;
	items: TData[];
	count: number;
	hasMore: boolean;
	displayCount: string;
	hasNext: boolean;
	onNext: () => void;
	totalLoaded: number;
	isFetchingNextPage: boolean;
	isLoading: boolean;
	isFetching: boolean;
	error: unknown;
	isError: boolean;
}

/**
 * Pagination state for grouped infinite views
 */
export interface GroupInfinitePaginationState<TData> {
	groups: GroupInfiniteInfo<TData>[];
	limit: number;
	onLimitChange: (limit: number) => void;
	limitOptions: number[];
	isLoading: boolean;
}

/**
 * Output type for useGroupInfinitePagination hook
 */
export interface GroupInfinitePaginationResult<TData> {
	/** Flattened data from all groups */
	data: TData[];
	/** Pagination state for DataViewProvider */
	pagination: GroupInfinitePaginationState<TData>;
	/** Handler for accordion expand/collapse */
	handleAccordionChange: (newExpanded: string[]) => void;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_LIMIT_OPTIONS = [10, 25, 50, 100];
const DEFAULT_MAX_GROUPS = 10;

// ============================================================================
// Internal Hook for Creating Queries
// ============================================================================

/**
 * Default getNextPageParam for infinite queries
 */
const defaultGetNextPageParam = (
	lastPage: GroupInfinitePaginatedResponse<unknown>,
): string | undefined =>
	lastPage.hasNextPage && lastPage.endCursor
		? String(lastPage.endCursor)
		: undefined;

/**
 * Creates fixed number of infinite queries to satisfy React hooks rules.
 * Always calls maxGroups hooks, using enabled flag to control which run.
 */
function useGroupInfiniteQueries<TData>(
	allGroupKeys: string[],
	expanded: string[],
	maxGroups: number,
	createQueryOptions: (groupKey: string) => GroupInfiniteQueryOptions,
) {
	const queries = [];

	// Placeholder options for unused slots
	const placeholderOptions = {
		queryKey: ["__placeholder"] as const,
		queryFn: async () =>
			({
				items: [],
				hasNextPage: false,
			}) as GroupInfinitePaginatedResponse<TData>,
		getNextPageParam: () => undefined,
		initialPageParam: "" as string,
	};

	for (let i = 0; i < maxGroups; i++) {
		const groupKey = allGroupKeys[i];
		const isEnabled = groupKey != null && expanded.includes(groupKey);

		// Get query options from factory (or use placeholder)
		const options = groupKey
			? createQueryOptions(groupKey)
			: { queryKey: ["__placeholder", i] as const };

		// eslint-disable-next-line react-hooks/rules-of-hooks
		const query = useInfiniteQuery({
			queryKey: options.queryKey,
			queryFn: options.queryFn ?? placeholderOptions.queryFn,
			getNextPageParam:
				(options.getNextPageParam as typeof defaultGetNextPageParam) ??
				defaultGetNextPageParam,
			initialPageParam: (options.initialPageParam as string) ?? "",
			enabled: isEnabled,
		});

		queries.push(query);
	}

	return queries;
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Hook for grouped infinite scroll / load-more pagination.
 *
 * Features:
 * - Per-group infinite scroll with load-more buttons
 * - Accordion expansion state management
 * - Creates infinite queries internally (handles React hooks rules)
 * - URL state for expanded groups and limit
 * - Compatible with TRPC's infiniteQueryOptions
 *
 * @example
 * ```tsx
 * const ProductGroupGallery = ({ expanded: expandedProp, limit }: Props) => {
 *   const trpc = useTRPC();
 *
 *   const { data: groupCounts } = useSuspenseQuery(
 *     trpc.product.getGroup.queryOptions({ groupBy: "familyGroup" }),
 *   );
 *
 *   const expanded = expandedProp ?? DEFAULT_EXPANDED;
 *   const allGroupKeys = Object.keys(groupCounts);
 *
 *   const { data, pagination, handleAccordionChange } = useGroupInfinitePagination<Product>({
 *     allGroupKeys,
 *     expanded,
 *     groupCounts,
 *     limit,
 *     createQueryOptions: (groupKey) =>
 *       trpc.product.getMany.infiniteQueryOptions(
 *         {
 *           filters: [{ propertyId: "familyGroup", operator: "eq", value: groupKey }],
 *           limit,
 *         },
 *         { getNextPageParam: (lastPage) => lastPage.endCursor ?? undefined },
 *       ),
 *   });
 *
 *   return (
 *     <DataViewProvider data={data} pagination={pagination}>
 *       <GalleryView
 *         view={{
 *           group: {
 *             groupBy: "familyGroup",
 *             expandedGroups: expanded,
 *             onExpandedChange: handleAccordionChange,
 *           },
 *         }}
 *         pagination="loadMore"
 *       />
 *     </DataViewProvider>
 *   );
 * };
 * ```
 */
export function useGroupInfinitePagination<TData>(
	options: UseGroupInfinitePaginationOptions<TData>,
): GroupInfinitePaginationResult<TData> {
	const {
		allGroupKeys,
		expanded,
		groupCounts,
		limit,
		createQueryOptions,
		maxGroups = DEFAULT_MAX_GROUPS,
		limitOptions = DEFAULT_LIMIT_OPTIONS,
	} = options;

	const [, startTransition] = useTransition();

	// URL setters - shallow: false for server re-render to update props
	const [, setExpanded] = useQueryState(
		"expanded",
		parseAsExpanded.withOptions({ shallow: false }),
	);
	const [, setLimit] = useQueryState(
		"limit",
		parseAsInteger.withOptions({ shallow: false, clearOnDefault: true }),
	);

	// Create infinite queries internally
	const infiniteQueries = useGroupInfiniteQueries(
		allGroupKeys,
		expanded,
		maxGroups,
		createQueryOptions,
	);

	// Build groups array with items and pagination info
	const groups = useMemo(() => {
		return allGroupKeys.map((groupKey, index) => {
			const query = infiniteQueries[index];
			const isExpanded = expanded.includes(groupKey);
			const countInfo = groupCounts[groupKey] ?? { count: 0, hasMore: false };

			// Flatten all pages for this group
			const items = isExpanded
				? ((query?.data?.pages?.flatMap(
						(page) => (page as GroupInfinitePaginatedResponse<TData>).items,
					) ?? []) as TData[])
				: ([] as TData[]);

			const group: GroupInfiniteInfo<TData> = {
				key: groupKey,
				value: groupKey,
				count: countInfo.count,
				hasMore: countInfo.hasMore,
				displayCount: countInfo.hasMore ? "99+" : String(countInfo.count),
				items,
				hasNext: query?.hasNextPage ?? false,
				totalLoaded: items.length,
				isFetchingNextPage: query?.isFetchingNextPage ?? false,
				isLoading: query?.isLoading ?? false,
				isFetching: isExpanded && (query?.isFetching ?? false),
				error: query?.error,
				isError: query?.isError ?? false,

				onNext: () => {
					if (query?.hasNextPage && !query?.isFetchingNextPage) {
						query.fetchNextPage();
					}
				},
			};

			return group;
		});
	}, [allGroupKeys, infiniteQueries, expanded, groupCounts]);

	// Flatten all items
	const data = useMemo(() => groups.flatMap((g) => g.items), [groups]);

	// Limit change handler
	const onLimitChange = useCallback(
		(newLimit: number) => {
			startTransition(() => {
				setLimit(newLimit);
			});
		},
		[setLimit],
	);

	// Accordion change handler
	const handleAccordionChange = useCallback(
		(newExpanded: string[]) => {
			startTransition(() => {
				setExpanded(newExpanded.length > 0 ? newExpanded : null);
			});
		},
		[setExpanded],
	);

	// Check if any group is loading
	const isLoading = infiniteQueries.some((q) => q?.isFetching);

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
