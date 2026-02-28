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
import { combineGroupFilter, getGroupProperty } from "@/utils/group-filter";
import { buildSearchFilter } from "@/utils/search";
import { useTRPC } from "@/utils/trpc/client";
import { ViewTabs } from "./view-tabs";

interface HybridBoardProps {
  expanded: string[];
  filter: WhereNode[] | null;
  group: GroupConfigInput | null;
  limit: Limit;
  search: string;
  sort: { property: string; direction: "asc" | "desc" }[];
  subGroup: GroupConfigInput | null;
}

/**
 * Hybrid Board - auto flat/grouped based on group param.
 *
 * Board grouping model:
 * - group = columns (primary grouping, always present for boards)
 * - subGroup = rows (secondary grouping, board-specific)
 *
 * Uses groupQueryOptionsFactory for primary group (columns).
 * Uses subGroupQueryOptionsFactory for secondary group (rows).
 * Both are handled by QueryBridge automatically.
 */
export function HybridBoard({
  filter,
  sort,
  search,
  limit,
  expanded,
  group,
  subGroup,
}: HybridBoardProps) {
  const trpc = useTRPC();

  const groupProperty = getGroupProperty(group);
  const subGroupProperty = getGroupProperty(subGroup);
  const isSubGrouped = Boolean(subGroup && subGroupProperty);

  const searchableFields = getSearchableProperties(productProperties);

  // Default group config for boards (always need columns)
  const defaultGroupConfig = { bySelect: { property: "category" } } as const;
  const effectiveGroupConfig = group ?? defaultGroupConfig;
  const effectiveGroupProperty = groupProperty ?? "category";

  const { pagination } = useInfinitePagination({
    // Factory for group counts (columns) - called internally by QueryBridge
    groupQueryOptionsFactory: (groupConfig) =>
      trpc.product.getGroup.queryOptions({
        groupBy: groupConfig,
      }),

    // Factory for subGroup counts (rows) - called internally by QueryBridge when subGroup is set
    subGroupQueryOptionsFactory: (subGroupConfig) =>
      trpc.product.getGroup.queryOptions({
        groupBy: subGroupConfig,
      }),

    // Factory for data items
    queryOptionsFactory: (params) =>
      trpc.product.getMany.infiniteQueryOptions(
        {
          filter: combineGroupFilter(
            params.groupConfig ?? effectiveGroupConfig,
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

  // Prepare view configs and labels
  const groupConfigForView = { ...effectiveGroupConfig, showCount: true };
  const subGroupConfigForView = subGroup
    ? { ...subGroup, showCount: true }
    : undefined;

  // Get property labels
  const groupPropertyMeta = productProperties.find(
    (p) => p.id === effectiveGroupProperty
  );
  const groupPropertyLabel = groupPropertyMeta?.label ?? effectiveGroupProperty;

  const subGroupPropertyLabel = isSubGrouped
    ? (productProperties.find((p) => p.id === subGroupProperty)?.label ??
      subGroupProperty ??
      undefined)
    : undefined;

  return (
    <DataViewProvider
      defaults={{
        expanded: expanded.length > 0 ? expanded : undefined,
        filter,
        group: groupConfigForView,
        limit,
        search,
        sort: sort ?? [],
        subGroup: subGroupConfigForView,
      }}
      pagination={pagination}
      properties={productProperties}
    >
      <HybridBoardContent
        groupPropertyLabel={groupPropertyLabel}
        subGroupPropertyLabel={subGroupPropertyLabel}
      />
    </DataViewProvider>
  );
}

interface HybridBoardContentProps {
  groupPropertyLabel: string;
  subGroupPropertyLabel: string | undefined;
}

function HybridBoardContent({
  groupPropertyLabel,
  subGroupPropertyLabel,
}: HybridBoardContentProps) {
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
        groupProperty={groupPropertyLabel}
        properties={productProperties}
        subGroupProperty={subGroupPropertyLabel}
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
