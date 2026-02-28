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
import { combineGroupFilter } from "@/utils/group-filter";
import { buildSearchFilter } from "@/utils/search";
import { useTRPC } from "@/utils/trpc/client";
import { bulkActions } from "./bulk-actions";
import { ViewTabs } from "./view-tabs";

const groupConfig = { bySelect: { property: "category" } } as const;

interface GroupTableProps {
  expanded: string[];
  filter: WhereNode[] | null;
  group: GroupConfigInput | null;
  limit: Limit;
  search: string;
  sort: { property: string; direction: "asc" | "desc" }[];
}

/**
 * Grouped Table - grouped by category with per-group pagination.
 *
 * Uses usePagePagination hook that returns a pagination controller
 * which is passed to DataViewProvider.
 */
export function GroupTable({
  expanded,
  filter,
  limit,
  search,
  sort,
}: GroupTableProps) {
  const trpc = useTRPC();

  const searchableFields = getSearchableProperties(productProperties);

  const { pagination } = usePagePagination({
    // Factory for group counts - used internally by QueryBridge
    groupQueryOptionsFactory: (groupCfg) =>
      trpc.product.getGroup.queryOptions({ groupBy: groupCfg }),

    // Factory for data items
    queryOptionsFactory: (params) =>
      trpc.product.getMany.queryOptions({
        cursors: params.cursor
          ? { [params.groupKey ?? "__ungrouped__"]: params.cursor }
          : undefined,
        filter: combineGroupFilter(
          params.groupConfig ?? groupConfig,
          params.groupKey ?? "",
          params.filter
        ),
        limit: params.limit,
        search: buildSearchFilter(params.search, searchableFields),
        sort: params.sort ?? [],
      }),
  });

  // DataViewProvider MUST render for queries to execute
  return (
    <DataViewProvider
      defaults={{
        expanded,
        filter,
        group: { ...groupConfig, showCount: true },
        limit,
        search,
        sort: sort ?? [],
      }}
      pagination={pagination}
      properties={productProperties}
    >
      <GroupTableContent />
    </DataViewProvider>
  );
}

function GroupTableContent() {
  const { isEmpty, isLoading, isPlaceholderData } = usePaginationState();

  if (isLoading && isEmpty) {
    return <TableSkeleton columnCount={5} rowCount={10} />;
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
        groupProperty="Category"
        properties={productProperties}
      >
        <ViewTabs />
      </NotionToolbar>

      <div style={{ opacity: isPlaceholderData ? 0.7 : 1 }}>
        <TableView
          bulkActions={bulkActions}
          pagination="page"
          showVerticalLines={false}
          wrapAllColumns={false}
        />
      </div>
    </>
  );
}
