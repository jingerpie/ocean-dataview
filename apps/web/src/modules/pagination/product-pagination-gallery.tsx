"use client";

import { useInfinitePagination } from "@sparkyidea/dataview/hooks";
import { DataViewProvider } from "@sparkyidea/dataview/providers";
import { NotionToolbar } from "@sparkyidea/dataview/toolbars/notion";
import { getSearchableProperties } from "@sparkyidea/dataview/types";
import {
  GallerySkeleton,
  GalleryView,
} from "@sparkyidea/dataview/views/gallery-view";
import type { Limit, SortQuery, WhereNode } from "@sparkyidea/shared/types";
import { buildSearchFilter } from "@sparkyidea/shared/utils";
import { Suspense } from "react";
import { useTRPC } from "@/utils/trpc/client";
import { productProperties } from "./product-properties";
import { ViewNav } from "./view-nav";

interface ProductPaginationGalleryProps {
  filter?: WhereNode[] | null;
  limit: Limit;
  /** Raw search string from URL (for UI display) */
  search?: string;
  sort?: SortQuery[];
}

/**
 * Product Gallery with infinite pagination (load more).
 *
 * Pattern: Uses useInfinitePagination (flat mode)
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

  // Use unified hook for pagination state (flat mode)
  const { data, pagination } = useInfinitePagination({
    limit: defaultLimit,
    queryOptions: () =>
      trpc.product.getMany.infiniteQueryOptions(
        {
          limit: defaultLimit,
          filter,
          search,
          sort,
        },
        {
          getNextPageParam: (lastPage) =>
            lastPage.hasNextPage ? lastPage.endCursor : undefined,
        }
      ),
  });

  return (
    <Suspense fallback={<GallerySkeleton cardCount={6} />}>
      <DataViewProvider
        data={data}
        filter={filter}
        pagination={pagination}
        properties={productProperties}
        search={searchQuery}
        sort={sort}
      >
        <NotionToolbar enableSettings properties={productProperties}>
          <ViewNav />
        </NotionToolbar>

        {data.length === 0 ? (
          <div className="flex min-h-100 items-center justify-center">
            <p className="text-muted-foreground">No products found</p>
          </div>
        ) : (
          <GalleryView
            cardPreview="productImage"
            cardSize="medium"
            fitMedia
            pagination="infiniteScroll"
          />
        )}
      </DataViewProvider>
    </Suspense>
  );
}
