"use client";

import { useGroupInfinitePagination } from "@sparkyidea/dataview/hooks";
import { DataViewProvider } from "@sparkyidea/dataview/providers";
import { NotionToolbar } from "@sparkyidea/dataview/toolbars/notion";
import { getSearchableProperties } from "@sparkyidea/dataview/types";
import {
  BoardSkeleton,
  BoardView,
} from "@sparkyidea/dataview/views/board-view";
import type { Limit, SortQuery, WhereNode } from "@sparkyidea/shared/types";
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
  expanded: string[];
  limit: Limit;
  filter?: WhereNode[] | null;
  /** Raw search string from URL (for UI display) */
  search?: string;
  sort?: SortQuery[];
}

/**
 * BoardView with sub-groups and infinite load-more pagination.
 *
 * Sub-groups (availability rows) are the actual pagination groups.
 * Each sub-group row has its own "Load More" button.
 * Columns (category) use getManyByGroup to ensure items are distributed across all columns.
 */
export function ProductSubGroupPaginationBoard({
  expanded,
  limit,
  filter = null,
  search: searchQuery = "",
  sort = [],
}: Props) {
  const trpc = useTRPC();

  // Build search filter from raw search string
  const searchableFields = getSearchableProperties(productProperties);
  const search = buildSearchFilter(searchQuery, searchableFields);

  // Get group counts (for column headers - category)
  const { data: groupCounts } = useSuspenseQuery(
    trpc.product.getGroup.queryOptions({ groupBy: "category" })
  );

  // Get sub-group counts (for row headers - availability)
  // These are the actual pagination groups
  const { data: subGroupCounts } = useSuspenseQuery(
    trpc.product.getGroup.queryOptions({ groupBy: "availability" })
  );

  // Get all sub-group keys (rows) - these are the pagination groups
  const allSubGroupKeys = Object.keys(subGroupCounts);

  // Use grouped infinite pagination - creates separate queries per sub-group (row)
  // Each sub-group row has its own Load More
  // Uses getManyByGroup with groupBy: "category" to ensure items are distributed across columns
  const { data, pagination, handleAccordionChange, expandedGroups } =
    useGroupInfinitePagination({
      allGroupKeys: allSubGroupKeys,
      expanded,
      limit,
      createQueryOptions: (subGroupKey) =>
        trpc.product.getManyByGroup.infiniteQueryOptions(
          {
            groupBy: "category",
            filter: combineGroupFilter("availability", subGroupKey, filter),
            search,
            sort,
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
              // Return cursor map for categories that have more (Relay pattern)
              return Object.fromEntries(
                Object.entries(lastPage.hasNextPage)
                  .filter(
                    ([key, hasMore]) => hasMore && lastPage.endCursor[key]
                  )
                  .map(([key]) => [key, lastPage.endCursor[key] as string])
              );
            },
          }
        ),
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
        counts={{ group: groupCounts, subGroup: subGroupCounts }}
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
          layout={{
            cardPreview: "productImage",
            cardSize: "medium",
            fitMedia: true,
            colorColumns: true,
          }}
          pagination="loadMore"
          view={{
            group: { groupBy: "category", showAggregation: true },
            subGroup: {
              subGroupBy: "availability",
              expandedSubGroups: expandedGroups,
              onExpandedSubGroupsChange: handleAccordionChange,
            },
          }}
        />
      </DataViewProvider>
    </Suspense>
  );
}
