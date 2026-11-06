"use client";

import { Loader2 } from "lucide-react";
import { useLoadMoreSentinel } from "@/hooks/dataview/use-load-more-sentinel";

interface InfiniteScrollGroupsSentinelProps {
  hasNext?: boolean;
  isFetching?: boolean;
  onLoadMore?: () => void;
}

/** Loads the next page of groups when scrolled into view. */
export function InfiniteScrollGroupsSentinel({
  hasNext,
  isFetching,
  onLoadMore,
}: InfiniteScrollGroupsSentinelProps) {
  const ref = useLoadMoreSentinel({ hasNext, isFetching, onLoadMore });

  if (!(hasNext || isFetching)) {
    return null;
  }

  return (
    <div className="flex items-center justify-center py-4" ref={ref}>
      {isFetching && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span className="text-sm">Loading more groups...</span>
        </div>
      )}
    </div>
  );
}
