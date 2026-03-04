"use client";

import { useInfinitePagination } from "@sparkyidea/dataview/hooks";
import { DataViewProvider } from "@sparkyidea/dataview/providers";
import { NotionToolbar } from "@sparkyidea/dataview/toolbars/notion";
import { getSearchableProperties } from "@sparkyidea/dataview/types";
import { ListView } from "@sparkyidea/dataview/views/list-view";
import type { WhereNode } from "@sparkyidea/shared/types";
import type { Limit } from "@sparkyidea/shared/types/pagination.type";
import type { GroupConfigInput } from "@sparkyidea/shared/utils/parsers/group";
import { productProperties } from "@/properties/product-properties";
import { combineGroupFilter } from "@/utils/group-filter";
import { buildSearchFilter } from "@/utils/search";
import { useTRPC } from "@/utils/trpc/client";

interface HybridListProps {
  filter: WhereNode[] | null;
  group: GroupConfigInput | null;
  limit: Limit;
  search: string;
  sort: { property: string; direction: "asc" | "desc" }[];
}

/**
 * Hybrid List - auto flat/grouped based on URL group param.
 *
 * NotionToolbar uses context from DataViewProvider (never suspends).
 * ListView may suspend while loading data.
 */
export function HybridList({
  filter,
  group,
  limit,
  search,
  sort,
}: HybridListProps) {
  const trpc = useTRPC();
  const searchableFields = getSearchableProperties(productProperties);

  const { pagination } = useInfinitePagination({
    // Factory for group counts - called internally by QueryBridge when group is set
    groupQueryOptionsFactory: (groupConfig) =>
      trpc.product.getGroup.queryOptions({
        groupBy: groupConfig,
      }),

    // Factory for data items - receives groupConfig from internal state
    queryOptionsFactory: (params) =>
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
      defaults={{
        filter,
        group: groupConfigForView,
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
