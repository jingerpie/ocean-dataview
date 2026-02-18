"use client";

import { useGroupInfinitePagination } from "@sparkyidea/dataview/hooks";
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

const DEFAULT_EXPANDED: string[] = [];

/**
 * Props passed from server (parsed URL params)
 */
interface Props {
  expanded: string[] | null;
  limit: Limit;
  filter?: WhereNode[] | null;
  /** Raw search string from URL (for UI display) */
  search?: string;
  sort?: SortQuery[];
}

/**
 * Product Group Gallery with infinite load-more pagination per group.
 *
 * Pattern: Uses useGroupInfinitePagination for per-group data accumulation
 * - Each group has its own "Load More" button
 * - Data accumulates client-side per group
 */
export function ProductGroupPaginationGallery({
  expanded: expandedProp,
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
  const { data: groupCounts } = useSuspenseQuery(
    trpc.product.getGroup.queryOptions({ groupBy: "category" })
  );

  // 2. Apply default on client
  const expanded = expandedProp ?? DEFAULT_EXPANDED;

  // 3. Get all group keys
  const allGroupKeys = Object.keys(groupCounts);

  // 4. Single hook call - creates queries internally using TRPC infiniteQueryOptions
  // expandedGroups from hook provides local state for optimistic UI (no bouncing)
  const { data, pagination, handleAccordionChange, expandedGroups } =
    useGroupInfinitePagination({
      allGroupKeys,
      expanded,
      limit,
      createQueryOptions: (groupKey) =>
        trpc.product.getMany.infiniteQueryOptions(
          {
            filter: combineGroupFilter("category", groupKey, filter),
            search,
            sort,
            limit,
          },
          {
            getNextPageParam: (lastPage) => lastPage.endCursor ?? undefined,
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
        counts={{ group: groupCounts }}
        data={data}
        defaults={{
          filter,
          sort,
          search: searchQuery,
        }}
        pagination={pagination}
        properties={productProperties}
      >
        <NotionToolbar properties={productProperties}>
          <ViewNav />
        </NotionToolbar>

        <GalleryView
          layout={{
            cardPreview: "productImage",
            cardSize: "medium",
            fitMedia: true,
          }}
          pagination="loadMore"
          view={{
            group: {
              groupBy: "category",
              showAggregation: true,
              expandedGroups,
              onExpandedChange: handleAccordionChange,
            },
          }}
        />
      </DataViewProvider>
    </Suspense>
  );
}
