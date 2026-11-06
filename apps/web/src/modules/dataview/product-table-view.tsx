"use client";

import {
  DataViewContent,
  DataViewProvider,
  DEFAULT_LIMIT,
  usePageController,
} from "@jingerpie/dataview-react";
import { useNuqsDataViewState } from "@jingerpie/dataview-react/nuqs";
import { Suspense } from "react";
import { TableSkeleton } from "@/registry/base-nova/components/dataview/skeletons/table-skeleton";
import { ToolbarSkeleton } from "@/registry/base-nova/components/dataview/skeletons/toolbar-skeleton";
import { NotionToolbar } from "@/registry/base-nova/components/dataview/toolbars/notion/toolbar";
import { TableView } from "@/registry/base-nova/components/dataview/views/table-view/table-view";
import { useTRPC } from "@/utils/trpc/client";
import { bulkActions } from "./bulk-actions";
import { DataViewTab } from "./dataview-tab";
import { productTabOptions } from "./product-tab-options";
import { productTableProperties } from "./product-table-properties";

/**
 * Product Table View - auto flat/grouped based on group param.
 *
 * NotionToolbar uses context from DataViewProvider (never suspends).
 * TableView may suspend while loading data.
 */
export function ProductTableView() {
  const trpc = useTRPC();

  const state = useNuqsDataViewState();
  const limit = state.value.limit ?? DEFAULT_LIMIT;
  const { controller } = usePageController({
    groupQuery: (params) =>
      trpc.product.getGroup.infiniteQueryOptions(params, {
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      }),

    dataQuery: (params) => trpc.product.getMany.queryOptions(params),
  });

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
