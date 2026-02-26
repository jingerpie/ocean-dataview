"use client";

import { usePagePagination } from "@sparkyidea/dataview/hooks";
import { NotionToolbar } from "@sparkyidea/dataview/toolbars/notion";
import { getSearchableProperties } from "@sparkyidea/dataview/types";
import {
  TableSkeleton,
  TableView,
} from "@sparkyidea/dataview/views/table-view";
import { parseAsFilter } from "@sparkyidea/shared/utils/parsers/filter";
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
import { bulkActions } from "./bulk-actions";
import { ViewTabs } from "./view-tabs";

/**
 * Hybrid Table - auto flat/grouped based on URL group param.
 *
 * Uses usePagePagination hook that returns a DataViewProvider
 * with pagination baked in.
 */
export function HybridTable() {
  const trpc = useTRPC();

  // URL params
  const [filter] = useQueryState("filter", parseAsFilter);
  const [sort] = useQueryState("sort", parseAsSort);
  const [search] = useQueryState("search", parseAsString.withDefault(""));
  const [limit] = useQueryState("limit", limitServerParser);
  const [expanded] = useQueryState("expanded", parseAsExpanded.withDefault([]));
  const [group] = useQueryState("group", groupServerParser);

  const groupProperty = getGroupProperty(group);
  const isGrouped = Boolean(group && groupProperty);

  const searchableFields = getSearchableProperties(productProperties);
  const searchFilter = buildSearchFilter(search, searchableFields);

  // Fetch group counts (only when grouped)
  const { data: groupData, isLoading: isGroupLoading } = useQuery({
    ...trpc.product.getGroup.queryOptions({
      groupBy: group ?? { bySelect: { property: "category" } },
    }),
    enabled: isGrouped,
  });

  // Group keys: flat uses default ['__all__'], grouped uses keys from server
  const groupKeys = useMemo(() => {
    if (!isGrouped) {
      return undefined; // Use default ['__all__']
    }
    return Object.keys(groupData?.counts ?? {});
  }, [isGrouped, groupData?.counts]);

  // Transform GroupConfigInput to GroupConfig format (only when grouped)
  const sortMap = { asc: "ascending", desc: "descending" } as const;
  const groupConfigForView = useMemo(() => {
    if (!group) {
      return undefined;
    }
    return {
      ...group,
      showCount: true,
      sort: group.sort ? sortMap[group.sort] : undefined,
    };
  }, [group]);

  // Get property label for toolbar display
  const propertyMeta = productProperties.find((p) => p.id === groupProperty);
  const groupPropertyLabel = propertyMeta?.label ?? groupProperty ?? "";

  const { DataViewProvider, isPlaceholderData, isLoading, isEmpty } =
    usePagePagination<Product>({
      groupKeys,
      groupCounts: isGrouped ? groupData?.counts : undefined,
      groupSortValues: isGrouped ? groupData?.sortValues : undefined,
      defaultLimit: limit,
      defaultExpanded:
        isGrouped && expanded.length > 0 ? expanded : groupKeys.slice(0, 1),
      queryOptionsFactory: (cursor, limitParam, groupKey) =>
        trpc.product.getMany.queryOptions({
          cursor,
          filter:
            isGrouped && group && groupKey
              ? combineGroupFilter(group, groupKey, filter)
              : filter,
          limit: limitParam ?? limit,
          search: searchFilter,
          sort: sort ?? [],
        }),
    });

  // Show skeleton while fetching group counts (grouped mode only)
  if (isGrouped && isGroupLoading && groupKeys.length === 0) {
    return <TableSkeleton columnCount={5} rowCount={10} />;
  }

  // Empty state for grouped mode with no groups
  if (isGrouped && groupKeys.length === 0) {
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
      group={groupConfigForView}
      properties={productProperties}
      search={search}
      sort={sort ?? undefined}
    >
      {isLoading && isEmpty && !isGrouped ? (
        <TableSkeleton columnCount={5} rowCount={10} />
      ) : (
        <>
          <NotionToolbar
            enableSettings
            groupProperty={isGrouped ? groupPropertyLabel : undefined}
            properties={productProperties}
          >
            <ViewTabs />
          </NotionToolbar>

          <div style={{ opacity: isPlaceholderData ? 0.7 : 1 }}>
            {isEmpty ? (
              <div className="flex min-h-100 items-center justify-center">
                <p className="text-muted-foreground">No products found</p>
              </div>
            ) : (
              <TableView
                bulkActions={bulkActions}
                pagination="page"
                showVerticalLines={false}
                wrapAllColumns={false}
              />
            )}
          </div>
        </>
      )}
    </DataViewProvider>
  );
}
