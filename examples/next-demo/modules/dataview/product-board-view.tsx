"use client";

import {
  DataViewContent,
  DataViewProvider,
  DEFAULT_LIMIT,
  useInfiniteController,
} from "@jingerpie/dataview-react";
import { useNuqsDataViewState } from "@jingerpie/dataview-react/nuqs";
import { Suspense } from "react";
import { BoardSkeleton } from "@/components/dataview/skeletons/board-skeleton";
import { ToolbarSkeleton } from "@/components/dataview/skeletons/toolbar-skeleton";
import { NotionToolbar } from "@/components/dataview/toolbars/notion/toolbar";
import { BoardView } from "@/components/dataview/views/board-view/board-view";
import { validateProductColumn } from "@/modules/dataview/validations";
import { useTRPC } from "@/utils/trpc/client";
import { DataViewTab } from "./dataview-tab";
import { productProperties } from "./product-properties";
import { productTabOptions } from "./product-tab-options";

/**
 * Product Board View - auto flat/grouped based on column param.
 *
 * NotionToolbar uses context from DataViewProvider (never suspends).
 * BoardView may suspend while loading data.
 */
export function ProductBoardView() {
  const trpc = useTRPC();

  const state = useNuqsDataViewState();
  const limit = state.value.limit ?? DEFAULT_LIMIT;

  // Boards always need columns; the URL column wins over this default
  const defaultColumnConfig = {
    propertyType: "select",
    propertyId: "category",
  } as const;
  const effectiveColumnConfig =
    validateProductColumn(state.value.column) ?? defaultColumnConfig;
  const { controller } = useInfiniteController({
    columnQuery: (params) => trpc.product.getGroup.queryOptions(params),

    groupQuery: (params) =>
      trpc.product.getGroup.infiniteQueryOptions(params, {
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      }),

    dataQuery: (params) =>
      trpc.product.getManyByColumn.infiniteQueryOptions(
        { ...params, columnBy: effectiveColumnConfig },
        {
          getNextPageParam: (lastPage) => {
            const hasAnyMore = Object.values(lastPage.hasNextPage).some(
              Boolean
            );
            if (!hasAnyMore) {
              return undefined;
            }
            return Object.fromEntries(
              Object.entries(lastPage.endCursor).map(([key, cursor]) => [
                key,
                cursor,
              ])
            );
          },
        }
      ),
  });

  // Prepare view configs and labels
  const columnConfigForView = { ...effectiveColumnConfig, showCount: true };

  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-2">
          <ToolbarSkeleton enableSettings tabCount={productTabOptions.length} />
          <BoardSkeleton
            cardSize="medium"
            cardsPerColumn={limit}
            pagination="loadMore"
            properties={productProperties}
            withImage
          />
        </div>
      }
    >
      <DataViewProvider
        controller={controller}
        defaults={{ column: columnConfigForView }}
        properties={productProperties}
        state={state}
      >
        <div className="flex flex-col gap-2">
          <NotionToolbar enableSettings>
            <DataViewTab options={productTabOptions} />
          </NotionToolbar>
          <DataViewContent>
            <BoardView
              cardPreview="productImage"
              cardSize="medium"
              colorColumns
              fitMedia
              pagination="loadMore"
              stickyHeader={{ enabled: true, offset: 57 }}
            />
          </DataViewContent>
        </div>
      </DataViewProvider>
    </Suspense>
  );
}
