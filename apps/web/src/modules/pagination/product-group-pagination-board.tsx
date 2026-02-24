"use client";

import { useInfinitePagination } from "@sparkyidea/dataview/hooks";
import { DataViewProvider } from "@sparkyidea/dataview/providers";
import { NotionToolbar } from "@sparkyidea/dataview/toolbars/notion";
import { getSearchableProperties } from "@sparkyidea/dataview/types";
import {
  BoardSkeleton,
  BoardView,
} from "@sparkyidea/dataview/views/board-view";
import type { Limit, SortQuery, WhereNode } from "@sparkyidea/shared/types";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { buildSearchFilter } from "@/utils/search";
import { useTRPC } from "@/utils/trpc/client";
import { productProperties } from "./product-properties";
import { ViewNav } from "./view-nav";

interface Props {
  filter?: WhereNode[] | null;
  limit: Limit;
  /** Raw search string from URL (for UI display) */
  search?: string;
  sort?: SortQuery[];
}

/**
 * BoardView with infinite load-more pagination (no sub-groups)
 *
 * Uses getManyByGroup for single-request loading of all columns.
 * Groups (columns) are client-side - data is flat like getMany.
 * Single Load More triggers all columns at once.
 */
export function ProductGroupPaginationBoard({
  limit,
  filter = null,
  search: searchQuery = "",
  sort = [],
}: Props) {
  const trpc = useTRPC();

  // Build search filter from raw search string
  const searchableFields = getSearchableProperties(productProperties);
  const search = buildSearchFilter(searchQuery, searchableFields);

  // Get group counts (for column headers)
  const { data: groupData } = useSuspenseQuery(
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
          sort,
          search,
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

  // Empty state
  if (data.length === 0) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <p className="text-muted-foreground">No products found</p>
      </div>
    );
  }

  return (
    <Suspense fallback={<BoardSkeleton columnCount={4} />}>
      <DataViewProvider
        counts={{
          group: groupData.counts,
          groupSortValues: groupData.sortValues,
        }}
        data={data}
        filter={filter}
        group={{ bySelect: { property: "category" }, showCount: true }}
        pagination={pagination}
        properties={productProperties}
        search={searchQuery}
        sort={sort}
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
    </Suspense>
  );
}
