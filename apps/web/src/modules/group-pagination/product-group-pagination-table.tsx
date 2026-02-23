"use client";

import { usePagePagination } from "@sparkyidea/dataview/hooks";
import { DataViewProvider } from "@sparkyidea/dataview/providers";
import { NotionToolbar } from "@sparkyidea/dataview/toolbars/notion";
import { getSearchableProperties } from "@sparkyidea/dataview/types";
import {
  TableSkeleton,
  TableView,
} from "@sparkyidea/dataview/views/table-view";
import type {
  Cursors,
  Limit,
  SortQuery,
  WhereNode,
} from "@sparkyidea/shared/types";
import {
  buildSearchFilter,
  combineGroupFilter,
} from "@sparkyidea/shared/utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { useTRPC } from "@/utils/trpc/client";
import { productProperties } from "./product-properties";
import { sampleRowActions } from "./sample-row-actions";
import { ViewNav } from "./view-nav";

/**
 * Props passed from server (parsed URL params)
 */
interface Props {
  cursors: Cursors;
  expanded: string[];
  filter?: WhereNode[] | null;
  limit: Limit;
  /** Raw search string from URL (for UI display) */
  search?: string;
  sort?: SortQuery[];
}

/**
 * Product Group Table with cursor-based pagination.
 *
 * Pattern: Uses usePagePagination with groupBy for per-group pagination
 */
export function ProductGroupPaginationTable({
  expanded,
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

  // 1. Group counts (Suspense OK - matches server prefetch)
  const { data: groupData } = useSuspenseQuery(
    trpc.product.getGroup.queryOptions({
      groupBy: { bySelect: { property: "category" } },
    })
  );

  // 2. Get all group keys (stable order)
  const allGroupKeys = Object.keys(groupData.counts);

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
    <Suspense fallback={<TableSkeleton columnCount={5} rowCount={10} />}>
      <DataViewProvider
        counts={{
          group: groupData.counts,
          groupSortValues: groupData.sortValues,
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
        search={searchQuery}
        sort={sort}
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
    </Suspense>
  );
}
