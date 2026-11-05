"use client";

import { cn } from "../../lib/utils";
import { Skeleton } from "../ui/skeleton";

const TAB_WIDTHS = [48, 64, 56, 72, 52, 60] as const;

interface ToolbarSkeletonProps extends React.ComponentProps<"div"> {
  /**
   * Show filter button skeleton
   * @default true
   */
  enableFilter?: boolean;
  /**
   * Show search button skeleton
   * @default true
   */
  enableSearch?: boolean;
  /**
   * Show settings button skeleton
   * @default false
   */
  enableSettings?: boolean;
  /**
   * Show sort button skeleton
   * @default true
   */
  enableSort?: boolean;
  /**
   * Number of tab skeletons to show on the left side
   * @default 0
   */
  tabCount?: number;
}

export function ToolbarSkeleton({
  enableFilter = true,
  enableSearch = true,
  enableSettings = false,
  enableSort = true,
  tabCount = 0,
  className,
  ...props
}: ToolbarSkeletonProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)} {...props}>
      <div className="flex h-9 items-center gap-2">
        {/* Left side: Tabs */}
        {tabCount > 0 && (
          <div className="hidden h-8 items-center gap-1 rounded-lg bg-muted p-1 sm:flex">
            {Array.from({ length: tabCount }).map((_, i) => (
              <Skeleton
                className="h-6 rounded-md bg-transparent"
                key={i}
                style={{ width: TAB_WIDTHS[i % TAB_WIDTHS.length] }}
              />
            ))}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right side: Control buttons */}
        <div className="ml-auto flex items-center gap-1">
          {enableFilter && <Skeleton className="size-8 rounded-md" />}
          {enableSort && <Skeleton className="size-8 rounded-md" />}
          {enableSearch && <Skeleton className="size-8 rounded-md" />}
          {enableSettings && <Skeleton className="size-8 rounded-md" />}
        </div>
      </div>
    </div>
  );
}
