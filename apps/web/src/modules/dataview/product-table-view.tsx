"use client";

import type {
  GroupConfigInput,
  Limit,
  WhereNode,
} from "@sparkyidea/dataview-core";
import {
  DataViewContent,
  DataViewProvider,
  usePageController,
} from "@sparkyidea/dataview-react";
import { useNuqsDataViewState } from "@sparkyidea/dataview-react/nuqs";
import {
  TableSkeleton,
  ToolbarSkeleton,
} from "@sparkyidea/dataview-ui/skeletons";
import { NotionToolbar } from "@sparkyidea/dataview-ui/toolbars/notion";
import { TableView } from "@sparkyidea/dataview-ui/views/table-view";
import { Suspense } from "react";
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

  const state = useNuqsDataViewState();
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
    <Suspense
      fallback={
        <div className="flex flex-col gap-2">
          <ToolbarSkeleton enableSettings tabCount={productTabOptions.length} />
          <TableSkeleton
            bulkActions
            pagination="page"
            properties={productTableProperties}
            rowCount={limit}
          />
        </div>
      }
    >
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
        state={state}
      >
        <div className="flex flex-col gap-2">
          <NotionToolbar enableSettings>
            <DataViewTab options={productTabOptions} />
          </NotionToolbar>
          <DataViewContent>
            <TableView
              bulkActions={bulkActions}
              pagination="page"
              showVerticalLines={false}
              stickyHeader={{ enabled: true, offset: 57 }}
              wrapAllProperties={false}
            />
          </DataViewContent>
        </div>
      </DataViewProvider>
    </Suspense>
  );
}
