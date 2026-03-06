"use client";

import { CARD_SKELETON_WIDTHS } from "../../../lib/constants/skeleton-widths";
import { cn } from "../../../lib/utils";
import { getBoardCardDimensions } from "../../../lib/utils/get-card-sizes";
import type { PropertyType } from "../../../types";
import { Card, CardContent } from "../../ui/card";
import { PaginationSkeleton } from "../../ui/pagination-skeleton";
import { Skeleton } from "../../ui/skeleton";

type PaginationMode = "page" | "loadMore" | "infiniteScroll";

interface BoardSkeletonProps extends React.ComponentProps<"div"> {
  /**
   * Card size preset
   * @default "medium"
   */
  cardSize?: "small" | "medium" | "large";
  /**
   * Number of cards per column
   */
  cardsPerColumn: number;
  /**
   * Number of columns to display
   * @default 4
   */
  columnCount?: number;
  /**
   * Number of accordion group rows to show (for grouped board mode)
   * When > 0, shows column headers + accordion group skeletons instead of cards
   * @default 0
   */
  groupCount?: number;
  /**
   * Pagination mode - matches BoardView pagination prop
   */
  pagination?: PaginationMode;
  /**
   * Property types - determines realistic widths per property
   */
  propertyTypes: PropertyType[];
  /**
   * Show image placeholder in cards
   * @default true
   */
  withImage?: boolean;
}

export function BoardSkeleton({
  cardSize = "medium",
  cardsPerColumn,
  columnCount = 4,
  groupCount = 0,
  pagination,
  propertyTypes,
  withImage = true,
  className,
  ...props
}: BoardSkeletonProps) {
  const { imageHeight, columnWidth } = getBoardCardDimensions(cardSize);

  // Grouped board mode: show column headers + accordion group skeletons
  if (groupCount > 0) {
    return (
      <div className={cn("flex flex-col", className)} {...props}>
        {/* Column Headers Row */}
        <div className="flex gap-4 overflow-hidden border-b pb-2">
          {Array.from({ length: columnCount }).map((_, colIndex) => (
            <div
              className={cn(
                "flex shrink-0 items-center gap-2 px-2",
                columnWidth
              )}
              key={colIndex}
            >
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-5 w-6 rounded-full" />
            </div>
          ))}
        </div>

        {/* Accordion Group Headers */}
        <div className="flex flex-col">
          {Array.from({ length: groupCount }).map((_, groupIndex) => (
            <div className="border-b" key={groupIndex}>
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

        <PaginationSkeleton mode={pagination} />
      </div>
    );
  }

  // Flat board mode: show column headers + column containers with cards
  return (
    <div className={cn("flex flex-col", className)} {...props}>
      {/* Column Headers Row */}
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: columnCount }).map((_, colIndex) => (
          <div
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-t-lg bg-muted/40 px-3 py-2",
              columnWidth
            )}
            key={colIndex}
          >
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-4 w-6 rounded-full" />
          </div>
        ))}
      </div>

      {/* Column Containers with Cards */}
      <div className="flex gap-4 overflow-hidden pb-4">
        {Array.from({ length: columnCount }).map((_, colIndex) => (
          <div
            className={cn(
              "flex min-h-50 shrink-0 flex-col gap-4 rounded-b-lg bg-muted/40 p-2",
              columnWidth
            )}
            key={colIndex}
          >
            {/* Cards */}
            {Array.from({ length: cardsPerColumn }).map((_, cardIndex) => (
              <Card className="gap-0 overflow-hidden py-0" key={cardIndex}>
                {/* Image placeholder */}
                {withImage && (
                  <Skeleton
                    className="w-full rounded-none"
                    style={{ height: imageHeight }}
                  />
                )}

                {/* Card content */}
                <CardContent className="flex flex-col gap-2 p-3">
                  {propertyTypes.map((type, j) => (
                    <Skeleton
                      className="h-4"
                      key={j}
                      style={{ width: CARD_SKELETON_WIDTHS[type] }}
                    />
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        ))}
      </div>

      <PaginationSkeleton mode={pagination} />
    </div>
  );
}
