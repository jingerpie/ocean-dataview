"use client";

import { useInfinitePagination } from "@sparkyidea/dataview/hooks";
import { DataViewProvider } from "@sparkyidea/dataview/providers";
import { getSearchableProperties } from "@sparkyidea/dataview/types";
import {
  TableSkeleton,
  TableView,
} from "@sparkyidea/dataview/views/table-view";
import { parseAsExpanded } from "@sparkyidea/shared/lib";
import type { Limit, SortQuery, WhereNode } from "@sparkyidea/shared/types";
import { buildSearchFilter } from "@sparkyidea/shared/utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import { Suspense, useMemo } from "react";
import { useTRPC } from "@/utils/trpc/client";
import { GroupSelector, useGroupConfig } from "./group-selector";
import { productProperties } from "./product-properties";

interface ProductGroupByTableProps {
  filter?: WhereNode[] | null;
  limit: Limit;
  search?: string;
  sort?: SortQuery[];
}

/**
 * Product Table with grouping and load more pagination.
 *
 * Tests all byXXX group config types:
 * - bySelect, byStatus, byDate, byCheckbox, byMultiSelect, byText, byNumber
 */
export function ProductGroupByTable({
  limit: defaultLimit,
  filter = null,
  search: searchQuery = "",
  sort = [],
}: ProductGroupByTableProps) {
  const trpc = useTRPC();
  const { groupConfig } = useGroupConfig();

  // Expanded state via URL
  const [expanded] = useQueryState("expanded", parseAsExpanded.withDefault([]));

  // Build search filter from raw search string
  const searchableFields = getSearchableProperties(productProperties);
  const search = buildSearchFilter(searchQuery, searchableFields);

  // Fetch group counts from server
  // groupConfig is always defined since we have a default in useGroupConfig
  const { data: groupData } = useSuspenseQuery(
    trpc.product.getGroup.queryOptions({ groupBy: groupConfig })
  );

  // Convert to ViewCounts format for DataViewProvider
  const counts = useMemo(
    () => ({
      group: groupData.counts,
      groupSortValues: groupData.sortValues,
    }),
    [groupData.counts, groupData.sortValues]
  );

  // Get all group keys from the counts
  const allGroupKeys = useMemo(
    () => Object.keys(groupData.counts),
    [groupData.counts]
  );

  // Use unified infinite pagination with groupBy for per-group load more
  const { data, pagination, handleAccordionChange, expandedGroups } =
    useInfinitePagination({
      limit: defaultLimit,
      groupBy: {
        allGroupKeys,
        expanded,
      },
      queryOptions: (groupKey) =>
        trpc.product.getManyByGroup.infiniteQueryOptions(
          {
            groupBy: groupConfig,
            limit: defaultLimit,
            filter,
            search,
            sort,
            groupKeys: [groupKey],
          },
          {
            getNextPageParam: (lastPage) =>
              lastPage.hasNextPage[groupKey]
                ? { [groupKey]: lastPage.endCursor[groupKey] }
                : undefined,
          }
        ),
    });

  // Merge groupConfig with expanded state
  const fullGroupConfig = useMemo(() => {
    if (!groupConfig) {
      return undefined;
    }
    return {
      ...groupConfig,
      expanded: expandedGroups,
      onExpandedChange: handleAccordionChange,
      showCount: true,
    };
  }, [groupConfig, expandedGroups, handleAccordionChange]);

  return (
    <Suspense fallback={<TableSkeleton columnCount={5} rowCount={10} />}>
      <DataViewProvider
        counts={counts}
        data={data}
        filter={filter}
        group={fullGroupConfig}
        pagination={pagination}
        properties={productProperties}
        search={searchQuery}
        sort={sort}
      >
        <div className="border-b p-4 pt-0">
          <GroupSelector />
        </div>
        <TableView pagination="loadMore" wrapAllColumns={false} />
      </DataViewProvider>
    </Suspense>
  );
}
