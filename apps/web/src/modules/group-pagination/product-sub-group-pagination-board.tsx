"use client";

import { useGroupPagePagination } from "@sparkyidea/dataview/hooks";
import { DataViewProvider } from "@sparkyidea/dataview/providers";
import { NotionToolbar } from "@sparkyidea/dataview/toolbars/notion";
import {
  BoardSkeleton,
  BoardView,
} from "@sparkyidea/dataview/views/board-view";
import type { Cursors, SortQuery, WhereNode } from "@sparkyidea/shared/types";
import { combineGroupFilter } from "@sparkyidea/shared/utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { useTRPC } from "@/utils/trpc/client";
import { GroupPaginationTabs } from "./group-pagination-tabs";
import { productProperties } from "./product-properties";

/**
 * Props passed from server (parsed URL params)
 */
interface Props {
  cursors: Cursors;
  limit: number;
  filter?: WhereNode[] | null;
  /** Search filter (converted from URL ?search=xxx by server page) */
  search?: WhereNode | null;
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
  search: searchQuery = null,
  sort = [],
}: Props) {
  const trpc = useTRPC();

  // 1. Fetch group counts (suspends until data is ready)
  const { data: groupCounts } = useSuspenseQuery(
    trpc.product.getGroup.queryOptions({ groupBy: "category" })
  );

  // 2. Get all group keys - all columns are always visible in BoardView
  const allGroupKeys = Object.keys(groupCounts);

  // 3. Single hook call - creates queries internally using TRPC queryOptions
  // search is now a Filter (converted from URL param by server)
  const { data, pagination } = useGroupPagePagination({
    allGroupKeys,
    expanded: allGroupKeys, // All columns visible
    cursors,
    groupCounts,
    limit,
    createQueryOptions: (groupKey, cursor) =>
      trpc.product.getMany.queryOptions({
        filter: combineGroupFilter("category", groupKey, filter),
        search: searchQuery,
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
        pagination={pagination}
        properties={productProperties}
      >
        <NotionToolbar properties={productProperties}>
          <GroupPaginationTabs />
        </NotionToolbar>

        <BoardView
          counts={groupCounts}
          layout={{
            cardPreview: "productImage",
            cardSize: "medium",
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
