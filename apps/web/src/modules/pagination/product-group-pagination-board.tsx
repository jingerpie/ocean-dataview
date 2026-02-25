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
import { limitServerParser } from "@sparkyidea/shared/utils/parsers/pagination";
import { parseAsSort } from "@sparkyidea/shared/utils/parsers/sort";
import { useQuery } from "@tanstack/react-query";
import { parseAsString, useQueryState } from "nuqs";
import { buildSearchFilter } from "@/utils/search";
import { useTRPC } from "@/utils/trpc/client";
import { productProperties } from "./product-properties";
import { ViewNav } from "./view-nav";

/**
 * BoardView with infinite load-more pagination (no sub-groups)
 *
 * Self-contained component that reads URL params directly via nuqs.
 * No server prefetch - uses client-side fetching with loading states.
 */
export function ProductGroupPaginationBoard() {
  const trpc = useTRPC();

  // Read URL params directly via nuqs
  const [filter] = useQueryState("filter", parseAsFilter);
  const [sort] = useQueryState("sort", parseAsSort);
  const [search] = useQueryState("search", parseAsString.withDefault(""));
  const [limit] = useQueryState("limit", limitServerParser);

  // Build search filter from raw search string
  const searchableFields = getSearchableProperties(productProperties);
  const searchFilter = buildSearchFilter(search, searchableFields);

  // Get group counts (for column headers)
  const { data: groupData, isLoading: isGroupLoading } = useQuery(
    trpc.product.getGroup.queryOptions({
      groupBy: { bySelect: { property: "category" } },
    })
  );

  // Use unified hook for pagination state (flat mode)
  const { data, pagination } = useInfinitePagination({
    limit,
    queryOptions: () =>
      trpc.product.getManyByGroup.infiniteQueryOptions(
        {
          groupBy: { bySelect: { property: "category" } },
          limit,
          filter,
          sort: sort ?? [],
          search: searchFilter,
        },
        {
          getNextPageParam: (lastPage) => {
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
  if ((pagination.isLoading || isGroupLoading) && data.length === 0) {
    return <BoardSkeleton columnCount={4} />;
  }

  // Empty state
  if (data.length === 0) {
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
      filter={filter}
      group={{ bySelect: { property: "category" }, showCount: true }}
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
