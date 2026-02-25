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
import { productProperties } from "@/properties/product-properties";
import { combineGroupFilter } from "@/utils/group-filter";
import { buildSearchFilter } from "@/utils/search";
import { useTRPC } from "@/utils/trpc/client";

/**
 * Grouped Board - columns by category, rows by availability (sub-groups).
 */
export function GroupBoard() {
  const trpc = useTRPC();

  const [filter] = useQueryState("filter", parseAsFilter);
  const [sort] = useQueryState("sort", parseAsSort);
  const [search] = useQueryState("search", parseAsString.withDefault(""));
  const [limit] = useQueryState("limit", limitServerParser);
  const [expanded] = useQueryState("expanded", parseAsExpanded.withDefault([]));

  const searchableFields = getSearchableProperties(productProperties);
  const searchFilter = buildSearchFilter(search, searchableFields);

  // Group counts (columns - category)
  const { data: groupData, isLoading: isGroupLoading } = useQuery(
    trpc.product.getGroup.queryOptions({
      groupBy: { bySelect: { property: "category" } },
    })
  );

  // Sub-group counts (rows - availability)
  const { data: subGroupData, isLoading: isSubGroupLoading } = useQuery(
    trpc.product.getGroup.queryOptions({
      groupBy: { bySelect: { property: "availability" } },
    })
  );

  const allSubGroupKeys = Object.keys(subGroupData?.counts ?? {});

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
              const hasAnyMore = Object.values(lastPage.hasNextPage).some(
                Boolean
              );
              if (!hasAnyMore) {
                return undefined;
              }
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

  if (
    (pagination.isLoading || isGroupLoading || isSubGroupLoading) &&
    data.length === 0
  ) {
    return <BoardSkeleton columnCount={4} />;
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
      />
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
