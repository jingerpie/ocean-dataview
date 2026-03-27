"use client";

import { ArrowDown, Loader2 } from "lucide-react";
import type { PaginationContext } from "../../../types/pagination";
import { Button } from "../button";

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
  error,
}: LoadMorePaginationProps) {
  // Don't show if no more items or no callback
  if (!(hasNext && onNext)) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-2 px-2 py-3">
      {error && <p className="text-destructive text-sm">Failed to load more</p>}
      <Button
        className="gap-2 font-normal text-muted-foreground hover:text-foreground"
        disabled={isFetchingNextPage}
        onClick={onNext}
        variant="ghost"
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
