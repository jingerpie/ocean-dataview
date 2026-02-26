"use client";

import { useInfinitePagination } from "@sparkyidea/dataview/hooks";
import { NotionToolbar } from "@sparkyidea/dataview/toolbars/notion";
import { getSearchableProperties } from "@sparkyidea/dataview/types";
import {
  BoardSkeleton,
  BoardView,
} from "@sparkyidea/dataview/views/board-view";
import { parseAsFilter } from "@sparkyidea/shared/utils/parsers/filter";
import {
  limitServerParser,
  parseAsExpanded,
} from "@sparkyidea/shared/utils/parsers/pagination";
import { parseAsSort } from "@sparkyidea/shared/utils/parsers/sort";
import { useQuery } from "@tanstack/react-query";
import { parseAsString, useQueryState } from "nuqs";
import { useMemo } from "react";
import {
  type Product,
  productProperties,
} from "@/properties/product-properties";
import { combineGroupFilter } from "@/utils/group-filter";
import { buildSearchFilter } from "@/utils/search";
import { useTRPC } from "@/utils/trpc/client";
import { ViewTabs } from "./view-tabs";

// Group configs (hardcoded for this demo)
const columnGroupConfig = { bySelect: { property: "category" } } as const;
const rowGroupConfig = {
  byStatus: { property: "availability", showAs: "option" },
} as const;

/**
 * Grouped Board - columns by category, rows by availability (sub-groups).
 *
 * Board grouping model:
 * - group (columns) = flat, uses getManyByGroup to get all columns in one query
 * - subGroup (rows) = like group in other views, one getManyByGroup per row
 */
export function GroupBoard() {
  const trpc = useTRPC();

  const [filter] = useQueryState("filter", parseAsFilter);
  const [sort] = useQueryState("sort", parseAsSort);
  const [search] = useQueryState("search", parseAsString.withDefault(""));
  const [limit] = useQueryState("limit", limitServerParser);
  const [expanded] = useQueryState("expanded", parseAsExpanded.withDefault([]));

  const searchableFields = getSearchableProperties(productProperties);
  const searchFilter = buildSearchFilter(search, searchableFields);

  // Group counts (columns - category)
  const { data: groupData, isLoading: isGroupLoading } = useQuery(
    trpc.product.getGroup.queryOptions({ groupBy: columnGroupConfig })
  );

  // Sub-group counts (rows - availability)
  const { data: subGroupData, isLoading: isSubGroupLoading } = useQuery(
    trpc.product.getGroup.queryOptions({ groupBy: rowGroupConfig })
  );

  // Row keys from subGroup counts
  const rowKeys = useMemo(
    () => Object.keys(subGroupData?.counts ?? {}),
    [subGroupData?.counts]
  );

  // One getManyByGroup query per subGroup row
  const { DataViewProvider, isPlaceholderData } =
    useInfinitePagination<Product>({
      groupKeys: rowKeys,
      groupCounts: subGroupData?.counts,
      groupSortValues: subGroupData?.sortValues,
      defaultLimit: limit,
      defaultExpanded: expanded.length > 0 ? expanded : [],
      queryOptionsFactory: (limitParam, subGroupKey) =>
        trpc.product.getManyByGroup.infiniteQueryOptions(
          {
            groupBy: columnGroupConfig,
            filter: combineGroupFilter(
              rowGroupConfig,
              subGroupKey ?? "",
              filter
            ),
            search: searchFilter,
            sort: sort ?? [],
            limit: limitParam ?? limit,
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

  // Loading states - show skeleton only while fetching group structure
  // Once we have rowKeys (subgroup structure), let each group handle its own loading
  const showSkeleton =
    isGroupLoading || (isSubGroupLoading && rowKeys.length === 0);
  const showEmpty = rowKeys.length === 0 && !showSkeleton;

  // Render content based on state
  const renderContent = () => {
    if (showSkeleton) {
      return <BoardSkeleton columnCount={4} />;
    }
    if (showEmpty) {
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
          enableSubGroup
          groupProperty="Category"
          properties={productProperties}
          subGroupProperty="Availability"
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
  };

  // DataViewProvider MUST always render for queries to execute
  return (
    <DataViewProvider
      counts={{
        group: groupData?.counts ?? {},
        groupSortValues: groupData?.sortValues ?? {},
        subGroup: subGroupData?.counts ?? {},
        subGroupSortValues: subGroupData?.sortValues ?? {},
      }}
      filter={filter}
      group={{ ...columnGroupConfig, showCount: true }}
      properties={productProperties}
      search={search}
      sort={sort ?? []}
      subGroup={rowGroupConfig}
    >
      {renderContent()}
    </DataViewProvider>
  );
}
