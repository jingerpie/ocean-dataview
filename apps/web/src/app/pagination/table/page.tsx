import { getSearchableProperties } from "@sparkyidea/dataview/types";
import { groupPaginationParams } from "@sparkyidea/shared/lib";
import type { SearchParams, WhereNode } from "@sparkyidea/shared/types";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ProductPaginationTable } from "@/modules/pagination/product-pagination-table";
import { productProperties } from "@/modules/pagination/product-properties";
import { combineGroupFilter, getGroupProperty } from "@/utils/group-filter";
import { buildSearchFilter } from "@/utils/search";
import { getQueryClient, trpc } from "@/utils/trpc/server";

const VIEW_DEFAULTS: { filter: WhereNode[] } = {
  filter: [],
};

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export default async function PaginationTablePage(props: PageProps) {
  const searchParams = await props.searchParams;
  const {
    cursors,
    expanded,
    filter: urlFilter,
    group,
    limit,
    search: searchQuery,
    sort,
  } = groupPaginationParams.parse(searchParams);

  const filter = urlFilter ?? VIEW_DEFAULTS.filter;
  const groupProperty = getGroupProperty(group);

  const searchableFields = getSearchableProperties(productProperties);
  const search = buildSearchFilter(searchQuery, searchableFields);

  const queryClient = getQueryClient();

  if (group && groupProperty) {
    // Grouped mode: prefetch group counts + data for expanded groups
    void queryClient.prefetchQuery(
      trpc.product.getGroup.queryOptions({
        groupBy: group,
      })
    );

    // Prefetch data for each expanded group
    for (const groupKey of expanded) {
      const cursor = cursors[groupKey] ?? null;
      void queryClient.prefetchQuery(
        trpc.product.getMany.queryOptions({
          filter: combineGroupFilter(groupProperty, groupKey, filter),
          search,
          sort,
          cursor,
          limit,
        })
      );
    }
  } else {
    // Flat mode: prefetch all data
    const cursor = cursors.__all__ ?? null;
    void queryClient.prefetchQuery(
      trpc.product.getMany.queryOptions({
        cursor,
        limit,
        filter,
        sort,
        search,
      })
    );
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductPaginationTable
        cursors={cursors}
        expanded={expanded}
        filter={filter}
        group={group}
        limit={limit}
        search={searchQuery}
        sorts={sort}
      />
    </HydrationBoundary>
  );
}
