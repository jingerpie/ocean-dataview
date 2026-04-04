"use client";

import { useInfiniteController } from "@sparkyidea/dataview/hooks";
import { DataViewProvider } from "@sparkyidea/dataview/providers";
import { NotionToolbar } from "@sparkyidea/dataview/toolbars/notion";
import type {
  GroupConfigInput,
  Limit,
  WhereNode,
} from "@sparkyidea/dataview/types";
import { ListView } from "@sparkyidea/dataview/views/list-view";
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
    >
      <NotionToolbar enableSettings>
        <DataViewTab options={productTabOptions} />
      </NotionToolbar>
      <ListView
        pagination="loadMore"
        stickyHeader={{ enabled: true, offset: 57 }}
      />
    </DataViewProvider>
  );
}
