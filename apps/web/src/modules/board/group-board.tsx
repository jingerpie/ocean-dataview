"use client";

import {
  useInfinitePagination,
  usePaginationState,
} from "@sparkyidea/dataview/hooks";
import { DataViewProvider } from "@sparkyidea/dataview/providers";
import { NotionToolbar } from "@sparkyidea/dataview/toolbars/notion";
import { getSearchableProperties } from "@sparkyidea/dataview/types";
import {
  BoardSkeleton,
  BoardView,
} from "@sparkyidea/dataview/views/board-view";
import type { WhereNode } from "@sparkyidea/shared/types";
import type { Limit } from "@sparkyidea/shared/types/pagination.type";
import type { GroupConfigInput } from "@sparkyidea/shared/utils/parsers/group";
import { productProperties } from "@/properties/product-properties";
import { combineGroupFilter } from "@/utils/group-filter";
import { buildSearchFilter } from "@/utils/search";
import { useTRPC } from "@/utils/trpc/client";
import { ViewTabs } from "./view-tabs";

// Group configs (hardcoded for this demo)
const columnGroupConfig = { bySelect: { property: "category" } } as const;
const rowGroupConfig = {
  byStatus: { property: "availability", showAs: "option" },
} as const;

interface GroupBoardProps {
  expanded: string[];
  filter: WhereNode[] | null;
  group: GroupConfigInput | null;
  limit: Limit;
  search: string;
  sort: { property: string; direction: "asc" | "desc" }[];
  subGroup: GroupConfigInput | null;
}

/**
 * Grouped Board - columns by category, rows by availability (sub-groups).
 *
 * Board grouping model:
 * - group (columns) = category, uses groupQueryOptionsFactory
 * - subGroup (rows) = availability, uses subGroupQueryOptionsFactory
 *
 * Both are handled by QueryBridge automatically.
 */
export function GroupBoard({
  expanded,
  filter,
  limit,
  search,
  sort,
}: GroupBoardProps) {
  const trpc = useTRPC();

  const searchableFields = getSearchableProperties(productProperties);

  const { pagination } = useInfinitePagination({
    // Factory for group counts (columns) - called internally by QueryBridge
    groupQueryOptionsFactory: (groupConfig) =>
      trpc.product.getGroup.queryOptions({ groupBy: groupConfig }),

    // Factory for subGroup counts (rows) - called internally by QueryBridge when subGroup is set
    subGroupQueryOptionsFactory: (subGroupConfig) =>
      trpc.product.getGroup.queryOptions({ groupBy: subGroupConfig }),

    // Factory for data items
    queryOptionsFactory: (params) =>
      trpc.product.getMany.infiniteQueryOptions(
        {
          filter: combineGroupFilter(
            params.groupConfig ?? rowGroupConfig,
            params.groupKey ?? "",
            params.filter
          ),
          search: buildSearchFilter(params.search, searchableFields),
          sort: params.sort ?? [],
          limit: params.limit,
        },
        {
          getNextPageParam: (lastPage) =>
            lastPage.hasNextPage ? lastPage.endCursor : undefined,
        }
      ),
  });

  return (
    <DataViewProvider
      defaults={{
        expanded: expanded.length > 0 ? expanded : undefined,
        filter,
        group: { ...columnGroupConfig, showCount: true },
        limit,
        search,
        sort: sort ?? [],
        subGroup: rowGroupConfig,
      }}
      pagination={pagination}
      properties={productProperties}
    >
      <GroupBoardContent />
    </DataViewProvider>
  );
}

function GroupBoardContent() {
  const { isEmpty, isLoading, isPlaceholderData } = usePaginationState();

  // Loading state - isLoading now includes subGroup loading from QueryBridge
  if (isLoading && isEmpty) {
    return <BoardSkeleton columnCount={4} />;
  }

  if (isEmpty) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <p className="text-muted-foreground">No products found</p>
      </div>
    );
  }

  return (
    <>
      <NotionToolbar
        enableSettings
        enableSubGroup
        groupProperty="Category"
        properties={productProperties}
        subGroupProperty="Availability"
      >
        <ViewTabs />
      </NotionToolbar>
      <div style={{ opacity: isPlaceholderData ? 0.7 : 1 }}>
        <BoardView
          cardPreview="productImage"
          cardSize="medium"
          colorColumns
          fitMedia
          pagination="loadMore"
        />
      </div>
    </>
  );
}
