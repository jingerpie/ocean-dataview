"use client";

import { useGroupPagePagination } from "@sparkyidea/dataview/hooks";
import { DataViewProvider } from "@sparkyidea/dataview/providers";
import { NotionToolbar } from "@sparkyidea/dataview/toolbars/notion";
import { getSearchableProperties } from "@sparkyidea/dataview/types";
import { ListSkeleton, ListView } from "@sparkyidea/dataview/views/list-view";
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
 * Product Group List with cursor-based pagination.
 *
 * Pattern: Server prefetch → Props → Client uses props for query
 */
export function ProductGroupPaginationList({
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
  const { data: groupCounts } = useSuspenseQuery(
    trpc.product.getGroup.queryOptions({ groupBy: "category" })
  );

  // 2. Get all group keys (stable order)
  const allGroupKeys = Object.keys(groupCounts);

  // 4. Single hook call - creates queries internally using TRPC queryOptions
  // expandedGroups from hook provides local state for optimistic UI (no bouncing)
  const { data, pagination, handleAccordionChange, expandedGroups } =
    useGroupPagePagination({
      allGroupKeys,
      expanded,
      cursors,
      limit,
      createQueryOptions: (groupKey, cursor) =>
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
    <Suspense fallback={<ListSkeleton rowCount={8} />}>
      <DataViewProvider
        counts={{ group: groupCounts }}
        data={data}
        filter={filter}
        group={{
          groupBy: "category",
          showAggregation: true,
          expandedGroups,
          onExpandedChange: handleAccordionChange,
        }}
        pagination={pagination}
        properties={productProperties}
        search={searchQuery}
        sort={sort}
      >
        <NotionToolbar properties={productProperties}>
          <ViewNav />
        </NotionToolbar>

        <ListView pagination="page" />
      </DataViewProvider>
    </Suspense>
  );
}
