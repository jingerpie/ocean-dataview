"use client";

import { useInfiniteController } from "@sparkyidea/dataview/hooks";
import { DataViewProvider } from "@sparkyidea/dataview/providers";
import { NotionToolbar } from "@sparkyidea/dataview/toolbars/notion";
import { getSearchableProperties } from "@sparkyidea/dataview/types";
import { GalleryView } from "@sparkyidea/dataview/views/gallery-view";
import type { WhereNode } from "@sparkyidea/shared/types";
import type { Limit } from "@sparkyidea/shared/types/pagination.type";
import type { GroupConfigInput } from "@sparkyidea/shared/utils/parsers/group";
import { combineGroupFilter } from "@/utils/group-filter";
import { buildSearchFilter } from "@/utils/search";
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
  const searchableFields = getSearchableProperties(productProperties);

  const { controller } = useInfiniteController({
    groupQuery: (groupConfig) =>
      trpc.product.getGroup.infiniteQueryOptions(
        {
          groupBy: groupConfig,
          sort: groupConfig.sort,
          limit: 25,
        },
        { getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined }
      ),

    dataQuery: (params) =>
      trpc.product.getMany.infiniteQueryOptions(
        {
          filter:
            params.groupConfig && params.groupKey
              ? combineGroupFilter(
                  params.groupConfig,
                  params.groupKey,
                  params.filter
                )
              : params.filter,
          search: buildSearchFilter(params.search, searchableFields),
          sort: params.sort ?? [],
          limit: params.limit,
        },
        {
          getNextPageParam: (lastPage) =>
            lastPage.hasNextPage ? lastPage.endCursor : undefined,
        }
      ),
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
      properties={productProperties}
    >
      <NotionToolbar enableSettings>
        <DataViewTab options={productTabOptions} />
      </NotionToolbar>
      <GalleryView
        cardPreview="productImage"
        cardSize="medium"
        fitMedia
        pagination="loadMore"
      />
    </DataViewProvider>
  );
}
