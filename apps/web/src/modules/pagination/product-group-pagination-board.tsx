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
import { buildSearchFilter } from "@sparkyidea/shared/utils";
import {
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Suspense } from "react";
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

  // Infinite query - fetches all groups in one request (flat like getMany)
  // Groups (columns) are handled client-side
  const infiniteQuery = useSuspenseInfiniteQuery(
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
          const hasAnyMore = Object.values(lastPage.hasNextPage).some(Boolean);
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
    )
  );

  // Use shared hook for pagination state
  const { items, pagination } = useInfinitePagination({
    infiniteQuery,
    limit,
  });

  // Empty state
  if (items.length === 0) {
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
        data={items}
        filter={filter}
        group={{ bySelect: { property: "category" }, showCount: true }}
        pagination={pagination}
        properties={productProperties}
        search={searchQuery}
        sort={sort}
      >
        <NotionToolbar properties={productProperties}>
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
