"use client";

import { useInfinitePagination } from "@sparkyidea/dataview/hooks";
import { DataViewProvider } from "@sparkyidea/dataview/providers";
import { NotionToolbar } from "@sparkyidea/dataview/toolbars/notion";
import { getSearchableProperties } from "@sparkyidea/dataview/types";
import {
  BoardSkeleton,
  BoardView,
} from "@sparkyidea/dataview/views/board-view";
import { parseAsFilter } from "@sparkyidea/shared/utils/parsers/filter";
import {
  limitServerParser,
  parseAsExpanded,
} from "@sparkyidea/shared/utils/parsers/pagination";
import { parseAsSort } from "@sparkyidea/shared/utils/parsers/sort";
import { useQuery } from "@tanstack/react-query";
import { parseAsString, useQueryState } from "nuqs";
import { combineGroupFilter } from "@/utils/group-filter";
import { buildSearchFilter } from "@/utils/search";
import { useTRPC } from "@/utils/trpc/client";
import { productProperties } from "./product-properties";
import { ViewNav } from "./view-nav";

/**
 * BoardView with sub-groups and infinite load-more pagination.
 *
 * Self-contained component that reads URL params directly via nuqs.
 * No server prefetch - uses client-side fetching with loading states.
 */
export function ProductSubGroupPaginationBoard() {
  const trpc = useTRPC();

  // Read URL params directly via nuqs
  const [filter] = useQueryState("filter", parseAsFilter);
  const [sort] = useQueryState("sort", parseAsSort);
  const [search] = useQueryState("search", parseAsString.withDefault(""));
  const [limit] = useQueryState("limit", limitServerParser);
  const [expanded] = useQueryState("expanded", parseAsExpanded.withDefault([]));

  // Build search filter from raw search string
  const searchableFields = getSearchableProperties(productProperties);
  const searchFilter = buildSearchFilter(search, searchableFields);

  // Get group counts (for column headers - category)
  const { data: groupData, isLoading: isGroupLoading } = useQuery(
    trpc.product.getGroup.queryOptions({
      groupBy: { bySelect: { property: "category" } },
    })
  );

  // Get sub-group counts (for row headers - availability)
  // These are the actual pagination groups
  const { data: subGroupData, isLoading: isSubGroupLoading } = useQuery(
    trpc.product.getGroup.queryOptions({
      groupBy: { bySelect: { property: "availability" } },
    })
  );

  // Get all sub-group keys (rows) - these are the pagination groups
  const allSubGroupKeys = Object.keys(subGroupData?.counts ?? {});

  // Use unified infinite pagination with groupBy for per-sub-group load more
  const { data, pagination, handleAccordionChange, expandedGroups } =
    useInfinitePagination({
      limit,
      groupBy: {
        allGroupKeys: allSubGroupKeys,
        expanded,
      },
      queryOptions: (subGroupKey) =>
        trpc.product.getManyByGroup.infiniteQueryOptions(
          {
            groupBy: { bySelect: { property: "category" } },
            filter: combineGroupFilter("availability", subGroupKey, filter),
            search: searchFilter,
            sort: sort ?? [],
            limit,
          },
          {
            getNextPageParam: (lastPage) => {
              // Check if any category has more items
              const hasAnyMore = Object.values(lastPage.hasNextPage).some(
                Boolean
              );
              if (!hasAnyMore) {
                return undefined;
              }
              // Pass ALL groups with cursors (or null for exhausted/empty groups)
              // Server will skip groups with null cursor
              return Object.fromEntries(
                Object.entries(lastPage.endCursor).map(([key, cursor]) => [
                  key,
                  cursor,
                ])
              );
            },
          }
        ),
    });

  // Show skeleton on initial load
  if (
    (pagination.isLoading || isGroupLoading || isSubGroupLoading) &&
    data.length === 0
  ) {
    return <BoardSkeleton columnCount={4} />;
  }

  // Empty state
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
        subGroup: subGroupData?.counts ?? {},
        subGroupSortValues: subGroupData?.sortValues ?? {},
      }}
      data={data}
      expandedGroups={expandedGroups}
      filter={filter}
      group={{ bySelect: { property: "category" }, showCount: true }}
      onExpandedGroupsChange={handleAccordionChange}
      pagination={pagination}
      properties={productProperties}
      search={search}
      sort={sort ?? []}
      subGroup={{ bySelect: { property: "availability" } }}
    >
      <NotionToolbar
        enableSettings
        groupProperty="Category"
        properties={productProperties}
      >
        <ViewNav />
      </NotionToolbar>

      <BoardView
        cardPreview="productImage"
        cardSize="medium"
        colorColumns
        fitMedia
        pagination="loadMore"
      />
    </DataViewProvider>
  );
}
