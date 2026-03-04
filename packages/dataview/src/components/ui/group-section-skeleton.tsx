"use client";

import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import { Skeleton } from "./skeleton";

interface GroupSectionSkeletonProps {
  /** View-specific skeleton to render inside expanded groups */
  children: ReactNode;
  /** Additional className */
  className?: string;
  /**
   * Number of groups to show as expanded (showing children skeleton)
   * @default 1
   */
  expandedCount?: number;
  /**
   * Number of group sections to show
   * @default 3
   */
  groupCount?: number;
}

/**
 * GroupSectionSkeleton - Loading skeleton for grouped views.
 *
 * Renders skeleton group headers that mimic the GroupSection accordion structure.
 * Accepts children (the view-specific skeleton) to render inside expanded groups.
 *
 * Usage:
 * ```tsx
 * <GroupSectionSkeleton groupCount={3}>
 *   <TableSkeleton withPagination={false} rowCount={5} />
 * </GroupSectionSkeleton>
 * ```
 */
export function GroupSectionSkeleton({
  children,
  className,
  expandedCount = 1,
  groupCount = 3,
}: GroupSectionSkeletonProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      {Array.from({ length: groupCount }).map((_, i) => {
        const isExpanded = i < expandedCount;

        return (
          <div className="border-b" key={i}>
            {/* Mimics AccordionTrigger structure from GroupSection */}
            <div className="flex items-center gap-2 py-3">
              {/* Chevron icon */}
              <Skeleton className="size-4" />
              {/* Group label */}
              <Skeleton className="h-5 w-24" />
              {/* Count badge */}
              <Skeleton className="h-4 w-8 rounded-full" />
            </div>

            {/* Show content skeleton for expanded groups */}
            {isExpanded && <div className="pb-4">{children}</div>}
          </div>
        );
      })}
    </div>
  );
}
