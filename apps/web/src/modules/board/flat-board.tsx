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

const columnConfig = { bySelect: { property: "category" } } as const;

interface FlatBoardProps {
  filter: WhereNode[] | null;
  limit: Limit;
  search: string;
  sort: { property: string; direction: "asc" | "desc" }[];
}

/**
 * Flat Board - columns by category, infinite load-more pagination.
 *
 * NotionToolbar uses context from DataViewProvider (never suspends).
 * BoardView may suspend while loading data.
 */
export function FlatBoard({ filter, sort, search, limit }: FlatBoardProps) {
  const trpc = useTRPC();
  const searchableFields = getSearchableProperties(productProperties);

  // Fetch column counts separately (board-specific)
  // This provides columnCounts for BoardView to build columns
  const columnCountsQuery = useQuery(
    trpc.product.getGroup.queryOptions({ groupBy: columnConfig })
  );

  // Flat board: single query for all columns (no row grouping)
  // No groupQueryOptionsFactory - flat board has no accordion grouping
  const { pagination } = useInfinitePagination({
    // Factory for data items
    queryOptionsFactory: (params) =>
      trpc.product.getManyByColumn.infiniteQueryOptions(
        {
          columnBy: params.groupConfig ?? columnConfig,
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
        filter,
        column: { ...columnConfig, showCount: true },
        limit,
        search,
        sort: sort ?? [],
      }}
      pagination={pagination}
      properties={productProperties}
    >
      <NotionToolbar columnProperty="Category" enableSettings />
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
