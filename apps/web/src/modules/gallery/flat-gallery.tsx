"use client";

import {
  INFINITE_FLAT_GROUP_KEY,
  useInfinitePagination,
} from "@sparkyidea/dataview/hooks";
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
import {
  type Product,
  productProperties,
} from "@/properties/product-properties";
import { buildSearchFilter } from "@/utils/search";
import { useTRPC } from "@/utils/trpc/client";
import { ViewTabs } from "./view-tabs";

/**
 * Flat Gallery - no grouping, infinite scroll pagination.
 *
 * Uses useInfinitePagination hook that returns a DataViewProvider
 * with pagination baked in.
 */
export function FlatGallery() {
  const trpc = useTRPC();

  const [filter] = useQueryState("filter", parseAsFilter);
  const [sort] = useQueryState("sort", parseAsSort);
  const [search] = useQueryState("search", parseAsString.withDefault(""));
  const [limit] = useQueryState("limit", limitServerParser);

  const searchableFields = getSearchableProperties(productProperties);
  const searchFilter = buildSearchFilter(search, searchableFields);

  const { DataViewProvider, isLoading, isEmpty, isPlaceholderData } =
    useInfinitePagination<Product>({
      groupKeys: [INFINITE_FLAT_GROUP_KEY],
      defaultLimit: limit,
      queryOptionsFactory: (_groupKey) =>
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

  // DataViewProvider MUST render for queries to execute
  return (
    <DataViewProvider
      filter={filter}
      properties={productProperties}
      search={search}
      sort={sort ?? []}
    >
      {isLoading && isEmpty ? (
        <GallerySkeleton cardCount={6} />
      ) : (
        <>
          <NotionToolbar enableSettings properties={productProperties}>
            <ViewTabs />
          </NotionToolbar>

          <div style={{ opacity: isPlaceholderData ? 0.7 : 1 }}>
            {isEmpty ? (
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
          </div>
        </>
      )}
    </DataViewProvider>
  );
}
