"use client";

import { useInfinitePagination } from "@sparkyidea/dataview/hooks";
import { NotionToolbar } from "@sparkyidea/dataview/toolbars/notion";
import type {
  GroupCounts,
  GroupSortValues,
  ViewCounts,
} from "@sparkyidea/dataview/types";
import { getSearchableProperties } from "@sparkyidea/dataview/types";
import {
  BoardSkeleton,
  BoardView,
} from "@sparkyidea/dataview/views/board-view";
import { parseAsFilter } from "@sparkyidea/shared/utils/parsers/filter";
import type { GroupConfigInput } from "@sparkyidea/shared/utils/parsers/group";
import { groupServerParser } from "@sparkyidea/shared/utils/parsers/group";
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
import { combineGroupFilter, getGroupProperty } from "@/utils/group-filter";
import { buildSearchFilter } from "@/utils/search";
import { useTRPC } from "@/utils/trpc/client";
import { ViewTabs } from "./view-tabs";

const sortMap = { asc: "ascending", desc: "descending" } as const;

/** Transform GroupConfigInput to view format with showCount */
function toViewConfig(config: GroupConfigInput | null) {
  if (!config) {
    return undefined;
  }
  return {
    ...config,
    showCount: true,
    sort: config.sort ? sortMap[config.sort] : undefined,
  };
}

/** Get property label from properties array */
function getPropertyLabel(propertyId: string | null) {
  if (!propertyId) {
    return "";
  }
  const meta = productProperties.find((p) => p.id === propertyId);
  return meta?.label ?? propertyId;
}

/** Custom hook for board URL params */
function useBoardParams() {
  const [filter] = useQueryState("filter", parseAsFilter);
  const [sort] = useQueryState("sort", parseAsSort);
  const [search] = useQueryState("search", parseAsString.withDefault(""));
  const [limit] = useQueryState("limit", limitServerParser);
  const [expanded] = useQueryState("expanded", parseAsExpanded.withDefault([]));
  const [group] = useQueryState("group", groupServerParser);
  const [subGroup] = useQueryState("subGroup", groupServerParser);

  const groupProperty = getGroupProperty(group);
  const subGroupProperty = getGroupProperty(subGroup);
  const isGrouped = Boolean(group && groupProperty);
  const isSubGrouped = Boolean(subGroup && subGroupProperty);

  return {
    filter,
    sort,
    search,
    limit,
    expanded,
    group,
    subGroup,
    groupProperty,
    subGroupProperty,
    isGrouped,
    isSubGrouped,
  };
}

/** Empty state component */
function EmptyState() {
  return (
    <div className="flex min-h-100 items-center justify-center">
      <p className="text-muted-foreground">No products found</p>
    </div>
  );
}

/** Board content component */
function BoardContent({
  isEmpty,
  isGrouped,
  groupPropertyLabel,
  subGroupPropertyLabel,
}: {
  groupPropertyLabel: string | undefined;
  isGrouped: boolean;
  isEmpty: boolean;
  subGroupPropertyLabel: string | undefined;
}) {
  return (
    <>
      <NotionToolbar
        enableSettings
        enableSubGroup
        groupProperty={groupPropertyLabel}
        properties={productProperties}
        subGroupProperty={subGroupPropertyLabel}
      >
        <ViewTabs />
      </NotionToolbar>

      {isEmpty && !isGrouped ? (
        <EmptyState />
      ) : (
        <BoardView
          cardPreview="productImage"
          cardSize="medium"
          colorColumns
          fitMedia
          pagination="loadMore"
        />
      )}
    </>
  );
}

/** Build counts object for DataViewProvider */
function buildCounts(
  isSubGrouped: boolean,
  groupData: { counts?: GroupCounts; sortValues?: GroupSortValues } | undefined,
  subGroupData:
    | { counts?: GroupCounts; sortValues?: GroupSortValues }
    | undefined
): ViewCounts | undefined {
  if (!isSubGrouped) {
    return undefined;
  }
  return {
    group: groupData?.counts ?? {},
    groupSortValues: groupData?.sortValues ?? {},
    subGroup: subGroupData?.counts ?? {},
    subGroupSortValues: subGroupData?.sortValues ?? {},
  };
}

/**
 * Hybrid Board - auto flat/grouped based on URL group param.
 *
 * Board grouping model:
 * - group = columns (primary grouping)
 * - subGroup = rows (secondary grouping, board-specific)
 */
export function HybridBoard() {
  const trpc = useTRPC();
  const params = useBoardParams();
  const { filter, sort, search, limit, expanded, group, subGroup } = params;
  const { groupProperty, subGroupProperty, isSubGrouped } = params;

  const searchableFields = getSearchableProperties(productProperties);
  const searchFilter = buildSearchFilter(search, searchableFields);

  // Default group config for boards (always need columns)
  const defaultGroupConfig = { bySelect: { property: "category" } } as const;
  const effectiveGroupConfig = group ?? defaultGroupConfig;

  // Fetch group counts (always fetch for boards - they always need columns)
  const { data: groupData, isLoading: isGroupLoading } = useQuery(
    trpc.product.getGroup.queryOptions({
      groupBy: effectiveGroupConfig,
    })
  );

  // Fetch subGroup counts (only when sub-grouped)
  const { data: subGroupData, isLoading: isSubGroupLoading } = useQuery({
    ...trpc.product.getGroup.queryOptions({
      groupBy: subGroup ?? { bySelect: { property: "category" } },
    }),
    enabled: isSubGrouped,
  });

  // Column keys from group counts (boards always need columns)
  const columnKeys = useMemo(
    () => Object.keys(groupData?.counts ?? {}),
    [groupData?.counts]
  );

  // SubGroup keys from subGroup counts (for sub-grouped boards)
  const subGroupKeys = useMemo(
    () => Object.keys(subGroupData?.counts ?? {}),
    [subGroupData?.counts]
  );

  // Compute default expanded (expand all columns when using default group)
  const defaultExpanded = expanded.length > 0 ? expanded : columnKeys;

  const { DataViewProvider, isEmpty } = useInfinitePagination<Product>({
    groupKeys: columnKeys,
    groupCounts: groupData?.counts,
    groupSortValues: groupData?.sortValues,
    defaultLimit: limit,
    defaultExpanded,
    queryOptionsFactory: (groupKey) =>
      trpc.product.getMany.infiniteQueryOptions(
        {
          filter: combineGroupFilter(effectiveGroupConfig, groupKey, filter),
          search: searchFilter,
          sort: sort ?? [],
          limit,
        },
        {
          getNextPageParam: (lastPage) =>
            lastPage.hasNextPage ? lastPage.endCursor : undefined,
        }
      ),
  });

  // Prepare view configs and labels (always use effective group config for boards)
  const groupConfigForView = toViewConfig(effectiveGroupConfig);
  const subGroupConfigForView = toViewConfig(subGroup);
  const effectiveGroupProperty = groupProperty ?? "category";
  const groupPropertyLabel = getPropertyLabel(effectiveGroupProperty);
  const subGroupPropertyLabel = isSubGrouped
    ? getPropertyLabel(subGroupProperty)
    : undefined;
  const counts = buildCounts(isSubGrouped, groupData, subGroupData);

  // Loading states - show skeleton only while fetching group structure
  // Once we have columnKeys/subGroupKeys, let each group handle its own loading
  const showLoadingSkeleton =
    (isGroupLoading && columnKeys.length === 0) ||
    (isSubGrouped && isSubGroupLoading && subGroupKeys.length === 0);
  const showEmpty = columnKeys.length === 0 && !showLoadingSkeleton;

  // DataViewProvider MUST always render for queries to execute
  return (
    <DataViewProvider
      counts={counts}
      filter={filter}
      group={groupConfigForView}
      properties={productProperties}
      search={search}
      sort={sort ?? []}
      subGroup={subGroupConfigForView}
    >
      {showLoadingSkeleton && <BoardSkeleton columnCount={4} />}
      {showEmpty && <EmptyState />}
      {!(showLoadingSkeleton || showEmpty) && (
        <BoardContent
          groupPropertyLabel={groupPropertyLabel}
          isEmpty={isEmpty}
          isGrouped={true}
          subGroupPropertyLabel={subGroupPropertyLabel}
        />
      )}
    </DataViewProvider>
  );
}
