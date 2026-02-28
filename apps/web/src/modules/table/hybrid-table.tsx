"use client";

import {
  usePagePagination,
  usePaginationState,
} from "@sparkyidea/dataview/hooks";
import { DataViewProvider } from "@sparkyidea/dataview/providers";
import { NotionToolbar } from "@sparkyidea/dataview/toolbars/notion";
import { getSearchableProperties } from "@sparkyidea/dataview/types";
import {
  TableSkeleton,
  TableView,
} from "@sparkyidea/dataview/views/table-view";
import type { WhereNode } from "@sparkyidea/shared/types";
import type { Limit } from "@sparkyidea/shared/types/pagination.type";
import type { GroupConfigInput } from "@sparkyidea/shared/utils/parsers/group";
import { productProperties } from "@/properties/product-properties";
import { combineGroupFilter, getGroupProperty } from "@/utils/group-filter";
import { buildSearchFilter } from "@/utils/search";
import { useTRPC } from "@/utils/trpc/client";
import { bulkActions } from "./bulk-actions";
import { ViewTabs } from "./view-tabs";

interface HybridTableProps {
  expanded: string[];
  filter: WhereNode[] | null;
  group: GroupConfigInput | null;
  limit: Limit;
  search: string;
  sort: { property: string; direction: "asc" | "desc" }[];
  subGroup: GroupConfigInput | null;
}

/**
 * Hybrid Table - auto flat/grouped based on group param.
 *
 * Uses usePagePagination hook with groupQueryOptionsFactory for internal group fetching.
 * QueryBridge handles group data fetching and stale data detection automatically.
 */
export function HybridTable({
  expanded,
  filter,
  group,
  limit,
  search,
  sort,
  subGroup,
}: HybridTableProps) {
  const trpc = useTRPC();

  const searchableFields = getSearchableProperties(productProperties);

  // Get property label for toolbar display
  const groupProperty = getGroupProperty(group);
  const propertyMeta = productProperties.find((p) => p.id === groupProperty);
  const groupPropertyLabel = propertyMeta?.label ?? groupProperty ?? "";

  const { pagination } = usePagePagination({
    // Factory for group counts - called internally by QueryBridge when group is set
    groupQueryOptionsFactory: (groupConfig) =>
      trpc.product.getGroup.queryOptions({
        groupBy: groupConfig,
      }),

    // Factory for data items - receives groupConfig from internal state
    queryOptionsFactory: (params) =>
      trpc.product.getMany.queryOptions({
        cursors: params.cursor
          ? { [params.groupKey ?? "__ungrouped__"]: params.cursor }
          : undefined,
        filter:
          params.groupConfig && params.groupKey
            ? combineGroupFilter(
                params.groupConfig,
                params.groupKey,
                params.filter
              )
            : params.filter,
        limit: params.limit,
        search: buildSearchFilter(params.search, searchableFields),
        sort: params.sort ?? [],
      }),
  });

  // Add view options to group config
  const groupConfigForView = group ? { ...group, showCount: true } : undefined;

  return (
    <DataViewProvider
      defaults={{
        expanded: expanded.length > 0 ? expanded : undefined,
        filter,
        group: groupConfigForView,
        limit,
        search,
        sort: sort ?? [],
        subGroup,
      }}
      pagination={pagination}
      properties={productProperties}
    >
      <HybridTableContent
        groupPropertyLabel={group ? groupPropertyLabel : undefined}
      />
    </DataViewProvider>
  );
}

interface HybridTableContentProps {
  groupPropertyLabel?: string;
}

/**
 * HybridTableContent - Inner content component that accesses loading states.
 *
 * Uses usePaginationState() to get loading states from context.
 * Group loading is now handled internally by QueryBridge.
 */
function HybridTableContent({ groupPropertyLabel }: HybridTableContentProps) {
  const { isLoading, isEmpty, isPlaceholderData } = usePaginationState();

  if (isLoading && isEmpty) {
    return <TableSkeleton columnCount={5} rowCount={10} />;
  }

  return (
    <>
      <NotionToolbar
        enableSettings
        groupProperty={groupPropertyLabel}
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
  );
}
