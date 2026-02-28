"use client";

import {
  useInfinitePagination,
  usePaginationState,
} from "@sparkyidea/dataview/hooks";
import { DataViewProvider } from "@sparkyidea/dataview/providers";
import { NotionToolbar } from "@sparkyidea/dataview/toolbars/notion";
import { getSearchableProperties } from "@sparkyidea/dataview/types";
import {
  BoardSkeleton,
  BoardView,
} from "@sparkyidea/dataview/views/board-view";
import type { WhereNode } from "@sparkyidea/shared/types";
import type { Limit } from "@sparkyidea/shared/types/pagination.type";
import { productProperties } from "@/properties/product-properties";
import { buildSearchFilter } from "@/utils/search";
import { useTRPC } from "@/utils/trpc/client";
import { ViewTabs } from "./view-tabs";

const groupConfig = { bySelect: { property: "category" } } as const;

interface FlatBoardProps {
  filter: WhereNode[] | null;
  limit: Limit;
  search: string;
  sort: { property: string; direction: "asc" | "desc" }[];
}

/**
 * Flat Board - columns by category, infinite load-more pagination.
 *
 * Uses getManyByGroup to fetch all columns in a single query.
 * BoardView automatically groups items into columns using the group config.
 * No subGroup (rows) - flat display.
 */
export function FlatBoard({ filter, sort, search, limit }: FlatBoardProps) {
  const trpc = useTRPC();

  const searchableFields = getSearchableProperties(productProperties);

  // Flat board: single query for all columns (no subGroup rows)
  // getManyByGroup returns flat items, BoardView groups them into columns automatically
  const { pagination } = useInfinitePagination({
    // Factory for group counts - used internally by QueryBridge
    groupQueryOptionsFactory: (groupCfg) =>
      trpc.product.getGroup.queryOptions({ groupBy: groupCfg }),

    // Factory for data items
    queryOptionsFactory: (params) =>
      trpc.product.getManyByGroup.infiniteQueryOptions(
        {
          groupBy: params.groupConfig ?? groupConfig,
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

  // DataViewProvider MUST always render for queries to execute
  return (
    <DataViewProvider
      defaults={{
        filter,
        group: { ...groupConfig, showCount: true },
        limit,
        search,
        sort: sort ?? [],
      }}
      pagination={pagination}
      properties={productProperties}
    >
      <FlatBoardContent />
    </DataViewProvider>
  );
}

function FlatBoardContent() {
  const { isEmpty, isLoading, isPlaceholderData } = usePaginationState();

  if (isLoading && isEmpty) {
    return <BoardSkeleton columnCount={4} />;
  }

  if (isEmpty) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <p className="text-muted-foreground">No products found</p>
      </div>
    );
  }

  return (
    <>
      <NotionToolbar
        enableSettings
        groupProperty="Category"
        properties={productProperties}
      >
        <ViewTabs />
      </NotionToolbar>
      <div style={{ opacity: isPlaceholderData ? 0.7 : 1 }}>
        <BoardView
          cardPreview="productImage"
          cardSize="medium"
          colorColumns
          fitMedia
          pagination="loadMore"
        />
      </div>
    </>
  );
}
