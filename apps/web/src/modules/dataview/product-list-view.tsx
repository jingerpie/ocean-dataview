"use client";

import type {
  GroupConfigInput,
  Limit,
  WhereNode,
} from "@sparkyidea/dataview-core";
import {
  DataViewContent,
  DataViewProvider,
  useInfiniteController,
} from "@sparkyidea/dataview-react";
import { useNuqsDataViewState } from "@sparkyidea/dataview-react/nuqs";
import {
  ListSkeleton,
  ToolbarSkeleton,
} from "@sparkyidea/dataview-ui/skeletons";
import { NotionToolbar } from "@sparkyidea/dataview-ui/toolbars/notion";
import { ListView } from "@sparkyidea/dataview-ui/views/list-view";
import { Suspense } from "react";
import { useTRPC } from "@/utils/trpc/client";
import { DataViewTab } from "./dataview-tab";
import { productListProperties } from "./product-list-properties";
import { productTabOptions } from "./product-tab-options";

interface ProductListViewProps {
  filter: WhereNode[] | null;
  group: GroupConfigInput | null;
  limit: Limit;
  search: string;
  sort: { property: string; direction: "asc" | "desc" }[];
}

/**
 * Product List View - auto flat/grouped based on URL group param.
 *
 * NotionToolbar uses context from DataViewProvider (never suspends).
 * ListView may suspend while loading data.
 */
export function ProductListView({
  filter,
  group,
  limit,
  search,
  sort,
}: ProductListViewProps) {
  const trpc = useTRPC();

  const state = useNuqsDataViewState();
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

  // Add view options to group config
  const groupConfigForView = group ? { ...group, showCount: true } : undefined;

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
        defaults={{
          filter,
          group: groupConfigForView,
          limit,
          search,
          sort: sort ?? [],
        }}
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
