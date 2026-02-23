"use client";

import {
  usePagePagination,
  useSuspensePagePagination,
} from "@sparkyidea/dataview/hooks";
import { DataViewProvider } from "@sparkyidea/dataview/providers";
import { NotionToolbar } from "@sparkyidea/dataview/toolbars/notion";
import { getSearchableProperties } from "@sparkyidea/dataview/types";
import {
  TableSkeleton,
  TableView,
} from "@sparkyidea/dataview/views/table-view";
import type { GroupByConfigInput } from "@sparkyidea/shared/lib";
import type {
  Cursors,
  Limit,
  SortQuery,
  WhereNode,
} from "@sparkyidea/shared/types";
import {
  buildSearchFilter,
  combineGroupFilter,
  getGroupProperty,
} from "@sparkyidea/shared/utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { useTRPC } from "@/utils/trpc/client";
import { productProperties } from "./product-properties";
import { sampleRowActions } from "./sample-row-actions";
import { ViewNav } from "./view-nav";

/**
 * Props passed from server (with defaults already applied)
 */
interface PaginationProps {
  cursors: Cursors;
  /** Expanded group keys (for grouped mode) */
  expanded: string[];
  filter: WhereNode[] | null;
  /** Group configuration from URL */
  group: GroupByConfigInput | null;
  limit: Limit;
  /** Raw search string from URL (for UI display) */
  search: string;
  sorts: SortQuery[];
}

/**
 * Product Table with cursor-based pagination.
 *
 * Supports both flat and grouped modes:
 * - Flat mode: Single __all__ group (no grouping)
 * - Grouped mode: Data grouped by property with per-group pagination
 */
export function ProductPaginationTable(props: PaginationProps) {
  const {
    cursors,
    expanded,
    limit,
    filter,
    group,
    search: searchQuery,
    sorts,
  } = props;

  const groupProperty = getGroupProperty(group);

  if (group && groupProperty) {
    return (
      <GroupedTable
        cursors={cursors}
        expanded={expanded}
        filter={filter}
        group={group}
        groupProperty={groupProperty}
        limit={limit}
        searchQuery={searchQuery}
        sorts={sorts}
      />
    );
  }

  return (
    <FlatTable
      cursors={cursors}
      filter={filter}
      group={group}
      limit={limit}
      searchQuery={searchQuery}
      sorts={sorts}
    />
  );
}

/**
 * Flat mode table (no grouping)
 */
function FlatTable({
  cursors,
  filter,
  group,
  limit,
  searchQuery,
  sorts,
}: {
  cursors: Cursors;
  filter: WhereNode[] | null;
  group: GroupByConfigInput | null;
  limit: Limit;
  searchQuery: string;
  sorts: SortQuery[];
}) {
  const trpc = useTRPC();

  const searchableFields = getSearchableProperties(productProperties);
  const search = buildSearchFilter(searchQuery, searchableFields);

  const { data, pagination } = useSuspensePagePagination({
    limit,
    cursors,
    queryOptions: (_groupKey, cursor) =>
      trpc.product.getMany.queryOptions({
        cursor,
        limit,
        filter,
        search,
        sort: sorts,
      }),
  });

  return (
    <Suspense fallback={<TableSkeleton columnCount={5} rowCount={10} />}>
      <DataViewProvider
        data={data}
        filter={filter}
        group={group ?? undefined}
        pagination={pagination}
        properties={productProperties}
        search={searchQuery}
        sort={sorts}
      >
        <NotionToolbar enableSettings properties={productProperties}>
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

/**
 * Grouped mode table (with per-group pagination)
 */
function GroupedTable({
  cursors,
  expanded,
  filter,
  group,
  groupProperty,
  limit,
  searchQuery,
  sorts,
}: {
  cursors: Cursors;
  expanded: string[];
  filter: WhereNode[] | null;
  group: GroupByConfigInput;
  groupProperty: string;
  limit: Limit;
  searchQuery: string;
  sorts: SortQuery[];
}) {
  const trpc = useTRPC();

  const searchableFields = getSearchableProperties(productProperties);
  const search = buildSearchFilter(searchQuery, searchableFields);

  // Fetch group counts
  const { data: groupData } = useSuspenseQuery(
    trpc.product.getGroup.queryOptions({
      groupBy: group,
    })
  );

  // Get all group keys
  const allGroupKeys = Object.keys(groupData.counts);

  // Use page pagination with groupBy for per-group pagination
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
          filter: combineGroupFilter(groupProperty, groupKey, filter),
          search,
          sort: sorts,
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

  // Get property label for toolbar display
  const propertyMeta = productProperties.find((p) => p.id === groupProperty);
  const groupPropertyLabel = propertyMeta?.label ?? groupProperty;

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
          ...group,
          showCount: true,
        }}
        onExpandedGroupsChange={handleAccordionChange}
        pagination={pagination}
        properties={productProperties}
        search={searchQuery}
        sort={sorts}
      >
        <NotionToolbar
          enableSettings
          groupProperty={groupPropertyLabel}
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
