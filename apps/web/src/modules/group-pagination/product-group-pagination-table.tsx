"use client";

import { useGroupPagePagination } from "@sparkyidea/dataview/hooks";
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
import { ViewNav } from "./view-nav";

const DEFAULT_EXPANDED: string[] = [];

/**
 * Props passed from server (parsed URL params)
 */
interface Props {
  expanded: string[] | null;
  cursors: Cursors;
  limit: Limit;
  filter?: WhereNode[] | null;
  /** Raw search string from URL (for UI display) */
  search?: string;
  sort?: SortQuery[];
}

/**
 * Product Group Table with cursor-based pagination.
 *
 * Pattern: Server prefetch → Props → Client uses props for query
 * - Server parses URL, prefetches group counts, passes props
 * - Client uses useSuspenseQuery for group counts (matches server prefetch)
 * - Client uses useQueries with enabled flag for group data
 * - useGroupPagePagination builds data + pagination + handleAccordionChange
 */
export function ProductGroupPaginationTable({
  expanded: expandedProp,
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

  // 2. Apply default on client
  const expanded = expandedProp ?? DEFAULT_EXPANDED;

  // 3. Get all group keys (stable order)
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
    <Suspense fallback={<TableSkeleton columnCount={5} rowCount={10} />}>
      <DataViewProvider
        counts={{ group: groupCounts }}
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

        <TableView
          layout={{ showVerticalLines: false, wrapAllColumns: false }}
          pagination="page"
          view={{
            group: {
              groupBy: "category",
              showAggregation: true,
              expandedGroups,
              onExpandedChange: handleAccordionChange,
            },
          }}
        />
      </DataViewProvider>
    </Suspense>
  );
}
