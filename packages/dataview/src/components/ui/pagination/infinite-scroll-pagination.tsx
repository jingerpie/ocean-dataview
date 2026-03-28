"use client";

import { Loader2 } from "lucide-react";
import { useIntersectionObserver } from "../../../hooks/use-intersection-observer";
import type { PaginationContext } from "../../../types/pagination";

type InfiniteScrollPaginationProps = Partial<PaginationContext>;

/**
 * InfiniteScrollPagination component for automatic loading.
 * Uses Intersection Observer to detect when user scrolls near the sentinel element.
 * Data is appended to existing items (not replaced).
 */
export function InfiniteScrollPagination({
  hasNext = false,
  onNext,
  isFetchingNextPage = false,
  error,
}: InfiniteScrollPaginationProps) {
  const { targetRef } = useIntersectionObserver({
    rootMargin: "100px",
    recheckOn: [isFetchingNextPage],
    onVisible: () => {
      if (hasNext && !isFetchingNextPage && onNext) {
        onNext();
      }
    },
  });

  // Don't render if no more items and not loading
  if (!(hasNext || isFetchingNextPage)) {
    return null;
  }

  return (
    <div className="flex items-center justify-center py-4" ref={targetRef}>
      {error && <p className="text-destructive text-sm">Failed to load</p>}
      {isFetchingNextPage && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      )}
    </div>
  );
}
