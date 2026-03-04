"use client";

import { cn } from "../../../lib/utils";
import { getGalleryCardDimensions } from "../../../lib/utils/get-card-sizes";
import { Card, CardContent } from "../../ui/card";
import { Skeleton } from "../../ui/skeleton";

interface GallerySkeletonProps extends React.ComponentProps<"div"> {
  /**
   * Number of cards to display
   * @default 6
   */
  cardCount?: number;
  /**
   * Card size preset
   * @default "medium"
   */
  cardSize?: "small" | "medium" | "large";
  /**
   * Number of property lines per card
   * @default 2
   */
  propertyCount?: number;
  /**
   * Show image placeholder in cards
   * @default true
   */
  withImage?: boolean;
  /**
   * Show pagination skeleton
   * @default true
   */
  withPagination?: boolean;
}

export function GallerySkeleton({
  cardCount = 6,
  cardSize = "medium",
  withPagination = true,
  withImage = true,
  propertyCount = 2,
  className,
  ...props
}: GallerySkeletonProps) {
  const { imageHeight, cols } = getGalleryCardDimensions(cardSize);

  return (
    <div
      className={cn("flex w-full flex-col gap-2.5 overflow-auto", className)}
      {...props}
    >
      {/* Card Grid */}
      <div className={cn("grid gap-4", cols)}>
        {Array.from({ length: cardCount }).map((_, i) => (
          <Card className="gap-0 overflow-hidden py-0" key={i}>
            {/* Image placeholder */}
            {withImage && (
              <Skeleton
                className="w-full rounded-none"
                style={{ height: imageHeight }}
              />
            )}

            {/* Card content */}
            <CardContent className="flex flex-col gap-2 p-3">
              {Array.from({ length: propertyCount }).map((_, j) => (
                <Skeleton
                  className="h-4"
                  key={j}
                  style={{ width: j === 0 ? "75%" : "50%" }}
                />
              ))}
            </CardContent>
          </Card>
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
