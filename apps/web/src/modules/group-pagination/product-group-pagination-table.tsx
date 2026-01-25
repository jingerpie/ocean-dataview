"use client";

import { NotionToolbar } from "@ocean-dataview/dataview/components/ui";
import {
  TableSkeleton,
  TableView,
} from "@ocean-dataview/dataview/components/views/table-view";
import { useGroupPagePagination } from "@ocean-dataview/dataview/hooks";
import { DataViewProvider } from "@ocean-dataview/dataview/lib/providers";
import type {
  Cursors,
  PropertySort,
  WhereNode,
} from "@ocean-dataview/shared/types";
import { combineGroupFilter } from "@ocean-dataview/shared/utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { useTRPC } from "@/utils/trpc/client";
import { GroupPaginationTabs } from "./group-pagination-tabs";
import { productProperties } from "./product-properties";

const DEFAULT_EXPANDED: string[] = [];

/**
 * Props passed from server (parsed URL params)
 */
interface Props {
  expanded: string[] | null;
  cursors: Cursors;
  limit: number;
  filter?: WhereNode | null;
  /** Search filter (converted from URL ?search=xxx by server page) */
  search?: WhereNode | null;
  sort?: PropertySort[];
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
  search: searchQuery = null,
  sort = [],
}: Props) {
  const trpc = useTRPC();

  // 1. Group counts (Suspense OK - matches server prefetch)
  const { data: groupCounts } = useSuspenseQuery(
    trpc.product.getGroup.queryOptions({ groupBy: "familyGroup" })
  );

  // 2. Apply default on client
  const expanded = expandedProp ?? DEFAULT_EXPANDED;

  // 3. Get all group keys (stable order)
  const allGroupKeys = Object.keys(groupCounts);

  // 4. Single hook call - creates queries internally using TRPC queryOptions
  // search is now a Filter (converted from URL param by server)
  const { data, pagination, handleAccordionChange } = useGroupPagePagination({
    allGroupKeys,
    expanded,
    cursors,
    groupCounts,
    limit,
    createQueryOptions: (groupKey, cursor) =>
      trpc.product.getMany.queryOptions({
        filter: combineGroupFilter("familyGroup", groupKey, filter),
        search: searchQuery,
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
        data={data}
        pagination={pagination}
        properties={productProperties}
      >
        <NotionToolbar properties={productProperties}>
          <GroupPaginationTabs />
        </NotionToolbar>

        <TableView
          layout={{ showVerticalLines: false, wrapAllColumns: false }}
          pagination="page"
          view={{
            group: {
              groupBy: "familyGroup",
              showAggregation: true,
              expandedGroups: expanded,
              onExpandedChange: handleAccordionChange,
            },
          }}
        />
      </DataViewProvider>
    </Suspense>
  );
}
