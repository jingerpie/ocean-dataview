"use client";

import { useInfinitePagination } from "@sparkyidea/dataview/hooks";
import { DataViewProvider } from "@sparkyidea/dataview/providers";
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
import { productProperties } from "@/properties/product-properties";
import { combineGroupFilter } from "@/utils/group-filter";
import { buildSearchFilter } from "@/utils/search";
import { useTRPC } from "@/utils/trpc/client";
import { ViewTabs } from "./view-tabs";

/**
 * Grouped Gallery - grouped by category with per-group load more.
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

  const { data: groupData, isLoading: isGroupLoading } = useQuery(
    trpc.product.getGroup.queryOptions({
      groupBy: { bySelect: { property: "category" } },
    })
  );

  const allGroupKeys = Object.keys(groupData?.counts ?? {});

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

  if ((pagination.isLoading || isGroupLoading) && data.length === 0) {
    return <GallerySkeleton cardCount={6} />;
  }

  if (pagination.groups.length === 0) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <p className="text-muted-foreground">No products found</p>
      </div>
    );
  }

  return (
    <DataViewProvider
      counts={{
        group: groupData?.counts ?? {},
        groupSortValues: groupData?.sortValues ?? {},
      }}
      data={data}
      expandedGroups={expandedGroups}
      filter={filter}
      group={{
        bySelect: { property: "category" },
        showCount: true,
      }}
      onExpandedGroupsChange={handleAccordionChange}
      pagination={pagination}
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
      <GalleryView
        cardPreview="productImage"
        cardSize="medium"
        fitMedia
        pagination="loadMore"
      />
    </DataViewProvider>
  );
}
