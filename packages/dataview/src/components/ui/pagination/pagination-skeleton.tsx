"use client";

import { Skeleton } from "../skeleton";

type PaginationMode = "page" | "loadMore" | "infiniteScroll";

interface PaginationSkeletonProps {
  mode?: PaginationMode;
}

/**
 * Skeleton for pagination UI
 * - "page": Shows prev/next buttons + page info
 * - "loadMore": Shows a single button
 * - "infiniteScroll" or undefined: Shows nothing
 */
export function PaginationSkeleton({ mode }: PaginationSkeletonProps) {
  if (mode === "page") {
    return (
      <div className="flex items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
          <Skeleton className="h-8 w-12" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-18 rounded-md" />
        </div>
      </div>
    );
  }

  if (mode === "loadMore") {
    return (
      <div className="flex justify-center py-2">
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>
    );
  }

  // infiniteScroll or undefined = nothing
  return null;
}
