"use client";

import { usePageController } from "@sparkyidea/dataview/hooks";
import { DataViewProvider } from "@sparkyidea/dataview/providers";
import { NotionToolbar } from "@sparkyidea/dataview/toolbars/notion";
import type {
  GroupConfigInput,
  Limit,
  WhereNode,
} from "@sparkyidea/dataview/types";
import { TableView } from "@sparkyidea/dataview/views/table-view";
import { useTRPC } from "@/utils/trpc/client";
import { bulkActions } from "./bulk-actions";
import { DataViewTab } from "./dataview-tab";
import { productTabOptions } from "./product-tab-options";
import { productTableProperties } from "./product-table-properties";

interface ProductTableViewProps {
  filter: WhereNode[] | null;
  group: GroupConfigInput | null;
  limit: Limit;
  search: string;
  sort: { property: string; direction: "asc" | "desc" }[];
}

/**
 * Product Table View - auto flat/grouped based on group param.
 *
 * NotionToolbar uses context from DataViewProvider (never suspends).
 * TableView may suspend while loading data.
 */
export function ProductTableView({
  filter,
  group,
  limit,
  search,
  sort,
}: ProductTableViewProps) {
  const trpc = useTRPC();

  const { controller } = usePageController({
    groupQuery: (params) =>
      trpc.product.getGroup.infiniteQueryOptions(params, {
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      }),

    dataQuery: (params) => trpc.product.getMany.queryOptions(params),
  });

  // Add view options to group config
  const groupConfigForView = group ? { ...group, showCount: true } : undefined;

  return (
    <DataViewProvider
      controller={controller}
      defaults={{
        filter,
        group: groupConfigForView,
        limit,
        search,
        sort: sort ?? [],
      }}
      properties={productTableProperties}
    >
      <NotionToolbar enableSettings>
        <DataViewTab options={productTabOptions} />
      </NotionToolbar>
      <TableView
        bulkActions={bulkActions}
        pagination="page"
        showVerticalLines={false}
        stickyHeader={{ enabled: true, offset: 57 }}
        wrapAllProperties={false}
      />
    </DataViewProvider>
  );
}
