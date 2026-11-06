"use client";

import {
  DataViewContent,
  DataViewProvider,
  DEFAULT_LIMIT,
  useInfiniteController,
} from "@jingerpie/dataview-react";
import { useNuqsDataViewState } from "@jingerpie/dataview-react/nuqs";
import { Suspense } from "react";
import { ListSkeleton } from "@/registry/base-nova/components/dataview/skeletons/list-skeleton";
import { ToolbarSkeleton } from "@/registry/base-nova/components/dataview/skeletons/toolbar-skeleton";
import { NotionToolbar } from "@/registry/base-nova/components/dataview/toolbars/notion/toolbar";
import { ListView } from "@/registry/base-nova/components/dataview/views/list-view/list-view";
import { useTRPC } from "@/utils/trpc/client";
import { DataViewTab } from "./dataview-tab";
import { productListProperties } from "./product-list-properties";
import { productTabOptions } from "./product-tab-options";

/**
 * Product List View - auto flat/grouped based on URL group param.
 *
 * NotionToolbar uses context from DataViewProvider (never suspends).
 * ListView may suspend while loading data.
 */
export function ProductListView() {
  const trpc = useTRPC();

  const state = useNuqsDataViewState();
  const limit = state.value.limit ?? DEFAULT_LIMIT;
  const { controller } = useInfiniteController({
    groupQuery: (params) =>
      trpc.product.getGroup.infiniteQueryOptions(params, {
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      }),

    dataQuery: (params) =>
      trpc.product.getMany.infiniteQueryOptions(params, {
        getNextPageParam: (lastPage) =>
          lastPage.hasNextPage ? lastPage.endCursor : undefined,
      }),
  });

  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-2">
          <ToolbarSkeleton enableSettings tabCount={productTabOptions.length} />
          <ListSkeleton
            pagination="loadMore"
            properties={productListProperties}
            rowCount={limit}
          />
        </div>
      }
    >
      <DataViewProvider
        controller={controller}
        properties={productListProperties}
        state={state}
      >
        <div className="flex flex-col gap-2">
          <NotionToolbar enableSettings>
            <DataViewTab options={productTabOptions} />
          </NotionToolbar>
          <DataViewContent>
            <ListView
              pagination="loadMore"
              stickyHeader={{ enabled: true, offset: 57 }}
            />
          </DataViewContent>
        </div>
      </DataViewProvider>
    </Suspense>
  );
}
