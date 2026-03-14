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

interface PaginationProps {
  context: PaginationContext | undefined;
  mode: PaginationMode | undefined;
}

/**
 * Renders the appropriate pagination component based on mode.
 * Used internally by view components (TableView, ListView, GalleryView, BoardView).
 */
export function Pagination({
  mode,
  context,
}: PaginationProps): React.ReactNode {
  if (!(mode && context)) {
    return null;
  }

  switch (mode) {
    case "page":
      return <PagePagination {...context} />;
    case "loadMore":
      return <LoadMorePagination {...context} />;
    case "infiniteScroll":
      return <InfiniteScrollPagination {...context} />;
    default:
      return null;
  }
}
