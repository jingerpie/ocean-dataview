"use client";

import {
  DataViewContent,
  DataViewProvider,
  DEFAULT_LIMIT,
  useInfiniteController,
} from "@jingerpie/dataview-react";
import { useNuqsDataViewState } from "@jingerpie/dataview-react/nuqs";
import { Suspense } from "react";
import { GallerySkeleton } from "@/components/dataview/skeletons/gallery-skeleton";
import { ToolbarSkeleton } from "@/components/dataview/skeletons/toolbar-skeleton";
import { NotionToolbar } from "@/components/dataview/toolbars/notion/toolbar";
import { GalleryView } from "@/components/dataview/views/gallery-view/gallery-view";
import { useTRPC } from "@/utils/trpc/client";
import { DataViewTab } from "./dataview-tab";
import { productProperties } from "./product-properties";
import { productTabOptions } from "./product-tab-options";

/**
 * Product Gallery View - auto flat/grouped based on URL group param.
 *
 * NotionToolbar uses context from DataViewProvider (never suspends).
 * GalleryView may suspend while loading data.
 */
export function ProductGalleryView() {
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
