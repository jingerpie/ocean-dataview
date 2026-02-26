"use client";

import { usePagePagination } from "@sparkyidea/dataview/hooks";
import { NotionToolbar } from "@sparkyidea/dataview/toolbars/notion";
import { getSearchableProperties } from "@sparkyidea/dataview/types";
import {
  TableSkeleton,
  TableView,
} from "@sparkyidea/dataview/views/table-view";
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
import { bulkActions } from "./bulk-actions";
import { ViewTabs } from "./view-tabs";

/**
 * Grouped Table - grouped by category with per-group pagination.
 *
 * Uses usePagePagination hook that returns a DataViewProvider
 * with pagination baked in.
 */
export function GroupTable() {
  const trpc = useTRPC();

  // URL params
  const [filter] = useQueryState("filter", parseAsFilter);
  const [sort] = useQueryState("sort", parseAsSort);
  const [search] = useQueryState("search", parseAsString.withDefault(""));
  const [limit] = useQueryState("limit", limitServerParser);
  const [expanded] = useQueryState("expanded", parseAsExpanded.withDefault([]));

  const searchableFields = getSearchableProperties(productProperties);
  const searchFilter = buildSearchFilter(search, searchableFields);

  // Fetch group counts
  const { data: groupData, isLoading: isGroupLoading } = useQuery(
    trpc.product.getGroup.queryOptions({
      groupBy: { bySelect: { property: "category" } },
    })
  );

  const groupKeys = useMemo(
    () => Object.keys(groupData?.counts ?? {}),
    [groupData?.counts]
  );

  const { DataViewProvider, isPlaceholderData, isLoading, isEmpty } =
    usePagePagination<Product>({
      groupKeys,
      groupCounts: groupData?.counts,
      groupSortValues: groupData?.sortValues,
      defaultLimit: limit,
      defaultExpanded: expanded,
      queryOptionsFactory: (groupKey, cursor) =>
        trpc.product.getMany.queryOptions({
          cursor,
          filter: combineGroupFilter("category", groupKey, filter),
          limit,
          search: searchFilter,
          sort: sort ?? [],
        }),
    });

  // Show skeleton while fetching group counts (before we know the groups)
  if (isGroupLoading && groupKeys.length === 0) {
    return <TableSkeleton columnCount={5} rowCount={10} />;
  }

  // Empty state - no groups found
  if (groupKeys.length === 0) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <p className="text-muted-foreground">No products found</p>
      </div>
    );
  }

  // DataViewProvider MUST render for queries to execute
  return (
    <DataViewProvider
      filter={filter}
      group={{ bySelect: { property: "category" }, showCount: true }}
      properties={productProperties}
      search={search}
      sort={sort ?? undefined}
    >
      {isLoading && isEmpty ? (
        <TableSkeleton columnCount={5} rowCount={10} />
      ) : (
        <>
          <NotionToolbar
            enableSettings
            groupProperty="Category"
            properties={productProperties}
          >
            <ViewTabs />
          </NotionToolbar>

          <div style={{ opacity: isPlaceholderData ? 0.7 : 1 }}>
            <TableView
              bulkActions={bulkActions}
              pagination="page"
              showVerticalLines={false}
              wrapAllColumns={false}
            />
          </div>
        </>
      )}
    </DataViewProvider>
  );
}
