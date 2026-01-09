/**
 * Unified pagination context for cursor-based pagination.
 * Used by pagination components (PagePagination, LoadMorePagination, InfiniteScrollPagination).
 */
export interface PaginationContext {
	// Navigation
	/** Whether there is a next page */
	hasNext?: boolean;
	/** Whether there is a previous page */
	hasPrev?: boolean;
	/** Callback to navigate to next page */
	onNext?: () => void;
	/** Callback to navigate to previous page */
	onPrev?: () => void;

	// Limit/Page size
	/** Number of items per page/batch */
	limit?: number;
	/** Callback to change limit/batch size */
	onLimitChange?: (limit: number) => void;
	/** Available limit options */
	limitOptions?: number[];

	// Item range display ("X-Y of Total")
	/** Display start offset for "Showing X-Y" */
	displayStart?: number;
	/** Display end offset for "Showing X-Y" */
	displayEnd?: number;
	/** Total count of items in current group/view */
	totalCount?: number;
	/** Indicates if total count is capped (e.g., "100+") */
	hasMoreThanMax?: boolean;

	// Loading states
	/**
	 * isLoading: true when fetching with no cached data (initial load)
	 * Use to avoid layout shift on initial load.
	 */
	isLoading?: boolean;
	/**
	 * isFetching: true when any request is in flight (initial or refetch)
	 * Use to show subtle refresh indicators.
	 */
	isFetching?: boolean;
	/**
	 * isFetchingNextPage: true specifically when loading next page (infinite only)
	 * Use for load-more/infinite-scroll spinners.
	 */
	isFetchingNextPage?: boolean;

	// Error state
	/** Error from the request */
	error?: Error | null;
	/** Whether the request errored */
	isError?: boolean;

	// Infinite scroll specific
	/** Total items loaded across all pages (for load-more/infinite-scroll) */
	totalLoaded?: number;
}
