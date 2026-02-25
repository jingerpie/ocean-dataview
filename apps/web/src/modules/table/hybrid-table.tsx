"use client";

import { usePagePagination } from "@sparkyidea/dataview/hooks";
import { DataViewProvider } from "@sparkyidea/dataview/providers";
import { NotionToolbar } from "@sparkyidea/dataview/toolbars/notion";
import { getSearchableProperties } from "@sparkyidea/dataview/types";
import {
  TableSkeleton,
  TableView,
} from "@sparkyidea/dataview/views/table-view";
import type { Cursors, Limit, WhereNode } from "@sparkyidea/shared/types";
import { parseAsFilter } from "@sparkyidea/shared/utils/parsers/filter";
import {
  type GroupConfigInput,
  groupServerParser,
} from "@sparkyidea/shared/utils/parsers/group";
import {
  limitServerParser,
  parseAsCursors,
  parseAsExpanded,
} from "@sparkyidea/shared/utils/parsers/pagination";
import { parseAsSort } from "@sparkyidea/shared/utils/parsers/sort";
import { useQuery } from "@tanstack/react-query";
import { parseAsString, useQueryState } from "nuqs";
import { productProperties } from "@/properties/product-properties";
import { combineGroupFilter, getGroupProperty } from "@/utils/group-filter";
import { buildSearchFilter } from "@/utils/search";
import { useTRPC } from "@/utils/trpc/client";
import { bulkActions } from "./bulk-actions";
import { ViewTabs } from "./view-tabs";

/**
 * Hybrid Table - auto flat/grouped based on URL group param.
 *
 * Self-contained component that reads URL params directly via nuqs.
 * When ?group= is set, shows grouped mode with per-group pagination.
 * Otherwise shows flat mode.
 */
export function HybridTable() {
  // Read URL params directly via nuqs
  const [filter] = useQueryState("filter", parseAsFilter);
  const [sort] = useQueryState("sort", parseAsSort);
  const [search] = useQueryState("search", parseAsString.withDefault(""));
  const [limit] = useQueryState("limit", limitServerParser);
  const [cursors] = useQueryState("cursors", parseAsCursors.withDefault({}));
  const [expanded] = useQueryState("expanded", parseAsExpanded.withDefault([]));
  const [group] = useQueryState("group", groupServerParser);

  const groupProperty = getGroupProperty(group);

  if (group && groupProperty) {
    return (
      <GroupedMode
        cursors={cursors}
        expanded={expanded}
        filter={filter}
        group={group}
        groupProperty={groupProperty}
        limit={limit}
        search={search}
        sort={sort ?? []}
      />
    );
  }

  return (
    <FlatMode
      cursors={cursors}
      filter={filter}
      limit={limit}
      search={search}
      sort={sort ?? []}
    />
  );
}

/**
 * Flat mode (no grouping)
 */
function FlatMode({
  cursors,
  filter,
  limit,
  search,
  sort,
}: {
  cursors: Cursors;
  filter: WhereNode[] | null;
  limit: Limit;
  search: string;
  sort: { property: string; direction: "asc" | "desc" }[];
}) {
  const trpc = useTRPC();

  const searchableFields = getSearchableProperties(productProperties);
  const searchFilter = buildSearchFilter(search, searchableFields);

  const { data, pagination } = usePagePagination({
    limit,
    cursors,
    queryOptions: (_groupKey, cursor) =>
      trpc.product.getMany.queryOptions({
        cursor,
        limit,
        filter,
        search: searchFilter,
        sort,
      }),
  });

  // Show skeleton on initial load
  if (pagination.isLoading && data.length === 0) {
    return <TableSkeleton columnCount={5} rowCount={10} />;
  }

  return (
    <DataViewProvider
      data={data}
      filter={filter}
      pagination={pagination}
      properties={productProperties}
      search={search}
      sort={sort}
    >
      <NotionToolbar enableSettings properties={productProperties}>
        <ViewTabs />
      </NotionToolbar>
      <TableView
        bulkActions={bulkActions}
        pagination="page"
        showVerticalLines={false}
        wrapAllColumns={false}
      />
    </DataViewProvider>
  );
}

/**
 * Grouped mode (with per-group pagination)
 */
function GroupedMode({
  cursors,
  expanded,
  filter,
  group,
  groupProperty,
  limit,
  search,
  sort,
}: {
  cursors: Cursors;
  expanded: string[];
  filter: WhereNode[] | null;
  group: GroupConfigInput;
  groupProperty: string;
  limit: Limit;
  search: string;
  sort: { property: string; direction: "asc" | "desc" }[];
}) {
  const trpc = useTRPC();

  const searchableFields = getSearchableProperties(productProperties);
  const searchFilter = buildSearchFilter(search, searchableFields);

  // Fetch group counts
  const { data: groupData, isLoading: isGroupLoading } = useQuery(
    trpc.product.getGroup.queryOptions({
      groupBy: group,
    })
  );

  // Get all group keys
  const allGroupKeys = Object.keys(groupData?.counts ?? {});

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
          search: searchFilter,
          sort,
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

  // Get property label for toolbar display
  const propertyMeta = productProperties.find((p) => p.id === groupProperty);
  const groupPropertyLabel = propertyMeta?.label ?? groupProperty;

  // Transform sort option from URL format to DataView format
  const sortMap = { asc: "ascending", desc: "descending" } as const;
  const groupConfig = {
    ...group,
    showCount: true,
    sort: group.sort ? sortMap[group.sort] : undefined,
  } as const;

  return (
    <DataViewProvider
      counts={{
        group: groupData?.counts ?? {},
        groupSortValues: groupData?.sortValues ?? {},
      }}
      data={data}
      expandedGroups={expandedGroups}
      filter={filter}
      group={groupConfig}
      onExpandedGroupsChange={handleAccordionChange}
      pagination={pagination}
      properties={productProperties}
      search={search}
      sort={sort}
    >
      <NotionToolbar
        enableSettings
        groupProperty={groupPropertyLabel}
        properties={productProperties}
      >
        <ViewTabs />
      </NotionToolbar>
      <TableView
        bulkActions={bulkActions}
        pagination="page"
        showVerticalLines={false}
        wrapAllColumns={false}
      />
    </DataViewProvider>
  );
}
