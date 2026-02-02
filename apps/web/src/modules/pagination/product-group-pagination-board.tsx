"use client";

import { NotionToolbar } from "@ocean-dataview/dataview/components/ui/notion-toolbar";
import {
  BoardSkeleton,
  BoardView,
} from "@ocean-dataview/dataview/components/views/board-view";
import { useGroupInfinitePagination } from "@ocean-dataview/dataview/hooks";
import { DataViewProvider } from "@ocean-dataview/dataview/lib/providers";
import { getSearchableProperties } from "@ocean-dataview/dataview/types";
import type { SortQuery, WhereNode } from "@ocean-dataview/shared/types";
import {
  buildSearchFilter,
  combineGroupFilter,
} from "@ocean-dataview/shared/utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { useTRPC } from "@/utils/trpc/client";
import { GroupPaginationTabs } from "../group-pagination/group-pagination-tabs";
import { productProperties } from "../group-pagination/product-properties";

interface Props {
  limit: number;
  filter?: WhereNode[] | null;
  /** Raw search string from URL (for UI display) */
  search?: string;
  sort?: SortQuery[];
}

/**
 * BoardView with infinite load-more pagination
 *
 * Unlike Table/List/Gallery, BoardView columns are always visible (no accordion).
 * All group keys are always "expanded" so all columns fetch data.
 * Props are passed to DataViewProvider defaults.
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

  // 1. Fetch group counts
  const { data: groupCounts } = useSuspenseQuery(
    trpc.product.getGroup.queryOptions({ groupBy: "category" })
  );

  // 2. Get all group keys
  const allGroupKeys = Object.keys(groupCounts);

  // 3. Single hook call using TRPC infiniteQueryOptions - all groups "expanded" for board
  const { data, pagination } = useGroupInfinitePagination({
    allGroupKeys,
    expanded: allGroupKeys, // All columns visible
    groupCounts,
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

  return (
    <Suspense fallback={<BoardSkeleton columnCount={4} />}>
      <DataViewProvider
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
          <GroupPaginationTabs />
        </NotionToolbar>

        {pagination.groups.length === 0 ? (
          <div className="flex min-h-100 items-center justify-center">
            <p className="text-muted-foreground">No products found</p>
          </div>
        ) : (
          <BoardView
            counts={groupCounts}
            layout={{
              cardPreview: "productImage",
              cardSize: "medium",
            }}
            pagination="loadMore"
            view={{
              group: { groupBy: "category", showAggregation: true },
            }}
          />
        )}
      </DataViewProvider>
    </Suspense>
  );
}
