"use client";

import { cn } from "../../../lib/utils";
import type { PropertyType } from "../../../types/filter.type";
import { getGalleryCardDimensions } from "../../../utils/get-card-sizes";
import { Card, CardContent } from "../../ui/card";
import { PaginationSkeleton } from "../../ui/pagination/pagination-skeleton";
import { Skeleton } from "../../ui/skeleton";
import { CARD_SKELETON_WIDTHS } from "../skeleton-widths";

type PaginationMode = "page" | "loadMore" | "infiniteScroll";

interface GallerySkeletonProps extends React.ComponentProps<"div"> {
  /**
   * Number of cards to display
   */
  cardCount: number;
  /**
   * Card size preset
   * @default "medium"
   */
  cardSize?: "small" | "medium" | "large";
  /**
   * Pagination mode - matches GalleryView pagination prop
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

export function GallerySkeleton({
  cardCount,
  cardSize = "medium",
  pagination,
  propertyTypes,
  withImage = true,
  className,
  ...props
}: GallerySkeletonProps) {
  const { imageHeight, minWidth } = getGalleryCardDimensions(cardSize);

  return (
    <div
      className={cn("flex w-full flex-col gap-2.5 overflow-clip", className)}
      {...props}
    >
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(auto-fill, minmax(${minWidth}px, 1fr))`,
        }}
      >
        {Array.from({ length: cardCount }).map((_, i) => (
          <Card className="gap-0 overflow-hidden py-0" key={i}>
            {withImage && (
              <Skeleton
                className="w-full rounded-none"
                style={{ height: imageHeight }}
              />
            )}
            <CardContent className="flex flex-col gap-2 p-3">
              {propertyTypes.map((type, j) => (
                <Skeleton
                  className="h-5"
                  key={j}
                  style={{ width: CARD_SKELETON_WIDTHS[type] }}
                />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <PaginationSkeleton mode={pagination} />
    </div>
  );
}
