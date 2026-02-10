"use client";

import { useGroupPagePagination } from "@sparkyidea/dataview/hooks";
import { DataViewProvider } from "@sparkyidea/dataview/providers";
import { NotionToolbar } from "@sparkyidea/dataview/toolbars/notion";
import { getSearchableProperties } from "@sparkyidea/dataview/types";
import {
  BoardSkeleton,
  BoardView,
} from "@sparkyidea/dataview/views/board-view";
import type { Cursors, SortQuery, WhereNode } from "@sparkyidea/shared/types";
import {
  buildSearchFilter,
  combineGroupFilter,
} from "@sparkyidea/shared/utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { useTRPC } from "@/utils/trpc/client";
import { productProperties } from "./product-properties";
import { ViewNav } from "./view-nav";

/**
 * Props passed from server (parsed URL params)
 */
interface Props {
  cursors: Cursors;
  limit: number;
  filter?: WhereNode[] | null;
  /** Raw search string from URL (for UI display) */
  search?: string;
  sort?: SortQuery[];
}

/**
 * BoardView with server-side pagination
 *
 * Unlike Table/List/Gallery, BoardView columns are always visible (no accordion).
 * All group keys are always "expanded" so all columns fetch data.
 */
export function ProductSubGroupPaginationBoard({
  cursors,
  limit,
  filter = null,
  search: searchQuery = "",
  sort = [],
}: Props) {
  const trpc = useTRPC();

  // Build search filter from raw search string
  const searchableFields = getSearchableProperties(productProperties);
  const search = buildSearchFilter(searchQuery, searchableFields);

  // 1. Fetch group counts (suspends until data is ready)
  const { data: groupCounts } = useSuspenseQuery(
    trpc.product.getGroup.queryOptions({ groupBy: "category" })
  );

  // 2. Get all group keys - all columns are always visible in BoardView
  const allGroupKeys = Object.keys(groupCounts);

  // 3. Single hook call - creates queries internally using TRPC queryOptions
  const { data, pagination } = useGroupPagePagination({
    allGroupKeys,
    expanded: allGroupKeys, // All columns visible
    cursors,
    groupCounts,
    limit,
    createQueryOptions: (groupKey, cursor) =>
      trpc.product.getMany.queryOptions({
        filter: combineGroupFilter("category", groupKey, filter),
        search,
        sort,
        cursor,
        limit,
      }),
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
          <ViewNav />
        </NotionToolbar>

        <BoardView
          counts={groupCounts}
          layout={{
            cardPreview: "productImage",
            cardSize: "medium",
            fitMedia: true,
            colorColumns: true,
          }}
          pagination="page"
          view={{
            group: { groupBy: "category", showAggregation: true },
            subGroup: { subGroupBy: "availability" },
          }}
        />
      </DataViewProvider>
    </Suspense>
  );
}
