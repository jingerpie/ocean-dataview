"use client";

import { NotionToolbar } from "@ocean-dataview/dataview/components/ui";
import {
  GallerySkeleton,
  GalleryView,
} from "@ocean-dataview/dataview/components/views/gallery-view";
import { useInfinitePagination } from "@ocean-dataview/dataview/hooks";
import { DataViewProvider } from "@ocean-dataview/dataview/lib/providers";
import { getSearchableProperties } from "@ocean-dataview/dataview/types";
import type { SortQuery, WhereNode } from "@ocean-dataview/shared/types";
import { buildSearchFilter } from "@ocean-dataview/shared/utils";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { useTRPC } from "@/utils/trpc/client";
import { PaginationTabs } from "./pagination-tabs";
import { productProperties } from "./product-properties";

interface ProductPaginationGalleryProps {
  limit: number;
  filter?: WhereNode | null;
  /** Raw search string from URL (for UI display) */
  search?: string;
  sort?: SortQuery[];
}

/**
 * Product Gallery with infinite pagination (load more).
 *
 * Pattern: Uses useSuspenseInfiniteQuery for data accumulation
 * - Data is appended when "Load More" is clicked
 * - Props are passed to DataViewProvider defaults
 * - Hooks read from defaults (server props), write to URL
 */
export function ProductPaginationGallery({
  limit: defaultLimit,
  filter = null,
  search: searchQuery = "",
  sort = [],
}: ProductPaginationGalleryProps) {
  const trpc = useTRPC();

  // Build search filter from raw search string
  const searchableFields = getSearchableProperties(productProperties);
  const search = buildSearchFilter(searchQuery, searchableFields);

  // Infinite query using TRPC infiniteQueryOptions
  const infiniteQuery = useSuspenseInfiniteQuery(
    trpc.product.getMany.infiniteQueryOptions(
      {
        limit: defaultLimit,
        filter,
        search,
        sort,
      },
      {
        getNextPageParam: (lastPage) => lastPage.endCursor ?? undefined,
      }
    )
  );

  // Use the new hook for pagination state
  const { items, pagination } = useInfinitePagination({
    infiniteQuery,
    limit: defaultLimit,
    limitOptions: [10, 25, 50, 100],
  });

  return (
    <Suspense fallback={<GallerySkeleton cardCount={6} />}>
      <DataViewProvider
        data={items}
        defaults={{
          filter,
          sort,
          search: searchQuery,
        }}
        pagination={pagination}
        properties={productProperties}
      >
        <NotionToolbar properties={productProperties}>
          <PaginationTabs />
        </NotionToolbar>

        {items.length === 0 ? (
          <div className="flex min-h-100 items-center justify-center">
            <p className="text-muted-foreground">No products found</p>
          </div>
        ) : (
          <GalleryView
            layout={{
              cardPreview: "image",
              cardSize: "medium",
              fitImage: true,
            }}
            pagination="infiniteScroll"
          />
        )}
      </DataViewProvider>
    </Suspense>
  );
}
