import { getSearchableProperties } from "@sparkyidea/dataview/types";
import { groupPaginationParams } from "@sparkyidea/shared/lib";
import type { SearchParams } from "@sparkyidea/shared/types";
import {
  buildSearchFilter,
  combineGroupFilter,
} from "@sparkyidea/shared/utils";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ProductGroupPaginationTable } from "@/modules/group-pagination/product-group-pagination-table";
import { productProperties } from "@/modules/group-pagination/product-properties";
import { getQueryClient, trpc } from "@/utils/trpc/server";

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export default async function GroupPaginationTablePage(props: PageProps) {
  const searchParams = await props.searchParams;
  const {
    cursors,
    expanded,
    limit,
    filter,
    sort,
    search: searchQuery,
  } = groupPaginationParams.parse(searchParams);

  const searchableFields = getSearchableProperties(productProperties);
  const search = buildSearchFilter(searchQuery ?? "", searchableFields);

  const queryClient = getQueryClient();

  // Prefetch group counts
  void queryClient.prefetchQuery(
    trpc.product.getGroup.queryOptions({
      groupBy: { bySelect: { property: "category" } },
    })
  );

  // Prefetch data for each expanded group (must match client query options)
  for (const groupKey of expanded) {
    const cursor = cursors[groupKey] ?? null;
    void queryClient.prefetchQuery(
      trpc.product.getMany.queryOptions({
        filter: combineGroupFilter("category", groupKey, filter),
        search,
        sort,
        cursor,
        limit,
      })
    );
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductGroupPaginationTable
        cursors={cursors}
        expanded={expanded}
        filter={filter}
        limit={limit}
        search={searchQuery}
        sort={sort}
      />
    </HydrationBoundary>
  );
}
