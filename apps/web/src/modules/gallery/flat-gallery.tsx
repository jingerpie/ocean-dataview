"use client";

import {
  useInfinitePagination,
  usePaginationState,
} from "@sparkyidea/dataview/hooks";
import { DataViewProvider } from "@sparkyidea/dataview/providers";
import { NotionToolbar } from "@sparkyidea/dataview/toolbars/notion";
import { getSearchableProperties } from "@sparkyidea/dataview/types";
import {
  GallerySkeleton,
  GalleryView,
} from "@sparkyidea/dataview/views/gallery-view";
import type { WhereNode } from "@sparkyidea/shared/types";
import type { Limit } from "@sparkyidea/shared/types/pagination.type";
import { productProperties } from "@/properties/product-properties";
import { buildSearchFilter } from "@/utils/search";
import { useTRPC } from "@/utils/trpc/client";
import { ViewTabs } from "./view-tabs";

interface FlatGalleryProps {
  filter: WhereNode[] | null;
  limit: Limit;
  search: string;
  sort: { property: string; direction: "asc" | "desc" }[];
}

/**
 * Flat Gallery - no grouping, infinite scroll pagination.
 *
 * Uses useInfinitePagination hook that returns a pagination controller
 * which is passed to DataViewProvider.
 */
export function FlatGallery({ filter, sort, search, limit }: FlatGalleryProps) {
  const trpc = useTRPC();

  const searchableFields = getSearchableProperties(productProperties);

  const { pagination } = useInfinitePagination({
    queryOptionsFactory: (params) =>
      trpc.product.getMany.infiniteQueryOptions(
        {
          limit: params.limit,
          filter: params.filter,
          search: buildSearchFilter(params.search, searchableFields),
          sort: params.sort ?? [],
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
      defaults={{
        filter,
        limit,
        search,
        sort: sort ?? [],
      }}
      pagination={pagination}
      properties={productProperties}
    >
      <FlatGalleryContent />
    </DataViewProvider>
  );
}

function FlatGalleryContent() {
  const { isLoading, isEmpty, isPlaceholderData } = usePaginationState();

  if (isLoading && isEmpty) {
    return <GallerySkeleton cardCount={6} />;
  }

  return (
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
  );
}
