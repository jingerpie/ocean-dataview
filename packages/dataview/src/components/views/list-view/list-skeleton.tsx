"use client";

import {
  ROW_PATTERNS,
  ROW_SKELETON_WIDTHS,
} from "../../../lib/constants/skeleton-widths";
import { cn } from "../../../lib/utils";
import type { PropertyType } from "../../../types";
import { PaginationSkeleton } from "../../ui/pagination-skeleton";
import { Skeleton } from "../../ui/skeleton";

type PaginationMode = "page" | "loadMore" | "infiniteScroll";

interface ListSkeletonProps extends React.ComponentProps<"div"> {
  /**
   * Pagination mode - matches ListView pagination prop
   */
  pagination?: PaginationMode;
  /**
   * Property types for each column - determines realistic widths
   */
  propertyTypes: PropertyType[];
  /**
   * Number of rows to display
   */
  rowCount: number;
}

export function ListSkeleton({
  pagination,
  propertyTypes,
  rowCount,
  className,
  ...props
}: ListSkeletonProps) {
  return (
    <div className={cn("flex w-full flex-col gap-2.5", className)} {...props}>
      <div className="overflow-clip">
        <div className="flex w-max min-w-full flex-col">
          {Array.from({ length: rowCount }).map((_, rowIndex) => {
            // Use row pattern for visual variety
            const patternOffset =
              ROW_PATTERNS[rowIndex % ROW_PATTERNS.length] ?? 0;

            return (
              <div
                className="flex items-center gap-4 rounded-md px-2 py-1"
                key={rowIndex}
              >
                {propertyTypes.map((type, colIndex) => {
                  // Apply pattern offset to create visual variety
                  const offsetIndex =
                    (colIndex + patternOffset) % propertyTypes.length;
                  const offsetType = propertyTypes[offsetIndex] ?? type;

                  return (
                    <Skeleton
                      className="h-6 shrink-0"
                      key={colIndex}
                      style={{ minWidth: ROW_SKELETON_WIDTHS[offsetType] }}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <PaginationSkeleton mode={pagination} />
    </div>
  );
}
