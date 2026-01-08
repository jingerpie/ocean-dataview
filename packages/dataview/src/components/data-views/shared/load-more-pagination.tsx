"use client";

import { Button } from "@ocean-dataview/dataview/components/ui/button";
import type { PaginationContext } from "@ocean-dataview/dataview/lib/data-views/types";
import { ArrowDown, Loader2 } from "lucide-react";

type LoadMorePaginationProps = Partial<PaginationContext>;

/**
 * LoadMorePagination component for load-more pagination.
 * Shows "Load More" button that triggers loading the next page.
 */
export function LoadMorePagination({
	hasNext = false,
	onNext,
	isLoading = false,
}: LoadMorePaginationProps) {
	// Don't show if no more items or no callback
	if (!hasNext || !onNext) {
		return null;
	}

	return (
		<div className="flex items-center justify-center py-2">
			<Button
				variant="ghost"
				onClick={onNext}
				disabled={isLoading}
				className="gap-2 font-normal text-muted-foreground hover:text-foreground"
			>
				{isLoading ? (
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
