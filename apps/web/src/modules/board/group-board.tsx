"use client";

import { useInfinitePagination } from "@sparkyidea/dataview/hooks";
import { DataViewProvider } from "@sparkyidea/dataview/providers";
import { NotionToolbar } from "@sparkyidea/dataview/toolbars/notion";
import { getSearchableProperties } from "@sparkyidea/dataview/types";
import { BoardView } from "@sparkyidea/dataview/views/board-view";
import type { WhereNode } from "@sparkyidea/shared/types";
import type { Limit } from "@sparkyidea/shared/types/pagination.type";
import { useQuery } from "@tanstack/react-query";
import { productProperties } from "@/properties/product-properties";
import { buildSearchFilter } from "@/utils/search";
import { useTRPC } from "@/utils/trpc/client";

// Group configs (hardcoded for this demo)
const columnGroupConfig = { bySelect: { property: "category" } } as const;
const rowGroupConfig = {
  byStatus: { property: "availability", showAs: "option" },
} as const;

interface GroupBoardProps {
  filter: WhereNode[] | null;
  limit: Limit;
  search: string;
  sort: { property: string; direction: "asc" | "desc" }[];
}

/**
 * Grouped Board - columns by category with accordion rows.
 *
 * NotionToolbar uses context from DataViewProvider (never suspends).
 * BoardView may suspend while loading data.
 */
export function GroupBoard({ filter, limit, search, sort }: GroupBoardProps) {
  const trpc = useTRPC();
  const searchableFields = getSearchableProperties(productProperties);

  // Fetch column counts separately (board-specific)
  // This provides columnCounts for BoardView to build columns
  const columnCountsQuery = useQuery(
    trpc.product.getGroup.queryOptions({ groupBy: columnGroupConfig })
  );

  const { pagination } = useInfinitePagination({
    // Factory for accordion row counts - provides counts for collapsible sections
    groupQueryOptionsFactory: (groupConfig) =>
      trpc.product.getGroup.queryOptions({ groupBy: groupConfig }),

    // Factory for data items - fetches ALL columns in one query
    queryOptionsFactory: (params) =>
      trpc.product.getManyByColumn.infiniteQueryOptions(
        {
          columnBy: columnGroupConfig,
          limit: params.limit,
          filter: params.filter,
          sort: params.sort ?? [],
          search: buildSearchFilter(params.search, searchableFields),
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

  return (
    <DataViewProvider
      columnCounts={columnCountsQuery.data?.counts}
      defaults={{
        column: { ...columnGroupConfig, showCount: true },
        filter,
        group: { ...rowGroupConfig, showCount: true },
        limit,
        search,
        sort: sort ?? [],
      }}
      pagination={pagination}
      properties={productProperties}
    >
      <NotionToolbar
        columnProperty="Category"
        enableSettings
        groupProperty="Availability"
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
