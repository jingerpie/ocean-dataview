"use client";

import { usePagePagination } from "@sparkyidea/dataview/hooks";
import { DataViewProvider } from "@sparkyidea/dataview/providers";
import { NotionToolbar } from "@sparkyidea/dataview/toolbars/notion";
import { getSearchableProperties } from "@sparkyidea/dataview/types";
import {
  TableSkeleton,
  TableView,
} from "@sparkyidea/dataview/views/table-view";
import { parseAsFilter } from "@sparkyidea/shared/utils/parsers/filter";
import {
  limitServerParser,
  parseAsCursors,
  parseAsExpanded,
} from "@sparkyidea/shared/utils/parsers/pagination";
import { parseAsSort } from "@sparkyidea/shared/utils/parsers/sort";
import { useQuery } from "@tanstack/react-query";
import { parseAsString, useQueryState } from "nuqs";
import { combineGroupFilter } from "@/utils/group-filter";
import { buildSearchFilter } from "@/utils/search";
import { useTRPC } from "@/utils/trpc/client";
import { productProperties } from "./product-properties";
import { sampleRowActions } from "./sample-row-actions";
import { ViewNav } from "./view-nav";

/**
 * Product Group Table with cursor-based pagination.
 *
 * Self-contained component that reads URL params directly via nuqs.
 * No server prefetch - uses client-side fetching with loading states.
 */
export function ProductGroupPaginationTable() {
  const trpc = useTRPC();

  // Read URL params directly via nuqs
  const [filter] = useQueryState("filter", parseAsFilter);
  const [sort] = useQueryState("sort", parseAsSort);
  const [search] = useQueryState("search", parseAsString.withDefault(""));
  const [limit] = useQueryState("limit", limitServerParser);
  const [cursors] = useQueryState("cursors", parseAsCursors.withDefault({}));
  const [expanded] = useQueryState("expanded", parseAsExpanded.withDefault([]));

  // Build search filter from raw search string
  const searchableFields = getSearchableProperties(productProperties);
  const searchFilter = buildSearchFilter(search, searchableFields);

  // Group counts (for accordion headers)
  const { data: groupData, isLoading: isGroupLoading } = useQuery(
    trpc.product.getGroup.queryOptions({
      groupBy: { bySelect: { property: "category" } },
    })
  );

  // Get all group keys (stable order)
  const allGroupKeys = Object.keys(groupData?.counts ?? {});

  // Use unified page pagination with groupBy for per-group prev/next
  const { data, pagination, handleAccordionChange, expandedGroups } =
    usePagePagination({
      limit,
      cursors,
      groupBy: {
        allGroupKeys,
        expanded,
      },
      queryOptions: (groupKey, cursor) =>
        trpc.product.getMany.queryOptions({
          filter: combineGroupFilter("category", groupKey, filter),
          search: searchFilter,
          sort: sort ?? [],
          cursor,
          limit,
        }),
    });

  // Show skeleton on initial load
  if ((pagination.isLoading || isGroupLoading) && data.length === 0) {
    return <TableSkeleton columnCount={5} rowCount={10} />;
  }

  // Empty state
  if (pagination.groups.length === 0) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <p className="text-muted-foreground">No products found</p>
      </div>
    );
  }

  return (
    <DataViewProvider
      counts={{
        group: groupData?.counts ?? {},
        groupSortValues: groupData?.sortValues ?? {},
      }}
      data={data}
      expandedGroups={expandedGroups}
      filter={filter}
      group={{
        bySelect: { property: "category" },
        showCount: true,
      }}
      onExpandedGroupsChange={handleAccordionChange}
      pagination={pagination}
      properties={productProperties}
      search={search}
      sort={sort ?? []}
    >
      <NotionToolbar
        enableSettings
        groupProperty="Category"
        properties={productProperties}
      >
        <ViewNav />
      </NotionToolbar>

      <TableView
        bulkActions={sampleRowActions}
        pagination="page"
        showVerticalLines={false}
        wrapAllColumns={false}
      />
    </DataViewProvider>
  );
}
