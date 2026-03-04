"use client";

import { usePagePagination } from "@sparkyidea/dataview/hooks";
import { DataViewProvider } from "@sparkyidea/dataview/providers";
import { NotionToolbar } from "@sparkyidea/dataview/toolbars/notion";
import { getSearchableProperties } from "@sparkyidea/dataview/types";
import { TableView } from "@sparkyidea/dataview/views/table-view";
import type { WhereNode } from "@sparkyidea/shared/types";
import type { Limit } from "@sparkyidea/shared/types/pagination.type";
import type { GroupConfigInput } from "@sparkyidea/shared/utils/parsers/group";
import { productProperties } from "@/properties/product-properties";
import { combineGroupFilter } from "@/utils/group-filter";
import { buildSearchFilter } from "@/utils/search";
import { useTRPC } from "@/utils/trpc/client";
import { bulkActions } from "./bulk-actions";

const groupConfig = { bySelect: { property: "category" } } as const;

interface GroupTableProps {
  filter: WhereNode[] | null;
  group: GroupConfigInput | null;
  limit: Limit;
  search: string;
  sort: { property: string; direction: "asc" | "desc" }[];
}

/**
 * Grouped Table - grouped by category with per-group pagination.
 *
 * NotionToolbar uses context from DataViewProvider (never suspends).
 * TableView may suspend while loading data.
 */
export function GroupTable({ filter, limit, search, sort }: GroupTableProps) {
  const trpc = useTRPC();
  const searchableFields = getSearchableProperties(productProperties);

  const { pagination } = usePagePagination({
    // Factory for group counts - used internally by QueryBridge
    groupQueryOptionsFactory: (groupCfg) =>
      trpc.product.getGroup.queryOptions({ groupBy: groupCfg }),

    // Factory for data items
    queryOptionsFactory: (params) =>
      trpc.product.getMany.queryOptions({
        ...(params.cursor ? { cursor: params.cursor } : {}),
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

  return (
    <DataViewProvider
      defaults={{
        filter,
        group: { ...groupConfig, showCount: true },
        limit,
        search,
        sort: sort ?? [],
      }}
      pagination={pagination}
      properties={productProperties}
    >
      <NotionToolbar enableSettings groupProperty="Category" />
      <TableView
        bulkActions={bulkActions}
        pagination="page"
        showVerticalLines={false}
        wrapAllColumns={false}
      />
    </DataViewProvider>
  );
}
