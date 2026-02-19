"use client";

import type { PaginationContext } from "../../../types";
import { InfiniteScrollPagination } from "./infinite-scroll-pagination";
import { LoadMorePagination } from "./load-more-pagination";
import { PagePagination } from "./page-pagination";

/**
 * Pagination mode for view components.
 * - "page": Classic prev/next pagination with "Showing X-Y"
 * - "loadMore": "Load more" button that appends items
 * - "infiniteScroll": Automatic loading when scrolling near bottom
 * - undefined: No pagination UI
 */
export type PaginationMode = "page" | "loadMore" | "infiniteScroll";

/**
 * Renders the appropriate pagination component based on mode.
 * Used internally by view components (TableView, ListView, GalleryView, BoardView).
 *
 * @param mode - The pagination mode
 * @param context - The pagination context with controls and state
 * @returns The pagination component or null
 */
export function renderPagination(
  mode: PaginationMode | undefined,
  context: PaginationContext | undefined
): React.ReactNode {
  if (!(mode && context)) {
    return null;
  }

  switch (mode) {
    case "page":
      return (
        <div className="sticky bottom-0 z-10 border-t bg-background py-2">
          <PagePagination {...context} />
        </div>
      );
    case "loadMore":
      return <LoadMorePagination {...context} />;
    case "infiniteScroll":
      return <InfiniteScrollPagination {...context} />;
    default:
      return null;
  }
}
