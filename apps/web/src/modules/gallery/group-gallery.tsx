"use client";

import { useInfinitePagination } from "@sparkyidea/dataview/hooks";
import { NotionToolbar } from "@sparkyidea/dataview/toolbars/notion";
import { getSearchableProperties } from "@sparkyidea/dataview/types";
import {
  GallerySkeleton,
  GalleryView,
} from "@sparkyidea/dataview/views/gallery-view";
import { parseAsFilter } from "@sparkyidea/shared/utils/parsers/filter";
import {
  limitServerParser,
  parseAsExpanded,
} from "@sparkyidea/shared/utils/parsers/pagination";
import { parseAsSort } from "@sparkyidea/shared/utils/parsers/sort";
import { useQuery } from "@tanstack/react-query";
import { parseAsString, useQueryState } from "nuqs";
import { useMemo } from "react";
import {
  type Product,
  productProperties,
} from "@/properties/product-properties";
import { combineGroupFilter } from "@/utils/group-filter";
import { buildSearchFilter } from "@/utils/search";
import { useTRPC } from "@/utils/trpc/client";
import { ViewTabs } from "./view-tabs";

/**
 * Grouped Gallery - grouped by category with per-group load more.
 *
 * Uses useInfinitePagination hook that returns a DataViewProvider
 * with pagination baked in.
 */
export function GroupGallery() {
  const trpc = useTRPC();

  const [filter] = useQueryState("filter", parseAsFilter);
  const [sort] = useQueryState("sort", parseAsSort);
  const [search] = useQueryState("search", parseAsString.withDefault(""));
  const [limit] = useQueryState("limit", limitServerParser);
  const [expanded] = useQueryState("expanded", parseAsExpanded.withDefault([]));

  const searchableFields = getSearchableProperties(productProperties);
  const searchFilter = buildSearchFilter(search, searchableFields);

  // Group config
  const groupConfig = { bySelect: { property: "category" } } as const;

  // Fetch group counts
  const { data: groupData, isLoading: isGroupLoading } = useQuery(
    trpc.product.getGroup.queryOptions({ groupBy: groupConfig })
  );

  const groupKeys = useMemo(
    () => Object.keys(groupData?.counts ?? {}),
    [groupData?.counts]
  );

  const { DataViewProvider, isPlaceholderData } =
    useInfinitePagination<Product>({
      groupKeys,
      groupCounts: groupData?.counts,
      groupSortValues: groupData?.sortValues,
      defaultLimit: limit,
      defaultExpanded: expanded.length > 0 ? expanded : [],
      queryOptionsFactory: (groupKey) =>
        trpc.product.getMany.infiniteQueryOptions(
          {
            filter: combineGroupFilter(groupConfig, groupKey, filter),
            search: searchFilter,
            sort: sort ?? [],
            limit,
          },
          {
            getNextPageParam: (lastPage) =>
              lastPage.hasNextPage ? lastPage.endCursor : undefined,
          }
        ),
    });

  // Show skeleton while fetching group counts
  if (isGroupLoading && groupKeys.length === 0) {
    return <GallerySkeleton cardCount={6} />;
  }

  // Empty state
  if (groupKeys.length === 0) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <p className="text-muted-foreground">No products found</p>
      </div>
    );
  }

  // DataViewProvider MUST render for queries to execute
  return (
    <DataViewProvider
      filter={filter}
      group={{
        bySelect: { property: "category" },
        showCount: true,
      }}
      properties={productProperties}
      search={search}
      sort={sort ?? []}
    >
      <NotionToolbar
        enableSettings
        groupProperty="Category"
        properties={productProperties}
      >
        <ViewTabs />
      </NotionToolbar>
      <div style={{ opacity: isPlaceholderData ? 0.7 : 1 }}>
        <GalleryView
          cardPreview="productImage"
          cardSize="medium"
          fitMedia
          pagination="loadMore"
        />
      </div>
    </DataViewProvider>
  );
}
