"use client";

import { cn } from "../../lib/utils";
import { Skeleton } from "./skeleton";

interface GroupSectionSkeletonProps {
  /** Additional className */
  className?: string;
  /**
   * Number of group sections to show
   * @default 10
   */
  groupCount?: number;
}

/**
 * GroupSectionSkeleton - Loading skeleton for grouped views.
 *
 * Renders skeleton group headers that mimic the GroupSection accordion structure.
 * Used at the outer layer (DataViewProvider) to show loading state for group counts query.
 * Inner content (per-group data) is handled by view components with their own skeletons.
 *
 * Usage:
 * ```tsx
 * <GroupSectionSkeleton />
 * <GroupSectionSkeleton groupCount={5} />
 * ```
 */
export function GroupSectionSkeleton({
  className,
  groupCount = 10,
}: GroupSectionSkeletonProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      {Array.from({ length: groupCount }).map((_, i) => (
        <div key={i}>
          {/* Mimics AccordionTrigger structure from GroupSection */}
          <div className="flex items-center gap-2 py-3">
            {/* Chevron icon */}
            <Skeleton className="size-4" />
            {/* Group label */}
            <Skeleton className="h-5 w-24" />
            {/* Count badge */}
            <Skeleton className="h-4 w-8 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
