"use client";

import { useGroupInfinitePagination } from "@sparkyidea/dataview/hooks";
import { DataViewProvider } from "@sparkyidea/dataview/providers";
import { NotionToolbar } from "@sparkyidea/dataview/toolbars/notion";
import {
  GallerySkeleton,
  GalleryView,
} from "@sparkyidea/dataview/views/gallery-view";
import type { SortQuery, WhereNode } from "@sparkyidea/shared/types";
import { combineGroupFilter } from "@sparkyidea/shared/utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { useTRPC } from "@/utils/trpc/client";
import { GroupPaginationTabs } from "./group-pagination-tabs";
import { productProperties } from "./product-properties";

const DEFAULT_EXPANDED: string[] = [];

/**
 * Props passed from server (parsed URL params)
 */
interface Props {
  expanded: string[] | null;
  cursors: unknown; // Not used for infinite pagination, but passed from page
  limit: number;
  filter?: WhereNode[] | null;
  /** Search filter (converted from URL ?search=xxx by server page) */
  search?: WhereNode | null;
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
  search: searchQuery = null,
  sort = [],
}: Props) {
  const trpc = useTRPC();

  // 1. Group counts (Suspense OK - matches server prefetch)
  const { data: groupCounts } = useSuspenseQuery(
    trpc.product.getGroup.queryOptions({ groupBy: "category" })
  );

  // 2. Apply default on client
  const expanded = expandedProp ?? DEFAULT_EXPANDED;

  // 3. Get all group keys
  const allGroupKeys = Object.keys(groupCounts);

  // 4. Single hook call - creates queries internally using TRPC infiniteQueryOptions
  // search is now a Filter (converted from URL param by server)
  const { data, pagination, handleAccordionChange } =
    useGroupInfinitePagination({
      allGroupKeys,
      expanded,
      groupCounts,
      limit,
      createQueryOptions: (groupKey) =>
        trpc.product.getMany.infiniteQueryOptions(
          {
            filter: combineGroupFilter("category", groupKey, filter),
            search: searchQuery,
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
        data={data}
        pagination={pagination}
        properties={productProperties}
      >
        <NotionToolbar properties={productProperties}>
          <GroupPaginationTabs />
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
              expandedGroups: expanded,
              onExpandedChange: handleAccordionChange,
            },
          }}
        />
      </DataViewProvider>
    </Suspense>
  );
}
