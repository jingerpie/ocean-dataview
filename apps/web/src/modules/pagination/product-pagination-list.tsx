"use client";

import { useInfinitePagination } from "@sparkyidea/dataview/hooks";
import { DataViewProvider } from "@sparkyidea/dataview/providers";
import { NotionToolbar } from "@sparkyidea/dataview/toolbars/notion";
import { getSearchableProperties } from "@sparkyidea/dataview/types";
import { ListSkeleton, ListView } from "@sparkyidea/dataview/views/list-view";
import type { Limit, SortQuery, WhereNode } from "@sparkyidea/shared/types";
import { buildSearchFilter } from "@sparkyidea/shared/utils";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { useTRPC } from "@/utils/trpc/client";
import { productProperties } from "./product-properties";
import { ViewNav } from "./view-nav";

interface ProductPaginationListProps {
  limit: Limit;
  filter?: WhereNode[] | null;
  /** Raw search string from URL (for UI display) */
  search?: string;
  sort?: SortQuery[];
}

/**
 * Product List with infinite pagination (infinite scroll).
 *
 * Pattern: Uses useSuspenseInfiniteQuery for data accumulation
 * - Data is appended automatically when scrolling near bottom
 * - Props are passed to DataViewProvider defaults
 * - Hooks read from defaults (server props), write to URL
 */
export function ProductPaginationList({
  limit: defaultLimit,
  filter = null,
  search: searchQuery = "",
  sort = [],
}: ProductPaginationListProps) {
  const trpc = useTRPC();

  // Build search filter from raw search string
  const searchableFields = getSearchableProperties(productProperties);
  const search = buildSearchFilter(searchQuery, searchableFields);

  // Infinite query using TRPC infiniteQueryOptions
  const infiniteQuery = useSuspenseInfiniteQuery(
    trpc.product.getMany.infiniteQueryOptions(
      {
        limit: defaultLimit,
        filter,
        search,
        sort,
      },
      {
        getNextPageParam: (lastPage) =>
          lastPage.hasNextPage ? lastPage.endCursor : undefined,
      }
    )
  );

  // Use the new hook for pagination state
  const { items, pagination } = useInfinitePagination({
    infiniteQuery,
    limit: defaultLimit,
  });

  return (
    <Suspense fallback={<ListSkeleton rowCount={8} />}>
      <DataViewProvider
        data={items}
        defaults={{
          filter,
          sort,
          search: searchQuery,
        }}
        pagination={pagination}
        properties={productProperties}
      >
        <NotionToolbar properties={productProperties}>
          <ViewNav />
        </NotionToolbar>

        {items.length === 0 ? (
          <div className="flex min-h-100 items-center justify-center">
            <p className="text-muted-foreground">No products found</p>
          </div>
        ) : (
          <ListView pagination="loadMore" />
        )}
      </DataViewProvider>
    </Suspense>
  );
}
