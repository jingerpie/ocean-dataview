"use client";

import { Button } from "@ocean-dataview/dataview/components/ui/button";
import type { PaginationContext } from "@ocean-dataview/dataview/types";
import { ArrowDown, Loader2 } from "lucide-react";

type LoadMorePaginationProps = Partial<PaginationContext>;

/**
 * LoadMorePagination component for load-more pagination.
 * Shows "Load More" button that triggers loading the next page.
 * Data is appended to existing items (not replaced).
 */
export function LoadMorePagination({
	hasNext = false,
	onNext,
	isFetchingNextPage = false,
	totalLoaded,
	error,
}: LoadMorePaginationProps) {
	// Don't show if no more items or no callback
	if (!hasNext || !onNext) {
		return null;
	}

	return (
		<div className="flex flex-col items-center gap-2 py-4">
			{error && <p className="text-destructive text-sm">Failed to load more</p>}
			{totalLoaded != null && (
				<span className="text-muted-foreground text-sm">
					Showing {totalLoaded} items
				</span>
			)}
			<Button
				variant="ghost"
				onClick={onNext}
				disabled={isFetchingNextPage}
				className="gap-2 font-normal text-muted-foreground hover:text-foreground"
			>
				{isFetchingNextPage ? (
					<>
						<Loader2 className="h-4 w-4 animate-spin" />
						Loading...
					</>
				) : (
					<>
						<ArrowDown className="h-4 w-4" />
						Load more
					</>
				)}
			</Button>
		</div>
	);
}
