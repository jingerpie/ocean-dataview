/**
 * Unified pagination context for cursor-based pagination
 * TableView builds this context and passes it to the pagination render function
 */
export interface PaginationContext {
	// LoadMorePagination props
	/** Callback to load more items (infinite scroll pattern) */
	onLoadMore?: () => void;
	/** Number of items remaining to load */
	remainingCount?: number;

	// Cursor-based PagePagination props
	/** Whether there is a next page */
	hasNext?: boolean;
	/** Whether there is a previous page */
	hasPrev?: boolean;
	/** Callback to navigate to next page */
	onNext?: () => void;
	/** Callback to navigate to previous page */
	onPrev?: () => void;

	// Shared props
	/** Number of items per page/batch (renamed from pageSize for cursor pagination) */
	limit?: number;
	/** Callback to change limit/batch size (renamed from onPageSizeChange) */
	onLimitChange?: (limit: number) => void;
	/** Loading state */
	isLoading?: boolean;
	/** Available limit options (renamed from pageSizeOptions) */
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

	// Legacy support (deprecated, kept for backward compatibility)
	/** @deprecated Use limit instead */
	pageSize?: number;
	/** @deprecated Use onLimitChange instead */
	onPageSizeChange?: (pageSize: number) => void;
	/** @deprecated Use limitOptions instead */
	pageSizeOptions?: number[];
}
