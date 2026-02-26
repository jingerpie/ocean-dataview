"use client";

import { useInfinitePagination } from "@sparkyidea/dataview/hooks";
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
import {
  type Product,
  productProperties,
} from "@/properties/product-properties";
import { buildSearchFilter } from "@/utils/search";
import { useTRPC } from "@/utils/trpc/client";
import { ViewTabs } from "./view-tabs";

const groupConfig = { bySelect: { property: "category" } } as const;

/**
 * Flat Board - columns by category, infinite load-more pagination.
 *
 * Uses getManyByGroup to fetch all columns in a single query.
 * No subGroup (rows) - flat display.
 */
export function FlatBoard() {
  const trpc = useTRPC();

  const [filter] = useQueryState("filter", parseAsFilter);
  const [sort] = useQueryState("sort", parseAsSort);
  const [search] = useQueryState("search", parseAsString.withDefault(""));
  const [limit] = useQueryState("limit", limitServerParser);

  const searchableFields = getSearchableProperties(productProperties);
  const searchFilter = buildSearchFilter(search, searchableFields);

  // Fetch group counts for column headers
  const { data: groupData, isLoading: isGroupLoading } = useQuery(
    trpc.product.getGroup.queryOptions({ groupBy: groupConfig })
  );

  // Column keys from group counts
  const columnKeys = Object.keys(groupData?.counts ?? {});

  // Flat board: single query for all columns (no subGroup rows)
  // getManyByGroup returns flat items, client-side groups into columns
  const { DataViewProvider, isLoading, isEmpty, isPlaceholderData } =
    useInfinitePagination<Product>({
      groupKeys: columnKeys,
      groupCounts: groupData?.counts,
      groupSortValues: groupData?.sortValues,
      defaultLimit: limit,
      defaultExpanded: columnKeys, // Expand all columns for flat board
      clientSideGroupBy: "category", // Group flat items by category property
      queryOptionsFactory: (_groupKey, limitParam) =>
        trpc.product.getManyByGroup.infiniteQueryOptions(
          {
            groupBy: groupConfig,
            limit: limitParam ?? limit,
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

  const showLoadingSkeleton = (isLoading || isGroupLoading) && isEmpty;
  const showEmptyState = !showLoadingSkeleton && isEmpty;

  // DataViewProvider MUST always render for queries to execute
  return (
    <DataViewProvider
      filter={filter}
      group={{ ...groupConfig, showCount: true }}
      properties={productProperties}
      search={search}
      sort={sort ?? []}
    >
      {showLoadingSkeleton && <BoardSkeleton columnCount={4} />}
      {showEmptyState && (
        <div className="flex min-h-100 items-center justify-center">
          <p className="text-muted-foreground">No products found</p>
        </div>
      )}
      {!(showLoadingSkeleton || showEmptyState) && (
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
      )}
    </DataViewProvider>
  );
}
