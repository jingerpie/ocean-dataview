"use client";

import { useThrottler } from "@tanstack/react-pacer";
import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import type { PaginationContext } from "../../../types";

const THROTTLE_MS = 200;

type InfiniteScrollPaginationProps = Partial<PaginationContext>;

/**
 * InfiniteScrollPagination component for automatic loading.
 * Uses Intersection Observer to detect when user scrolls near the sentinel element.
 * Data is appended to existing items (not replaced).
 *
 * Includes 200ms throttle to prevent race conditions when user scrolls
 * rapidly near the trigger point (React state updates are async).
 */
export function InfiniteScrollPagination({
  hasNext = false,
  onNext,
  isFetchingNextPage = false,
  error,
}: InfiniteScrollPaginationProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Use refs to avoid stale closures in the throttled callback
  const stateRef = useRef({ hasNext, isFetchingNextPage, onNext });
  stateRef.current = { hasNext, isFetchingNextPage, onNext };

  // Throttle: at most one call per 200ms, leading edge (fires immediately)
  const throttledOnNext = useThrottler(
    () => {
      const { hasNext, isFetchingNextPage, onNext } = stateRef.current;
      if (hasNext && !isFetchingNextPage && onNext) {
        onNext();
      }
    },
    { wait: THROTTLE_MS, leading: true, trailing: false }
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          throttledOnNext.maybeExecute();
        }
      },
      {
        rootMargin: "100px", // Trigger 100px before reaching the sentinel
        threshold: 0,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
      throttledOnNext.cancel();
    };
  }, [throttledOnNext]);

  // Don't render if no more items and not loading
  if (!(hasNext || isFetchingNextPage)) {
    return null;
  }

  return (
    <div className="flex items-center justify-center py-4" ref={sentinelRef}>
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
