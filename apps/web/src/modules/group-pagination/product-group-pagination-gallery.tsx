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
import {
  buildSearchFilter,
  combineGroupFilter,
} from "@sparkyidea/shared/utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { useTRPC } from "@/utils/trpc/client";
import { productProperties } from "./product-properties";
import { ViewNav } from "./view-nav";

/**
 * Props passed from server (parsed URL params)
 */
interface Props {
  expanded: string[];
  filter?: WhereNode[] | null;
  limit: Limit;
  /** Raw search string from URL (for UI display) */
  search?: string;
  sort?: SortQuery[];
}

/**
 * Product Group Gallery with infinite load-more pagination per group.
 *
 * Pattern: Uses useInfinitePagination with groupBy for per-group data accumulation
 * - Each group has its own "Load More" button
 * - Data accumulates client-side per group
 */
export function ProductGroupPaginationGallery({
  expanded,
  limit,
  filter = null,
  search: searchQuery = "",
  sort = [],
}: Props) {
  const trpc = useTRPC();

  // Build search filter from raw search string
  const searchableFields = getSearchableProperties(productProperties);
  const search = buildSearchFilter(searchQuery, searchableFields);

  // 1. Group counts (Suspense OK - matches server prefetch)
  const { data: groupData } = useSuspenseQuery(
    trpc.product.getGroup.queryOptions({
      groupBy: { bySelect: { property: "category" } },
    })
  );

  // 2. Get all group keys
  const allGroupKeys = Object.keys(groupData.counts);

  // Use unified infinite pagination with groupBy for per-group load more
  const { data, pagination, handleAccordionChange, expandedGroups } =
    useInfinitePagination({
      limit,
      groupBy: {
        allGroupKeys,
        expanded,
      },
      queryOptions: (groupKey) =>
        trpc.product.getMany.infiniteQueryOptions(
          {
            filter: combineGroupFilter("category", groupKey, filter),
            search,
            sort,
            limit,
          },
          {
            getNextPageParam: (lastPage) =>
              lastPage.hasNextPage ? lastPage.endCursor : undefined,
          }
        ),
    });

  // Empty state
  if (pagination.groups.length === 0) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <p className="text-muted-foreground">No products found</p>
      </div>
    );
  }

  return (
    <Suspense fallback={<GallerySkeleton cardCount={6} />}>
      <DataViewProvider
        counts={{
          group: groupData.counts,
          groupSortValues: groupData.sortValues,
        }}
        data={data}
        filter={filter}
        group={{
          bySelect: { property: "category" },
          showCount: true,
          expanded: expandedGroups,
          onExpandedChange: handleAccordionChange,
        }}
        pagination={pagination}
        properties={productProperties}
        search={searchQuery}
        sort={sort}
      >
        <NotionToolbar
          enableSettings
          groupProperty="Category"
          layout="Gallery"
          properties={productProperties}
        >
          <ViewNav />
        </NotionToolbar>

        <GalleryView
          cardPreview="productImage"
          cardSize="medium"
          fitMedia
          pagination="loadMore"
        />
      </DataViewProvider>
    </Suspense>
  );
}
