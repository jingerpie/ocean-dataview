"use client";

import { useInfiniteController } from "@sparkyidea/dataview/hooks";
import { DataViewProvider } from "@sparkyidea/dataview/providers";
import { NotionToolbar } from "@sparkyidea/dataview/toolbars/notion";
import type {
  ColumnConfigInput,
  GroupConfigInput,
  Limit,
  WhereNode,
} from "@sparkyidea/dataview/types";
import { BoardView } from "@sparkyidea/dataview/views/board-view";
import { useTRPC } from "@/utils/trpc/client";
import { DataViewTab } from "./dataview-tab";
import { productProperties } from "./product-properties";
import { productTabOptions } from "./product-tab-options";

interface ProductBoardViewProps {
  /** Column configuration (board columns) */
  column: ColumnConfigInput | null;
  filter: WhereNode[] | null;
  /** Group configuration (board rows/accordion) */
  group: GroupConfigInput | null;
  limit: Limit;
  search: string;
  sort: { property: string; direction: "asc" | "desc" }[];
}

/**
 * Product Board View - auto flat/grouped based on column param.
 *
 * NotionToolbar uses context from DataViewProvider (never suspends).
 * BoardView may suspend while loading data.
 */
export function ProductBoardView({
  column,
  filter,
  group,
  limit,
  search,
  sort,
}: ProductBoardViewProps) {
  const trpc = useTRPC();

  // Default column config for boards (always need columns)
  const defaultColumnConfig = {
    propertyType: "select",
    propertyId: "category",
  } as const;
  const effectiveColumnConfig = column ?? defaultColumnConfig;

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
  const groupConfigForView = group ? { ...group, showCount: true } : undefined;

  return (
    <DataViewProvider
      controller={controller}
      defaults={{
        column: columnConfigForView,
        filter,
        group: groupConfigForView,
        limit,
        search,
        sort: sort ?? [],
      }}
      properties={productProperties}
    >
      <NotionToolbar enableSettings>
        <DataViewTab options={productTabOptions} />
      </NotionToolbar>
      <BoardView
        cardPreview="productImage"
        cardSize="medium"
        colorColumns
        fitMedia
        pagination="loadMore"
        stickyHeader={{ enabled: true, offset: 57 }}
      />
    </DataViewProvider>
  );
}
