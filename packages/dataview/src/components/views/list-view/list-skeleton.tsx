"use client";

import { Skeleton } from "@ocean-dataview/dataview/components/ui/skeleton";
import { cn } from "@ocean-dataview/dataview/lib/utils";

interface ListSkeletonProps extends React.ComponentProps<"div"> {
  /**
   * Number of rows to display
   * @default 8
   */
  rowCount?: number;
  /**
   * Show toolbar skeleton
   * @default true
   */
  withToolbar?: boolean;
  /**
   * Show pagination skeleton
   * @default true
   */
  withPagination?: boolean;
  /**
   * Show dividers between rows
   * @default true
   */
  withDividers?: boolean;
  /**
   * Number of property lines per row
   * @default 3
   */
  propertyCount?: number;
}

export function ListSkeleton({
  rowCount = 8,
  withToolbar = true,
  withPagination = true,
  withDividers = true,
  propertyCount = 3,
  className,
  ...props
}: ListSkeletonProps) {
  return (
    <div
      className={cn("flex w-full flex-col gap-2.5 overflow-auto", className)}
      {...props}
    >
      {/* Toolbar */}
      {withToolbar && (
        <div className="flex w-full items-center justify-between gap-2 overflow-auto p-1">
          <div className="flex flex-1 items-center gap-2">
            <Skeleton className="h-7 w-[4.5rem] border-dashed" />
            <Skeleton className="h-7 w-[4.5rem] border-dashed" />
          </div>
          <Skeleton className="ml-auto hidden h-7 w-[4.5rem] lg:flex" />
        </div>
      )}

      {/* List Rows */}
      <div className="flex flex-col">
        {Array.from({ length: rowCount }).map((_, i) => (
          <div key={i}>
            <div
              className={cn(
                "flex flex-col gap-2 rounded-lg p-4",
                !withDividers && "border"
              )}
            >
              {/* Title line - wider */}
              <Skeleton className="h-5 w-1/3" />

              {/* Property lines - varying widths */}
              {Array.from({ length: propertyCount - 1 }).map((_, j) => (
                <Skeleton
                  className="h-4"
                  key={j}
                  style={{ width: j === 0 ? "100%" : "66%" }}
                />
              ))}
            </div>

            {/* Divider */}
            {withDividers && i < rowCount - 1 && (
              <div className="border-border border-b" />
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {withPagination && (
        <div className="flex w-full items-center justify-between gap-4 overflow-auto p-1 sm:gap-8">
          <Skeleton className="h-7 w-40 shrink-0" />
          <div className="flex items-center gap-4 sm:gap-6 lg:gap-8">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-7 w-[4.5rem]" />
            </div>
            <div className="flex items-center justify-center font-medium text-sm">
              <Skeleton className="h-7 w-20" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="hidden size-7 lg:block" />
              <Skeleton className="size-7" />
              <Skeleton className="size-7" />
              <Skeleton className="hidden size-7 lg:block" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
