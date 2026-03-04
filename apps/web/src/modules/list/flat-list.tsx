"use client";

import { useInfinitePagination } from "@sparkyidea/dataview/hooks";
import { DataViewProvider } from "@sparkyidea/dataview/providers";
import { NotionToolbar } from "@sparkyidea/dataview/toolbars/notion";
import { getSearchableProperties } from "@sparkyidea/dataview/types";
import { ListView } from "@sparkyidea/dataview/views/list-view";
import type { WhereNode } from "@sparkyidea/shared/types";
import type { Limit } from "@sparkyidea/shared/types/pagination.type";
import { productProperties } from "@/properties/product-properties";
import { buildSearchFilter } from "@/utils/search";
import { useTRPC } from "@/utils/trpc/client";

interface FlatListProps {
  filter: WhereNode[] | null;
  limit: Limit;
  search: string;
  sort: { property: string; direction: "asc" | "desc" }[];
}

/**
 * Flat List - no grouping, infinite scroll pagination.
 *
 * NotionToolbar uses context from DataViewProvider (never suspends).
 * ListView may suspend while loading data.
 */
export function FlatList({ filter, sort, search, limit }: FlatListProps) {
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
      <NotionToolbar enableSettings />
      <ListView pagination="loadMore" />
    </DataViewProvider>
  );
}
