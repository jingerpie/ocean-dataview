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
import { Suspense } from "react";
import { GallerySkeleton } from "@/registry/base-nova/components/dataview/skeletons/gallery-skeleton";
import { ToolbarSkeleton } from "@/registry/base-nova/components/dataview/skeletons/toolbar-skeleton";
import { NotionToolbar } from "@/registry/base-nova/components/dataview/toolbars/notion/toolbar";
import { GalleryView } from "@/registry/base-nova/components/dataview/views/gallery-view/gallery-view";
import { useTRPC } from "@/utils/trpc/client";
import { DataViewTab } from "./dataview-tab";
import { productProperties } from "./product-properties";
import { productTabOptions } from "./product-tab-options";

interface ProductGalleryViewProps {
  filter: WhereNode[] | null;
  group: GroupConfigInput | null;
  limit: Limit;
  search: string;
  sort: { property: string; direction: "asc" | "desc" }[];
}

/**
 * Product Gallery View - auto flat/grouped based on URL group param.
 *
 * NotionToolbar uses context from DataViewProvider (never suspends).
 * GalleryView may suspend while loading data.
 */
export function ProductGalleryView({
  filter,
  group,
  limit,
  search,
  sort,
}: ProductGalleryViewProps) {
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
          <GallerySkeleton
            cardCount={limit}
            cardLayout="compact"
            cardSize="medium"
            pagination="loadMore"
            properties={productProperties}
            withImage
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
        properties={productProperties}
        state={state}
      >
        <div className="flex flex-col gap-2">
          <NotionToolbar enableSettings>
            <DataViewTab options={productTabOptions} />
          </NotionToolbar>
          <DataViewContent>
            <GalleryView
              cardLayout="compact"
              cardPreview="productImage"
              cardSize="medium"
              fitMedia
              pagination="loadMore"
              showPropertyNames={true}
              stickyHeader={{ enabled: true, offset: 57 }}
            />
          </DataViewContent>
        </div>
      </DataViewProvider>
    </Suspense>
  );
}
