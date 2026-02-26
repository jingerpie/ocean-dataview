"use client";

import { useInfinitePagination } from "@sparkyidea/dataview/hooks";
import { DataViewProvider } from "@sparkyidea/dataview/providers";
import { NotionToolbar } from "@sparkyidea/dataview/toolbars/notion";
import { getSearchableProperties } from "@sparkyidea/dataview/types";
import {
  GallerySkeleton,
  GalleryView,
} from "@sparkyidea/dataview/views/gallery-view";
import { parseAsFilter } from "@sparkyidea/shared/utils/parsers/filter";
import { limitServerParser } from "@sparkyidea/shared/utils/parsers/pagination";
import { parseAsSort } from "@sparkyidea/shared/utils/parsers/sort";
import { parseAsString, useQueryState } from "nuqs";
import { productProperties } from "@/properties/product-properties";
import { buildSearchFilter } from "@/utils/search";
import { useTRPC } from "@/utils/trpc/client";
import { ViewTabs } from "./view-tabs";

/**
 * Flat Gallery - no grouping, infinite scroll pagination.
 */
export function FlatGallery() {
  const trpc = useTRPC();

  const [filter] = useQueryState("filter", parseAsFilter);
  const [sort] = useQueryState("sort", parseAsSort);
  const [search] = useQueryState("search", parseAsString.withDefault(""));
  const [limit] = useQueryState("limit", limitServerParser);

  const searchableFields = getSearchableProperties(productProperties);
  const searchFilter = buildSearchFilter(search, searchableFields);

  const { data, pagination } = useInfinitePagination({
    limit,
    queryOptions: () =>
      trpc.product.getMany.infiniteQueryOptions(
        {
          limit,
          filter,
          search: searchFilter,
          sort: sort ?? [],
        },
        {
          getNextPageParam: (lastPage) =>
            lastPage.hasNextPage ? lastPage.endCursor : undefined,
        }
      ),
  });

  if (pagination.isLoading && data.length === 0) {
    return <GallerySkeleton cardCount={6} />;
  }

  return (
    <DataViewProvider
      data={data}
      filter={filter}
      pagination={pagination}
      properties={productProperties}
      search={search}
      sort={sort ?? []}
    >
      <NotionToolbar enableSettings properties={productProperties}>
        <ViewTabs />
      </NotionToolbar>

      {data.length === 0 ? (
        <div className="flex min-h-100 items-center justify-center">
          <p className="text-muted-foreground">No products found</p>
        </div>
      ) : (
        <GalleryView
          cardPreview="productImage"
          cardSize="medium"
          fitMedia
          pagination="infiniteScroll"
        />
      )}
    </DataViewProvider>
  );
}
